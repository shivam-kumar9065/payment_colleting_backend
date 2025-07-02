// backend/routes/startCalls.js
const express = require("express");
const router = express.Router();
const { processCallsForOwner } = require("../controllers/callController");

router.post("/start-calls", async (req, res) => {
  const { ownerId } = req.body;

  if (!ownerId) {
    return res.status(400).json({ error: "Missing ownerId" });
  }

  try {
    await processCallsForOwner(ownerId);
    res.json({ success: true, message: "Call pipeline started!" });
  } catch (err) {
    console.error("❌ Failed to trigger call pipeline:", err);
    res.status(500).json({ error: "Failed to trigger call pipeline" });
  }
});

module.exports = router;
