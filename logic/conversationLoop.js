const admin = require("firebase-admin");
const { transcribe } = require("../services/whisperSTT");
const { runGeminiPrompt } = require("../services/geminiAgent");
const { synthesizeSpeech } = require("../services/ttsEngine"); // Google or Coqui
const fs = require("fs");
const path = require("path");

const db = admin.firestore();

/**
 * Handles one full interaction cycle with customer.
 * In production, this would be triggered during a Twilio call session.
 * @param {string} ownerId 
 * @param {string} customerId 
 */
async function handleConversation(ownerId, customerId) {
  // Step 1: Fetch customer and config
  const customerSnap = await db
    .collection("customers")
    .doc(ownerId)
    .collection("customerList")
    .doc(customerId)
    .get();

  const configSnap = await db.doc(`businessConfigs/${ownerId}`).get();

  if (!customerSnap.exists || !configSnap.exists) {
    throw new Error("Customer or config not found");
  }

  const customer = customerSnap.data();
  const config = configSnap.data();

  // 💡 Simulate loop: in real call, you'd listen+respond continuously
  const audioFile = path.join(__dirname, "../../sample-audio/user-reply.wav");
  console.log("🎧 Transcribing audio...");
  const transcript = await transcribe(audioFile);
  console.log("🗣️ Customer said:", transcript);

  console.log("💬 Sending to Gemini...");
  const aiReply = await runGeminiPrompt(customer, config, transcript);
  console.log("🤖 Gemini replied:", aiReply);

  console.log("🎙️ Synthesizing voice...");
  const outputFile = path.join(__dirname, "../../output/response.wav");
  await synthesizeSpeech(aiReply, outputFile);
  console.log("✅ Audio generated at:", outputFile);

  // Optional: Update conversation log in Firestore
  await db.collection(`callLogs/${ownerId}/sessions`).add({
    customerId,
    transcript,
    aiReply,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });
}

module.exports = { handleConversation };
