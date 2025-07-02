const express = require("express");
const router = express.Router();
const { processDailyQueue } = require("../controllers/processDailyQueue");

router.post("/run-daily-queue", async (req, res) => {
  const ownerId = req.body.ownerId;
  if (!ownerId) return res.status(400).json({ error: "Missing ownerId" });

  try {
    await processDailyQueue(ownerId);
    res.json({ success: true, message: "Daily queue processed" });
  } catch (err) {
    console.error("🔥 Error processing daily queue:", err);
    res.status(500).json({ error: "Failed to process queue" });
  }
});

module.exports = router;
