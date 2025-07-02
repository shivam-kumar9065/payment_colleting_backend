// ✅ backend/services/stt/googleSTT.js
const fs = require("fs");
const speech = require("@google-cloud/speech");
const client = new speech.SpeechClient();

/**
 * Transcribe audio using Google STT with configurable language support.
 * @param {string} filePath - Path to audio file
 * @param {string} languageCode - e.g., 'hi-IN', 'ta-IN', 'en-IN'
 */
async function transcribeWithGoogleSTT(filePath, languageCode = "en-IN") {
  const audio = {
    content: fs.readFileSync(filePath).toString("base64"),
  };

  const config = {
    encoding: "LINEAR16",
    sampleRateHertz: 16000,
    languageCode,
    enableAutomaticPunctuation: true,
    model: "default",
  };

  const request = { audio, config };

  try {
    const [response] = await client.recognize(request);
    const transcript = response.results.map((r) => r.alternatives[0].transcript).join(" ");
    return transcript || "No speech detected.";
  } catch (err) {
    console.error("🛑 Google STT error:", err.message);
    return "STT failed";
  }
}

module.exports = { transcribeWithGoogleSTT };
