// // backend/utils/ttsEngine.js
// const { synthesize } = require("../services/tts");

// /**
//  * Synthesizes speech using the selected TTS provider (Google or Coqui)
//  * @param {string} text - The message to speak
//  * @param {string} voice - Optional voice setting (used for Google TTS only)
//  * @returns {Promise<string>} - Path to generated audio file
//  */
// async function synthesizeText(text, voice = "hi-lN-Chirp3-HD-Despina (FEMALE)") {
//   return await synthesize(text, voice);
// }

// module.exports = { synthesizeText };




// // ✅ backend/utils/ttsEngine.js
// const { synthesize } = require("../services/tts");
// const admin = require("firebase-admin");

// const db = admin.firestore();

// /**
//  * Synthesizes speech using selected TTS provider (Google or Coqui)
//  * @param {string} text - Message to convert to audio
//  * @param {string} ownerId - Used to fetch preferredVoice from Firestore
//  * @returns {Promise<string>} - Path to generated audio file
//  */
// async function synthesizeText(text, ownerId) {
//   let voice = "en-IN-Wavenet-C"; // default fallback

//   try {
//     const configSnap = await db.collection("businessConfigs").doc(ownerId).get();
//     if (configSnap.exists && configSnap.data().preferredVoice) {
//       voice = configSnap.data().preferredVoice;
//     }
//   } catch (err) {
//     console.warn("⚠️ Failed to fetch preferredVoice, using default.", err.message);
//   }

//   return await synthesize(text, voice);
// }

// module.exports = { synthesizeText };







// backend/utils/ttsEngine.js
const { synthesize } = require("../services/tts");
const admin = require("firebase-admin");

async function getPreferredVoice(businessId) {
  try {
    const doc = await admin.firestore().collection("businessConfigs").doc(businessId).get();
    if (doc.exists) {
      return doc.data().preferredVoice;
    }
  } catch (err) {
    console.error("🔥 Error fetching preferred voice:", err);
  }
  return "";
}

async function synthesizeText(text, businessId) {
  const preferredVoice = await getPreferredVoice(businessId);
  return await synthesize(text, preferredVoice);
}

module.exports = { synthesizeText };
