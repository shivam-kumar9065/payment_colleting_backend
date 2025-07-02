// backend/utils/serviceSelector.js
const admin = require("firebase-admin");

let cachedSettings = null;
let lastFetched = 0;
const CACHE_DURATION = 60 * 1000; // 1 minute

async function getServiceSettings() {
  const now = Date.now();
  if (cachedSettings && now - lastFetched < CACHE_DURATION) {
    return cachedSettings;
  }

  try {
    // ✅ Correct Firestore path: systemSettings > general (document)
    const snap = await admin.firestore()
      .collection("systemSettings")
      .doc("general")
      .get();

    if (snap.exists) {
      cachedSettings = snap.data();
      lastFetched = now;
      return cachedSettings;
    } else {
      cachedSettings = {
        sttService: "google",
        ttsService: "google",
      };
      return cachedSettings;
    }
  } catch (err) {
    console.error("❌ Error fetching system settings:", err);
    return {
      sttService: "google",
      ttsService: "google",
    }; // Fallback
  }
}

module.exports = { getServiceSettings };
