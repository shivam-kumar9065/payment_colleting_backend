// backend/routes/twimlHandler.js
const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const { VoiceResponse } = require("twilio").twiml;
const { generateTTS } = require("../services/tts/coquiTTS");
const { runGeminiPrompt } = require("../services/geminiAgent");

const db = admin.firestore();

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

    const configDoc = await db
      .collection("businessConfigs")
      .doc(ownerId)
      .get();

    if (!customerDoc.exists || !configDoc.exists) {
      return res.status(404).send("Customer or config not found");
    }

    const customer = customerDoc.data();
    const config = configDoc.data();

    // 🔮 Generate Gemini reply
    const geminiReply = await runGeminiPrompt(customer, config);

    // 🎙️ Generate TTS audio from Gemini reply
    const audioUrl = await generateTTS(geminiReply); // e.g., /audio/output_123.wav

    // 🎯 Build TwiML with <Play>
    const response = new VoiceResponse();
    response.play(`${process.env.BASE_URL}${audioUrl}`);

    res.type("text/xml").send(response.toString());

  } catch (err) {
    console.error("❌ TwiML generation failed:", err);
    res.status(500).send("Server error");
  }
});

module.exports = router;
