// backend/routes/testCall.js

const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const { triggerCallWithAI } = require("../utils/twilioClient");

const db = admin.firestore();

router.post("/test-call", async (req, res) => {
  const ownerId = req.body.ownerId;

  if (!ownerId) {
    return res.status(400).json({ error: "Missing ownerId in request body" });
  }

  try {
    // Fetch one pending customer
  const customerSnap = await db
    .collection("customers")
    .doc(ownerId)
    .collection("customerList")
    .doc(customerId)
    .get();

    if (customerSnap.empty) {
      return res.status(404).json({ error: "No pending customers found" });
    }

    const customerDoc = customerSnap.docs[0];
    const customerData = customerDoc.data();

    const callSession = {
      ownerId,
      customerId: customerDoc.id,
      phoneNumber: customerData.phone,
    };

    await triggerCallWithAI(callSession);

    res.json({
      success: true,
      message: "AI call initiated",
      customer: {
        id: customerDoc.id,
        name: customerData.name,
        phone: customerData.phone,
        amount: customerData.amount,
        status: customerData.status,
      },
    });
  } catch (err) {
    console.error("🔥 Error during test AI call:", err);
    res.status(500).json({ error: "Failed to make test AI call" });
  }
});

module.exports = router;
