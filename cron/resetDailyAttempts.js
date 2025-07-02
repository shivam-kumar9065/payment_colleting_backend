// ✅ backend/cron/resetDailyAttempts.js

const admin = require("firebase-admin");
const cron = require("node-cron");

const db = admin.firestore();

/**
 * Reset daily call attempt counts for all owners
 */
async function resetAllOwnersAttempts() {
  try {
    const usersSnap = await db.collection("users").get();
    const ownerIds = usersSnap.docs.map(doc => doc.id);

    for (const ownerId of ownerIds) {
      const customersRef = db
        .collection("customers")
        .doc(ownerId)
        .collection("customerList");

      const snapshot = await customersRef.get();

      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          dailyCallAttempts: 0,
        });
      });

      await batch.commit();
      console.log(`✅ Reset attempts for owner: ${ownerId}`);
    }
  } catch (err) {
    console.error("❌ Cron job failed:", err);
  }
}

// 🇮🇳 Schedule job at 12:00 AM IST daily (UTC+5:30)
cron.schedule("30 18 * * *", () => {
  console.log("🕛 Running daily attempt reset cron...");
  resetAllOwnersAttempts();
});

module.exports = { resetAllOwnersAttempts };
