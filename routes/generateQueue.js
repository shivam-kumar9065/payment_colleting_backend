const express = require('express');
const { admin } = require('../firebase');
const router = express.Router();

const db = admin.firestore();

router.get('/generate-queue', async (req, res) => {
  try {
    const uid = req.query.uid;
    if (!uid) return res.status(400).json({ error: 'Missing uid' });

    const configSnap = await db.doc(`businessConfigs/${uid}`).get();
    if (!configSnap.exists) {
      return res.status(404).json({ error: 'No config found' });
    }

    const config = configSnap.data();
    const startHour = parseInt((config.startTime || '09:00').split(':')[0], 10);
    const endHour = parseInt((config.endTime || '18:00').split(':')[0], 10);
    const dailyLimit = parseInt(config.dailyLimit || '3');

    const now = new Date();
    const currentHour = now.getHours();
    const todayStr = now.toISOString().split('T')[0];

    // TEMP: Commenting out time check for debugging
    // if (currentHour < startHour || currentHour >= endHour) {
    //   return res.status(200).json({ queue: [], reason: 'Outside call window' });
    // }

    const customerSnap = await db
      .collection("customers")
      .doc(uid)
      .collection("customerList")
      .where('status', '!=', 'Paid')
      .get();

    const queue = [];

    customerSnap.forEach(doc => {
      const data = doc.data();

      const nextContact = data.nextContactDate || todayStr;
      const attempts = data.dailyCallAttempts || 0;

      if (nextContact <= todayStr && attempts < dailyLimit) {
        queue.push({
          id: doc.id,
          name: data.name,
          phone: data.phone,
          amount: data.amount,
          status: data.status,
          nextContactDate: data.nextContactDate || null,
          dailyCallAttempts: data.dailyCallAttempts || 0,
          remarks: data.remarks || ""
        });
      }
    });

    // Sort queue (oldest contact date + fewest attempts first)
    queue.sort((a, b) => {
      if (a.nextContactDate !== b.nextContactDate) {
        return a.nextContactDate.localeCompare(b.nextContactDate);
      }
      return a.dailyCallAttempts - b.dailyCallAttempts;
    });

    res.json({ queue });

  } catch (err) {
    console.error('🔥 Error generating queue:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
