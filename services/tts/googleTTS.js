// ✅ backend/services/tts/googleTTS.js
const textToSpeech = require("@google-cloud/text-to-speech");
const fs = require("fs");
const path = require("path");

const decoded = Buffer.from(process.env.GOOGLE_CREDENTIALS_BASE64, "base64").toString("utf8");
const credentials = JSON.parse(decoded);

const client = new textToSpeech.TextToSpeechClient({
  credentials: {
    client_email: credentials.client_email,
    private_key: credentials.private_key,
  },
  projectId: credentials.project_id,
});


/**
 * Synthesize speech from text using a selected Google TTS voice.
 */
async function synthesizeSpeech(text, voiceName = "en-US-Wavenet-A") {
  const filename = `google-${Date.now()}.mp3`;
  const filePath = path.join(__dirname, "../../temp", filename);

  const languageCode = voiceName.split("-").slice(0, 2).join("-"); // auto extract lang

  const request = {
    input: { text },
    voice: {
      languageCode,
      name: voiceName,
    },
    audioConfig: {
      audioEncoding: "MP3",
      speakingRate: 1.0,
      pitch: 0.0,
    },
  };

  const [response] = await client.synthesizeSpeech(request);
  fs.writeFileSync(filePath, response.audioContent, "binary");

  console.log("✅ Google TTS generated:", filePath);
  return filePath;
}

/**
 * Fetches all voices that support Indian languages.
 */
async function getAvailableVoices() {
  const [result] = await client.listVoices(); // fetch all voices

  const indianLangCodes = [
    "en-IN", // English (India)
    "hi-IN", // Hindi
    "gu-IN", // Gujarati
    "kn-IN", // Kannada
    "ml-IN", // Malayalam
    "ta-IN", // Tamil
    "te-IN", // Telugu
    "mr-IN", // Marathi
    "bn-IN", // Bengali
    "pa-IN", // Punjabi
    "ur-IN", // Urdu
  ];

  const filtered = result.voices
    .filter(
      (v) =>
        v.languageCodes.some((code) => indianLangCodes.includes(code)) &&
        v.ssmlGender !== "SSML_VOICE_GENDER_UNSPECIFIED"
    )
    .map((v) => ({
      name: v.name,
      gender: v.ssmlGender,
      lang: v.languageCodes[0],
    }));

  console.log(`✅ Fetched ${filtered.length} Indian language voices`);
  return filtered;
}

module.exports = { synthesizeSpeech, getAvailableVoices };








// // ✅ backend/services/tts/googleTTS.js
// const textToSpeech = require("@google-cloud/text-to-speech");
// const fs = require("fs");
// const path = require("path");
// const admin = require("firebase-admin");

// const decoded = Buffer.from(process.env.GOOGLE_CREDENTIALS_BASE64, "base64").toString("utf8");
// const credentials = JSON.parse(decoded);

// const client = new textToSpeech.TextToSpeechClient({
//   credentials: {
//     client_email: credentials.client_email,
//     private_key: credentials.private_key,
//   },
//   projectId: credentials.project_id,
// });

// /**
//  * Synthesize speech from text using Firestore-stored voice per owner
//  */
// async function synthesizeSpeech(text, ownerIdOrVoice = "en-US-Wavenet-A") {
//   let voiceName = "en-US-Wavenet-A";

//   // If second argument is an ownerId (UID), fetch voice from Firestore
//   if (typeof ownerIdOrVoice === "string" && ownerIdOrVoice.includes("-") === false) {
//     try {
//       const doc = await admin.firestore().collection("businessConfig").doc(ownerIdOrVoice).get();
//       const data = doc.exists ? doc.data() : null;
//       voiceName = data?.preferredVoice || "hi-IN-Wavenet-A";
//     } catch (e) {
//       console.warn("⚠️ Could not fetch preferredVoice, using default", e.message);
//       voiceName = "hi-IN-Wavenet-A";
//     }
//   } else {
//     // If actual voice name passed directly
//     voiceName = ownerIdOrVoice;
//   }

//   const filename = `google-${Date.now()}.mp3`;
//   const filePath = path.join(__dirname, "../../public/temp", filename);
//   const languageCode = voiceName.split("-").slice(0, 2).join("-");

//   const request = {
//     input: { text },
//     voice: {
//       languageCode,
//       name: voiceName,
//     },
//     audioConfig: {
//       audioEncoding: "MP3",
//       speakingRate: 1.0,
//       pitch: 0.0,
//     },
//   };

//   const [response] = await client.synthesizeSpeech(request);
//   fs.writeFileSync(filePath, response.audioContent, "binary");

//   console.log("✅ Google TTS generated:", filePath);
//   return filePath;
// }

// /**
//  * Fetch all Google Cloud TTS voices supporting Indian languages.
//  */
// async function getAvailableVoices() {
//   const [result] = await client.listVoices();

//   const indianLangCodes = [
//     "en-IN", "hi-IN", "gu-IN", "kn-IN", "ml-IN", "ta-IN",
//     "te-IN", "mr-IN", "bn-IN", "pa-IN", "ur-IN"
//   ];

//   const filtered = result.voices
//     .filter(
//       (v) =>
//         v.languageCodes.some((code) => indianLangCodes.includes(code)) &&
//         v.ssmlGender !== "SSML_VOICE_GENDER_UNSPECIFIED"
//     )
//     .map((v) => ({
//       name: v.name,
//       gender: v.ssmlGender,
//       lang: v.languageCodes[0],
//     }));

//   console.log(`✅ Fetched ${filtered.length} Indian language voices`);
//   return filtered;
// }

// module.exports = {
//   synthesizeSpeech,       // use: synthesizeSpeech(text, ownerId)
//   getAvailableVoices,
// };

