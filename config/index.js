const admin = require("firebase-admin");

// Firestore reference
const db = admin.firestore();

// Default fallback (in case Firestore is not configured yet)
const DEFAULTS = {
  tts: "google",    // or "coqui"
  stt: "google",    // or "whisper"
};

/**
 * Fetch global AI service config set by admin from Firestore
 * Assumes there's a single doc in `systemSettings/general`
 */
async function getServiceConfig() {
  try {
    const doc = await db.collection("systemSettings").doc("general").get();
    if (!doc.exists) {
      return DEFAULTS;
    }
    const data = doc.data();
    return {
      tts: data.ttsService || DEFAULTS.tts,
      stt: data.sttService || DEFAULTS.stt,
    };
  } catch (err) {
    console.error("❌ Error reading TTS/STT config:", err);
    return DEFAULTS;
  }
}

module.exports = {
  getServiceConfig,
};
