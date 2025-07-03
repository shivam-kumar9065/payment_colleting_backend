// // backend/routes/twimlAiAgent.js

// const express = require("express");
// const router = express.Router();
// const { VoiceResponse } = require("twilio").twiml;
// const path = require("path");
// const fs = require("fs");
// const multer = require("multer");
// const { transcribe } = require("../services/stt"); // switchable Whisper/Google
// const { runGeminiPrompt } = require("../services/ai/geminiClient");
// const { getTTSEngine } = require("../services/tts");

// // Setup file upload
// const upload = multer({ dest: "temp/audio/" });

// // Twilio hits this when customer speaks
// router.post("/ai-agent", upload.single("Recording"), async (req, res) => {
//   const { ownerId, customerId } = req.query;
//   const recordingUrl = req.body.RecordingUrl;

//   if (!recordingUrl || !ownerId || !customerId) {
//     return res.status(400).send("Missing recording or IDs");
//   }

//   try {
//     // STEP 1: Download the recording file
//     const recordingPath = path.resolve(__dirname, `../temp/audio/${customerId}.mp3`);
//     const audioStream = await fetch(recordingUrl + ".mp3");
//     const buffer = await audioStream.arrayBuffer();
//     fs.writeFileSync(recordingPath, Buffer.from(buffer));

//     // STEP 2: Transcribe using STT (Whisper or Google)
//     const text = await transcribe(recordingPath);
//     console.log("🗣️ Customer said:", text);

//     // STEP 3: Generate smart reply using Gemini
//     const customer = { name: "Customer", amount: 800 }; // Load real data if needed
//     const config = { businessName: "Your Service" };
//     const reply = await runGeminiPrompt({ ...customer, lastSaid: text }, config);
//     console.log("🤖 Gemini replies:", reply);

//     // STEP 4: Convert reply to speech
//     const tts = await getTTSEngine();
//     const voiceFile = await tts.synthesize(reply, { voice: "en-US-Wavenet-A" });

//     // STEP 5: Respond with <Play>
//     const response = new VoiceResponse();
//     response.play(`${process.env.PUBLIC_WEB_URL}/audio/${path.basename(voiceFile)}`);

//     // 🔁 After playing, repeat this route again (loop)
//     response.record({
//       action: `/twiml/ai-agent?ownerId=${ownerId}&customerId=${customerId}`,
//       method: "POST",
//       maxLength: 10,
//       timeout: 5,
//       playBeep: false,
//     });

//     res.type("text/xml").send(response.toString());
//   } catch (err) {
//     console.error("❌ AI Agent Error:", err);
//     const errorResponse = new VoiceResponse();
//     errorResponse.say("Sorry, something went wrong. Please call again.");
//     res.type("text/xml").send(errorResponse.toString());
//   }
// });

// module.exports = router;





// ✅ backend/routes/twimlAgent.js
const express = require('express');
const router = express.Router();

const { getAgentResponseFromLLM } = require('../services/ai/geminiClient');
const { generateSpeechFromGoogle } = require('../services/tts/googleTTS');
const admin = require('firebase-admin');
const path = require('path');

const memoryMap = {}; // Holds memory per CallSid

router.post('/', async (req, res) => {
  const { CallSid, SpeechResult } = req.body;
  const callId = CallSid;

  try {
    const callerUid = req.query.uid;
    if (!callerUid) return res.status(400).send('Missing owner UID.');

    const businessRef = admin.firestore().collection('businessConfig').doc(callerUid);
    const businessDoc = await businessRef.get();
    if (!businessDoc.exists) return res.status(404).send('Business config not found');

    const business = businessDoc.data();
    const agentName = business.agentName || 'Agent';
    const businessName = business.businessName || 'Our Business';
    const whatsappNumber = business.whatsappNumber;

    // Maintain memory
    if (!memoryMap[callId]) memoryMap[callId] = [];

    const userMessage = SpeechResult?.trim();
    if (userMessage) {
      memoryMap[callId].push({ role: 'user', parts: [{ text: userMessage }] });
    }

    const agentResponse = await getAgentResponseFromLLM(
      memoryMap[callId],
      false,
      {
        CustomerName: 'Customer',
        DueAmount: '500',
        ServiceDetails: '',
        LastPaymentDate: '',
        Remarks: '',
        promisedDate: '',
        PaymentStatus: 'unpaid'
      },
      whatsappNumber,
      businessName,
      agentName
    );

    memoryMap[callId].push({ role: 'model', parts: [{ text: agentResponse }] });

    const audioPath = await generateSpeechFromGoogle(agentResponse, callerUid);
    const relativePath = path.basename(audioPath);

    const twiml = `
      <Response>
        <Play>/temp/${relativePath}</Play>
        <Pause length="1"/>
        <Gather input="speech" action="/api/twiml-ai-agent?uid=${callerUid}" method="POST" timeout="2" speechTimeout="auto"/>
      </Response>
    `;
    res.type('text/xml');
    res.send(twiml);

    // Cleanup memory after 10 mins
    setTimeout(() => {
      delete memoryMap[callId];
    }, 10 * 60 * 1000);

  } catch (error) {
    console.error("Agent error:", error);
    res.type('text/xml');
    res.send(`<Response><Say>Sorry, an error occurred. Please try again later.</Say></Response>`);
  }
});

// ✅ Export properly
module.exports = router;
