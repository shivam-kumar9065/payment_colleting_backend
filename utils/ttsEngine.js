// backend/utils/ttsEngine.js
const { synthesize } = require("../services/tts");

/**
 * Synthesizes speech using the selected TTS provider (Google or Coqui)
 * @param {string} text - The message to speak
 * @param {string} voice - Optional voice setting (used for Google TTS only)
 * @returns {Promise<string>} - Path to generated audio file
 */
async function synthesizeText(text, voice = "en-US-Wavenet-A") {
  return await synthesize(text, voice);
}

module.exports = { synthesizeText };
