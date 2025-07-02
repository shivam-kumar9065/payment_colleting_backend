// backend/utils/sttEngine.js
const { transcribe } = require("../services/stt");

/**
 * Transcribes an audio file using the selected STT provider (Google or Whisper)
 * @param {string} filePath - Path to the audio file
 * @returns {Promise<string>} - Transcribed text
 */
async function transcribeAudio(filePath) {
  return await transcribe(filePath);
}

module.exports = { transcribeAudio };
