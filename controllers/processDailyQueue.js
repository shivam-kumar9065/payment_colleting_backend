// ✅ backend/jobs/processDailyQueue.js

const admin = require("firebase-admin");
const db = admin.firestore();

const { runGeminiPrompt } = require("../services/geminiAgent");
const { getTTSService } = require("../services/tts");
const { triggerAICall } = require("../utils/twilioClient");

async function processDailyQueue(ownerId) {
  const configSnap = await db.doc(`businessConfig/${ownerId}`).get();
  if (!configSnap.exists) {
    console.warn("❌ No business config found");
    return;
  }

  const config = configSnap.data();
  const dailyLimit = parseInt(config.dailyLimit || "3");
  const today = new Date().toISOString().split("T")[0];

  const customersSnap = await db
    .collection("customers")
    .doc(ownerId)
    .collection("customerList")
    .where("status", "!=", "Paid")
    .get();

  const eligibleCustomers = customersSnap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((c) => {
      const nextDate = c.nextContactDate || today;
      const attempts = c.dailyCallAttempts || 0;
      return nextDate <= today && attempts < dailyLimit;
    });

  for (const customer of eligibleCustomers) {
    try {
      const message = await runGeminiPrompt(customer, config);

      const ttsEngine = await getTTSService();
      const audioPath = await ttsEngine.synthesize(
        message,
        customer.preferredVoice || "en-US-Wavenet-A"
      );

      await triggerAICall({
        ownerId,
        customerId: customer.id,
        phoneNumber: customer.phone,
        audioPath,
      });

      await db
        .collection("customers")
        .doc(ownerId)
        .collection("customerList")
        .doc(customer.id)
        .update({
          callStatus: "called",
          lastCall: admin.firestore.FieldValue.serverTimestamp(),
          dailyCallAttempts: (customer.dailyCallAttempts || 0) + 1,
        });

      console.log(`✅ Called ${customer.name} at ${customer.phone}`);
    } catch (err) {
      console.error("❌ Failed to process customer:", customer.name, err);
    }
  }
}

module.exports = { processDailyQueue };
