
// backend/routes/twimlConverse.js
const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const { VoiceResponse } = require("twilio").twiml;
const { runGeminiPrompt } = require("../services/geminiAgent");
const { synthesizeText } = require("../utils/ttsEngine");

const db = admin.firestore();

router.post("/start", async (req, res) => {
  const { ownerId, customerId } = req.query;
  if (!ownerId || !customerId) return res.status(400).send("Missing ownerId or customerId");

  const custRef = db.collection("customers").doc(ownerId).collection("customerList").doc(customerId);
  const [custSnap, cfgSnap] = await Promise.all([custRef.get(), db.collection("businessConfig").doc(ownerId).get()]);

  if (!custSnap.exists || !cfgSnap.exists) return res.status(404).send("Customer or config not found");

  const customer = custSnap.data();
  const config = cfgSnap.data();
  const voice = config.preferredVoice;
  const text = await runGeminiPrompt(customer, config);
  const audioPath = await synthesizeText(text, voice);
  const audioUrl = `${process.env.BASE_URL}/temp/${audioPath.split("/").pop()}`;

  const twiml = new VoiceResponse();
  const gather = twiml.gather({
    input: "speech",
    timeout: 6,
    action: `/twiml/converse/respond?ownerId=${ownerId}&customerId=${customerId}`,
    method: "POST"
  });
  gather.play(audioUrl);

  res.type("text/xml").send(twiml.toString());
});

router.post("/respond", async (req, res) => {
  const speech = req.body.SpeechResult || "";
  const { ownerId, customerId } = req.query;
  if (!ownerId || !customerId) return res.status(400).send("Missing ownerId or customerId");

  const custRef = db.collection("customers").doc(ownerId).collection("customerList").doc(customerId);
  const [custSnap, cfgSnap] = await Promise.all([custRef.get(), db.collection("businessConfig").doc(ownerId).get()]);
  if (!custSnap.exists || !cfgSnap.exists) return res.status(404).send("Customer or config not found");

  const customer = custSnap.data();
  const config = cfgSnap.data();
  const voice = config.preferredVoice;
  const text = await runGeminiPrompt(customer, config, speech);
  const audioPath = await synthesizeText(text, voice);
  const audioUrl = `${process.env.BASE_URL}/temp/${audioPath.split("/").pop()}`;

  const twiml = new VoiceResponse();
  const gather = twiml.gather({
    input: "speech",
    timeout: 6,
    action: `/twiml/converse/respond?ownerId=${ownerId}&customerId=${customerId}`,
    method: "POST"
  });
  gather.play(audioUrl);

  res.type("text/xml").send(twiml.toString());
});

module.exports = router;
