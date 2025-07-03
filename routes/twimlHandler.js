// // backend/routes/twimlHandler.js
// const express = require("express");
// const router = express.Router();
// const admin = require("firebase-admin");
// const { VoiceResponse } = require("twilio").twiml;
// const { generateTTS } = require("../services/tts/coquiTTS");
// const { runGeminiPrompt } = require("../services/geminiAgent");

// const db = admin.firestore();

// router.post("/", async (req, res) => {
//   const { ownerId, customerId } = req.query;

//   if (!ownerId || !customerId) {
//     return res.status(400).send("Missing ownerId or customerId");
//   }

//   try {
//     const customerDoc = await db
//       .collection("customers")
//       .doc(ownerId)
//       .collection("customerList")
//       .doc(customerId)
//       .get();

//     const configDoc = await db
//       .collection("businessConfigs")
//       .doc(ownerId)
//       .get();

//     if (!customerDoc.exists || !configDoc.exists) {
//       return res.status(404).send("Customer or config not found");
//     }

//     const customer = customerDoc.data();
//     const config = configDoc.data();

//     // 🔮 Generate Gemini reply
//     const geminiReply = await runGeminiPrompt(customer, config);

//     // 🎙️ Generate TTS audio from Gemini reply
//     const audioUrl = await generateTTS(geminiReply); // e.g., /audio/output_123.wav

//     // 🎯 Build TwiML with <Play>
//     const response = new VoiceResponse();
//     response.play(`${process.env.BASE_URL}${audioUrl}`);

//     res.type("text/xml").send(response.toString());

//   } catch (err) {
//     console.error("❌ TwiML generation failed:", err);
//     res.status(500).send("Server error");
//   }
// });

// module.exports = router;









// ✅ backend/routes/twimlHandler.js
const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const { VoiceResponse } = require("twilio").twiml;
const { generateTTS } = require("../services/tts/coquiTTS");
const { runGeminiPrompt } = require("../services/geminiAgent");

const db = admin.firestore();

// 🎯 TwiML Response route
router.post("/", async (req, res) => {
  const { ownerId, customerId } = req.query;

  if (!ownerId || !customerId) {
    return res.status(400).send("Missing ownerId or customerId");
  }

  try {
    const customerDoc = await db
      .collection("customers")
      .doc(ownerId)
      .collection("customerList")
      .doc(customerId)
      .get();

    const configDoc = await db.collection("businessConfigs").doc(ownerId).get();

    if (!customerDoc.exists || !configDoc.exists) {
      return res.status(404).send("Customer or config not found");
    }

    const customer = customerDoc.data();
    const config = configDoc.data();

    const geminiReply = await runGeminiPrompt(customer, config);
    const audioUrl = await generateTTS(geminiReply); // e.g., /temp/xyz.mp3

    const response = new VoiceResponse();
    response.play(`${process.env.BASE_URL}${audioUrl}`);
    res.type("text/xml").send(response.toString());

  } catch (err) {
    console.error("❌ TwiML generation failed:", err.message);
    res.status(500).send("Server error");
  }
});

// ✅ Call status handler
router.post("/call-status", async (req, res) => {
  const { CallStatus, To } = req.body;

  try {
    const snapshot = await db
      .collectionGroup("customerList")
      .where("phone", "==", To)
      .limit(1)
      .get();

    if (snapshot.empty) {
      console.warn(`⚠️ No customer found for phone: ${To}`);
      return res.sendStatus(200);
    }

    const doc = snapshot.docs[0];
    const ownerId = doc.ref.parent.parent.id;
    const customerId = doc.id;

    let newStatus = "pending";
    if (CallStatus === "completed") newStatus = "completed";
    else if (["no-answer", "busy", "failed", "canceled"].includes(CallStatus)) newStatus = "not-answered";

    await db
      .collection("customers")
      .doc(ownerId)
      .collection("customerList")
      .doc(customerId)
      .update({ callStatus: newStatus });

    console.log(`📞 Call status updated: ${To} => ${newStatus}`);
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Error handling call status:", err.message);
    res.sendStatus(500);
  }
});

module.exports = router;

