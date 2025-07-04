const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const path = require("path");

const { getTTSService } = require("../services/tts");



// Firestore DB
const db = admin.firestore();

// ✅ GET available voices (dynamic)
router.get("/voices", async (req, res) => {
  try {
    const ttsService = await getTTSService();
    const voices = await ttsService.getAvailableVoices();
    res.json(voices);
  } catch (err) {
    console.error("Error fetching voices:", err);
    res.status(500).json({ error: "Failed to fetch voices" });
  }
});

// ✅ POST synthesize voice (dynamic)
router.post("/speak", async (req, res) => {
  const { text, voice } = req.body;
  if (!text || !voice) return res.status(400).json({ error: "Missing text or voice" });

  try {
    const ttsService = await getTTSService();
    const audioResult = await ttsService.synthesizeSpeech(text, voice);

    if (typeof audioResult === "string") {
      // File path (Coqui)
      res.sendFile(path.resolve(audioResult));
    } else {
      // Buffer (Google)
      res.set("Content-Type", "audio/mpeg");
      res.send(audioResult);
    }
  } catch (err) {
    console.error("Error synthesizing speech:", err);
    res.status(500).json({ error: "Failed to synthesize voice" });
  }
});

// ✅ POST save preferred voice
router.post("/save-preference", async (req, res) => {
  const { voice, ownerId } = req.body;
  if (!voice || !ownerId) return res.status(400).json({ error: "Missing voice or ownerId" });

  try {
    await db.collection("businessConfig").doc(ownerId).set(
      { preferredVoice: voice },
      { merge: true }
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Error saving preferred voice:", err);
    res.status(500).json({ error: "Failed to save voice" });
  }
});

// ✅ GET preferred voice for owner
router.get("/preferred/:uid", async (req, res) => {
  const { uid } = req.params;
  if (!uid) return res.status(400).json({ error: "Missing user ID" });

  try {
    const docRef = db.collection("businessConfig").doc(uid);
    const configSnap = await docRef.get();

    if (!configSnap.exists) {
      return res.status(404).json({ error: "Voice config not found" });
    }

    const data = configSnap.data();
    res.json({ preferredVoice: data.preferredVoice || "en-US-Wavenet-A" });
  } catch (err) {
    console.error("Failed to fetch preferred voice:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
