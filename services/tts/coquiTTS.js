// ✅ backend/services/tts/coquiTTS.js
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

/**
 * Generate audio from text using Coqui TTS (via Python)
 */
async function synthesizeSpeech(text) {
  const filename = `coqui-${Date.now()}.wav`;
  const outputPath = path.join(__dirname, "../../temp", filename);

  return new Promise((resolve, reject) => {
    const cmd = `python3 python/tts_generate.py "${text}" "${outputPath}"`;

    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        console.error("🛑 Coqui TTS error:", err.message);
        return reject(err);
      }

      if (!fs.existsSync(outputPath)) {
        return reject(new Error("Audio file not generated."));
      }

      console.log("✅ Coqui TTS generated:", outputPath);
      resolve(outputPath); // Full path to temp audio file
    });
  });
}

/**
 * Dummy voice list for Coqui (static, single-voice system)
 */
async function getAvailableVoices() {
  return [
    {
      name: "coqui-default",
      lang: "en-US",
      gender: "NEUTRAL",
    },
  ];
}

module.exports = { synthesizeSpeech, getAvailableVoices };
