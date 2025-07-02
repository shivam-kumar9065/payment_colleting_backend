const express = require("express");
const router = express.Router();
const axios = require("axios");
const fs = require("fs");
const { transcribeAudio } = require("../services/stt/whisperSTT");
const { runGeminiPrompt } = require("../services/geminiAgent");
const { generateTTS } = require("../services/tts/coquiTTS");

router.post("/", async (req, res) => {
  const { RecordingUrl, ownerId, customerId } = req.body;

  if (!RecordingUrl || !ownerId || !customerId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Step 1: Download recording (Twilio gives .wav without extension)
    const audioFile = `/tmp/recording-${Date.now()}.wav`;
    const writer = fs.createWriteStream(audioFile);
    const response = await axios.get(`${RecordingUrl}.wav`, { responseType: "stream" });
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    // Step 2: Transcribe audio using Whisper
    const transcription = await transcribeAudio(audioFile);
    console.log("📝 Transcription:", transcription);

    // Step 3: Send to Gemini for reply
    const customer = { name: "Customer", phone: "XXXX", amount: "XXX" }; // For now dummy
    const config = { businessName: "Your Store" };
    const reply = await runGeminiPrompt({ ...customer, message: transcription }, config);

    // Step 4: Convert Gemini reply to audio
    const audioUrl = await generateTTS(reply);

    // Respond with the audio URL
    res.json({ audioUrl });

  } catch (err) {
    console.error("❌ Whisper webhook error:", err.message);
    res.status(500).json({ error: "Whisper STT failed" });
  }
});

module.exports = router;
