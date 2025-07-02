// ✅ backend/services/tts/index.js

const { getServiceSettings } = require("../../utils/serviceSelector");
const coquiTTS = require("./coquiTTS");
const googleTTS = require("./googleTTS");

/**
 * Dynamically returns the selected TTS service instance.
 */
async function getTTSService() {
  const { ttsService } = await getServiceSettings();

  if (ttsService === "coqui") {
    return coquiTTS;
  } else if (ttsService === "google") {
    return googleTTS;
  } else {
    throw new Error(`Unsupported TTS service: ${ttsService}`);
  }
}

/**
 * Universal synthesize function that delegates to the correct provider.
 * Use this if you want a simple one-call interface.
 */
async function synthesize(text, voice = "en-US-Wavenet-A") {
  const service = await getTTSService();
  return service.synthesizeSpeech(text, voice);
}

module.exports = {
  getTTSService,
  synthesize,
};
