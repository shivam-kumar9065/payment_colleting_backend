// // ✅ backend/utils/twilioClient.js
// const twilio = require("twilio");
// const path = require("path");
// require("dotenv").config();

// const accountSid = process.env.TWILIO_ACCOUNT_SID;
// const authToken = process.env.TWILIO_AUTH_TOKEN;
// const callerNumber = process.env.TWILIO_CALLER_NUMBER;
// const audioBaseUrl = process.env.BASE_URL;

// const client = twilio(accountSid, authToken);

// /**
//  * Trigger a voice call and play pre-generated TTS audio
//  * @param {Object} callData
//  * @param {string} callData.ownerId
//  * @param {string} callData.customerId
//  * @param {string} callData.phoneNumber
//  * @param {string} callData.audioPath - Local path to audio file (e.g., /temp/xyz.mp3)
//  */
// async function triggerAICall({ ownerId, customerId, phoneNumber, audioPath }) {
//   if (!phoneNumber || !audioPath) {
//     console.warn("⚠️ Missing phone or audio path");
//     return;
//   }

//   const fileName = path.basename(audioPath);
//   const publicUrl = `${audioBaseUrl}/temp/${fileName}`; // Must be publicly served

//   try {
//     const call = await client.calls.create({
//       to: phoneNumber,
//       from: callerNumber,
//       twiml: `<Response><Play>${publicUrl}</Play></Response>`,
//     });

//     console.log(`📞 AI call triggered for ${phoneNumber} - Call SID: ${call.sid}`);
//     return call;
//   } catch (err) {
//     console.error("❌ Twilio AI Call failed:", err.message);
//     throw err;
//   }
// }

// module.exports = {
//   triggerAICall,
// };




// // ✅ backend/utils/twilioClient.js
// const twilio = require("twilio");
// const path = require("path");
// require("dotenv").config();

// const accountSid = process.env.TWILIO_ACCOUNT_SID;
// const authToken = process.env.TWILIO_AUTH_TOKEN;
// const callerNumber = process.env.TWILIO_CALLER_NUMBER;
// const audioBaseUrl = process.env.BASE_URL;

// const client = twilio(accountSid, authToken);

// async function triggerAICall({ ownerId, customerId, phoneNumber, audioPath }) {
//   if (!phoneNumber || !audioPath) {
//     console.warn("⚠️ Missing phone or audio path");
//     return;
//   }

//   const fileName = path.basename(audioPath);
//   const publicUrl = `${audioBaseUrl}/temp/${fileName}`;

//   try {
//     const call = await client.calls.create({
//       to: phoneNumber,
//       from: callerNumber,
//       twiml: `<Response><Play>${publicUrl}</Play></Response>`,
//       statusCallback: `${audioBaseUrl}/twiml-handler/call-status`,
//       statusCallbackMethod: "POST",
//       statusCallbackEvent: ["completed", "no-answer", "busy", "failed", "canceled"],
//     });

//     console.log(`📞 AI call triggered for ${phoneNumber} - Call SID: ${call.sid}`);
//     return call;
//   } catch (err) {
//     console.error("❌ Twilio AI Call failed:", err.message);
//     throw err;
//   }
// }

// module.exports = { triggerAICall };






// backend/utils/twilioClient.js
const twilio = require("twilio");
const path = require("path");
require("dotenv").config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const callerNumber = process.env.TWILIO_CALLER_NUMBER;
const base = process.env.BASE_URL;

async function triggerAICall({ ownerId, customerId, phoneNumber }) {
  return await client.calls.create({
    to: phoneNumber,
    from: callerNumber,
    url: `${base}/twiml/converse/start?ownerId=${ownerId}&customerId=${customerId}`,
    method: "POST",
    statusCallback: `${base}/twiml-handler/call-status`,
    statusCallbackEvent: ["completed", "no-answer", "busy", "failed", "canceled"]
  });
}

module.exports = { triggerAICall };
