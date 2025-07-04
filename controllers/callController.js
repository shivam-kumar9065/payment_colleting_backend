// // ✅ backend/controllers/callController.js

// const admin = require("firebase-admin");
// const { runGeminiPrompt } = require("../services/geminiAgent");
// const { getTTSService } = require("../services/tts");
// const { triggerAICall } = require("../utils/twilioClient");

// const db = admin.firestore();

// /**
//  * Fetch today's eligible customers for the owner
//  */
// async function fetchTodayCustomers(ownerId, retryLimit) {
//   const today = new Date().toISOString().split("T")[0];

//   const snapshot = await db
//     .collection("customers")
//     .doc(ownerId)
//     .collection("customerList")
//     .where("status", "in", ["pending", "retry","Partial"])
//     .get();

//   return snapshot.docs
//     .map((doc) => ({ id: doc.id, ...doc.data() }))
//     .filter((cust) => (cust.dailyCallAttempts || 0) < retryLimit);
// }

// /**
//  * Process smart AI calls using Gemini + TTS
//  */
// async function processCallsForOwner(ownerId) {
//   const configSnap = await db.collection("businessConfigs").doc(ownerId).get();
//   const config = configSnap.exists ? configSnap.data() : {};
//   const retryLimit = parseInt(config.retryLimit || "3");

//   const customers = await fetchTodayCustomers(ownerId, retryLimit);
//   if (customers.length === 0) {
//     console.log(`✅ No customers to call for owner ${ownerId}`);
//     return;
//   }

//   const tts = await getTTSService();

//   // for (const customer of customers) {
//   //   if (customer.callStatus === "calling") {
//   //     console.log(`⏩ Skipping already calling customer: ${customer.phone}`);
//   //     continue;
//   //   }
//    for (const customer of customers) {
//     if (customer.callStatus === "calling") {
//       console.log(`⏩ Skipping already calling customer: ${customer.phone}`);
//       continue;
//     }

//     try {
//       console.log(`🔁 Calling ${customer.name} (${customer.phone})`);

//       // Step 1: Ask Gemini for what to say
//       const replyText = await runGeminiPrompt(customer, config);

//       // Step 2: Convert response to audio
//       const audioPath = await tts.synthesizeSpeech(replyText);

//       // Step 3: Make the voice call
//       await triggerAICall({
//         ownerId,
//         customerId: customer.id,
//         phoneNumber: customer.phone,
//         audioPath,
//       });

//       // Step 4: Update Firestore
//       await db
//         .collection("customers")
//         .doc(ownerId)
//         .collection("customerList")
//         .doc(customer.id)
//         .update({
//           callStatus: "calling",
//           lastCall: admin.firestore.FieldValue.serverTimestamp(),
//           dailyCallAttempts: (customer.dailyCallAttempts || 0) + 1,
//           attemptCount: (customer.attemptCount || 0) + 1,
//         });

//     } catch (err) {
//       console.error(`❌ Error calling ${customer.phone}:`, err.message);
//       await db
//         .collection("customers")
//         .doc(ownerId)
//         .collection("customerList")
//         .doc(customer.id)
//         .update({
//           callStatus: "failed",
//         });
//     }
//   }
// }


// module.exports = { processCallsForOwner };






// // ✅ backend/controllers/callController.js
// const admin = require("firebase-admin");
// const { runGeminiPrompt } = require("../services/geminiAgent");
// const { getTTSService } = require("../services/tts");
// const { triggerAICall } = require("../utils/twilioClient");

// const db = admin.firestore();

// async function fetchTodayCustomers(ownerId, retryLimit) {
//   const snapshot = await db
//     .collection("customers")
//     .doc(ownerId)
//     .collection("customerList")
//     .where("status", "in", ["pending", "retry", "Partial", "not-answered"])
//     .get();

//   return snapshot.docs
//     .map((doc) => ({ id: doc.id, ...doc.data() }))
//     .filter((cust) => (cust.dailyCallAttempts || 0) < retryLimit);
// }

// async function processCallsForOwner(ownerId) {
//   const configSnap = await db.collection("businessConfigs").doc(ownerId).get();
//   const config = configSnap.exists ? configSnap.data() : {};
//   const retryLimit = parseInt(config.retryLimit || "3");

//   const customers = await fetchTodayCustomers(ownerId, retryLimit);
//   if (customers.length === 0) {
//     console.log(`✅ No customers to call for owner ${ownerId}`);
//     return;
//   }

//   const tts = await getTTSService();

//   for (const customer of customers) {
//     if (customer.callStatus === "calling") {
//       console.log(`⏩ Skipping already calling customer: ${customer.phone}`);
//       continue;
//     }

//     try {
//       console.log(`🔁 Calling ${customer.name} (${customer.phone})`);

//       // ✅ Step 1: Update call status immediately
//       await db
//         .collection("customers")
//         .doc(ownerId)
//         .collection("customerList")
//         .doc(customer.id)
//         .update({
//           callStatus: "calling",
//           lastCall: admin.firestore.FieldValue.serverTimestamp(),
//           dailyCallAttempts: (customer.dailyCallAttempts || 0) + 1,
//           attemptCount: (customer.attemptCount || 0) + 1,
//         });

//       // Step 2: Generate Gemini message
//       const replyText = await runGeminiPrompt(customer, config);

//       // Step 3: Convert to audio
//       const audioPath = await tts.synthesizeSpeech(replyText);

//       // Step 4: Trigger call
//       await triggerAICall({
//         ownerId,
//         customerId: customer.id,
//         phoneNumber: customer.phone,
//         audioPath,
//       });

//     } catch (err) {
//       console.error(`❌ Error calling ${customer.phone}:`, err.message);
//       await db
//         .collection("customers")
//         .doc(ownerId)
//         .collection("customerList")
//         .doc(customer.id)
//         .update({ callStatus: "failed" });
//     }
//   }
// }

// module.exports = { processCallsForOwner };








// // backend/controllers/callController.js
// const admin = require("firebase-admin");
// const { runGeminiPrompt } = require("../services/geminiAgent");
// const { getTTSService } = require("../services/tts");
// const { triggerAICall } = require("../utils/twilioClient");

// const db = admin.firestore();

// async function fetchTodayCustomers(ownerId, retryLimit) {
//   const snap = await db
//     .collection("customers")
//     .doc(ownerId)
//     .collection("customerList")
//     .where("status", "in", ["pending","retry","Pending","Partial","not-answered"])
//     .get();

//   return snap.docs.map(d => ({id: d.id, ...d.data()}))
//     .filter(c => (c.dailyCallAttempts||0) < retryLimit && c.callStatus !== "calling");
// }

// async function processCallsForOwner(ownerId) {
//   const cfg = (await db.collection("businessConfig").doc(ownerId).get()).data();
//     const limit = parseInt(cfg.retryLimit || "3");
//   const customers = await fetchTodayCustomers(ownerId, limit);
//   if (!customers.length) return console.log(`✅ No customers for ${ownerId}`);

//   const tts = await getTTSService();

//   for (const cust of customers) {
//     const ref = db.collection("customers").doc(ownerId).collection("customerList").doc(cust.id);
//     await ref.update({
//       callStatus: "calling",
//       dailyCallAttempts: (cust.dailyCallAttempts||0) + 1
//     });

//     await triggerAICall({
//       ownerId,
//       customerId: cust.id,
//       phoneNumber: cust.phone
//     });
//   }
// }

// module.exports = { processCallsForOwner };




// // backend/controllers/callController.js
// const admin = require("firebase-admin");
// const { runGeminiPrompt } = require("../services/geminiAgent");
// const { getTTSService } = require("../services/tts");
// const { triggerAICall } = require("../utils/twilioClient");

// const db = admin.firestore();

// async function fetchTodayCustomers(ownerId, retryLimit) {
//   const snap = await db
//     .collection("customers")
//     .doc(ownerId)
//     .collection("customerList")
//     .where("status", "in", ["pending", "retry", "Pending", "Partial", "not-answered"])
//     .get();

//   return snap.docs
//     .map((d) => ({ id: d.id, ...d.data() }))
//     .filter(
//       (c) =>
//         (c.dailyCallAttempts || 0) < retryLimit &&
//         c.callStatus !== "calling"
//     );
// }

// async function processCallsForOwner(ownerId) {
//   const configSnap = await db.collection("businessConfig").doc(ownerId).get();
//   if (!configSnap.exists) {
//     console.warn(`❌ Business config not found for ownerId: ${ownerId}`);
//     return;
//   }

//   const cfg = configSnap.data();
//   const limit = parseInt(cfg.retryLimit || "3"); // Safely fallback if retryLimit is missing or empty

//   const customers = await fetchTodayCustomers(ownerId, limit);
//   if (!customers.length) {
//     console.log(`✅ No customers to call for ${ownerId}`);
//     return;
//   }

//   const tts = await getTTSService();

//   for (const cust of customers) {
//     const ref = db
//       .collection("customers")
//       .doc(ownerId)
//       .collection("customerList")
//       .doc(cust.id);

//     await ref.update({
//       callStatus: "calling",
//       dailyCallAttempts: (cust.dailyCallAttempts || 0) + 1,
//     });

//     await triggerAICall({
//       ownerId,
//       customerId: cust.id,
//       phoneNumber: cust.phone,
//     });
//   }
// }

// module.exports = { processCallsForOwner };







// backend/controllers/callController.js
const admin = require("firebase-admin");
const { runGeminiPrompt } = require("../services/geminiAgent");
const { getTTSService } = require("../services/tts");
const { triggerAICall } = require("../utils/twilioClient");

const db = admin.firestore();

async function fetchTodayCustomers(ownerId, retryLimit) {
  const allowedStatuses = ["pending", "retry", "Pending", "Partial", "not-answered"];
  let allDocs = [];

  // Fetch in chunks (Firestore doesn't allow 'in' with >10 values and can throw errors)
  for (const status of allowedStatuses) {
    const snap = await db
      .collection("customers")
      .doc(ownerId)
      .collection("customerList")
      .where("status", "==", status)
      .get();
    allDocs.push(...snap.docs);
  }

  return allDocs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter(
      (c) =>
        (c.dailyCallAttempts || 0) < retryLimit &&
        c.callStatus !== "calling"
    );
}

async function processCallsForOwner(ownerId) {
  const configSnap = await db.collection("businessConfig").doc(ownerId).get();
  if (!configSnap.exists) {
    console.warn(`❌ Business config not found for ownerId: ${ownerId}`);
    return;
  }

  const cfg = configSnap.data();
  const limit = parseInt(cfg.retryLimit || "3");

  const customers = await fetchTodayCustomers(ownerId, limit);
  if (!customers.length) {
    console.log(`✅ No customers to call for ${ownerId}`);
    return;
  }

  const tts = await getTTSService();

  for (const cust of customers) {
    const ref = db
      .collection("customers")
      .doc(ownerId)
      .collection("customerList")
      .doc(cust.id);

    await ref.update({
      callStatus: "calling",
      dailyCallAttempts: (cust.dailyCallAttempts || 0) + 1,
    });

    await triggerAICall({
      ownerId,
      customerId: cust.id,
      phoneNumber: cust.phone,
    });
  }
}

module.exports = { processCallsForOwner };




