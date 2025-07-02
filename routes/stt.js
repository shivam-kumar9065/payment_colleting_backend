const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const upload = multer({ dest: "temp/" });

const { getSTTService } = require("../services/stt");

// ✅ POST: Transcribe audio dynamically using Whisper or Google
router.post("/transcribe", upload.single("audio"), async (req, res) => {
  const audioPath = req.file?.path;
  if (!audioPath) return res.status(400).json({ error: "Audio file required" });

  try {
    const sttService = await getSTTService();
    const transcript = await sttService.transcribe(audioPath);
    fs.unlink(audioPath, () => {}); // Optional cleanup
    res.json({ transcript });
  } catch (err) {
    console.error("STT error:", err);
    res.status(500).json({ error: "Failed to transcribe" });
  }
});

module.exports = router;
