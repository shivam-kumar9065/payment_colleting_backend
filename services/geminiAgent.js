// // backend/services/geminiAgent.js

// const { GoogleGenerativeAI } = require("@google/generative-ai");
// require("dotenv").config();

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// /**
//  * Builds smart response from Gemini using customer context + Whisper transcription
//  * @param {*} customer - { name, amount, phone }
//  * @param {*} config - { businessName }
//  * @param {string} customerInput - Whisper transcribed text
//  * @returns {string} - Gemini reply
//  */
// async function runGeminiPrompt(customer, config, customerInput) {
//   const prompt = `
// You are a polite and helpful AI voice assistant working for "${config.businessName}". 
// You are calling ${customer.name} who has an unpaid balance of ₹${customer.amount}.

// The customer just said: "${customerInput}"

// Your job is to respond kindly and clearly regarding their pending payment. 
// If they say they paid, ask for transaction details. If they say "will pay", confirm the promise.
// Avoid being rude or robotic. Do not repeat already known facts.

// Reply conversationally and briefly.
// `;

//   const result = await model.generateContent(prompt);
//   const response = await result.response;
//   const text = response.text();

//   return text;
// }

// module.exports = { runGeminiPrompt };











// backend/services/geminiAgent.js

const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // you can use "gemini-pro" if needed

/**
 * Builds smart, human-like voice reply using Gemini.
 * @param {*} customer - { name, amount, phone }
 * @param {*} config - { businessName }
 * @param {string} customerInput - Optional: Last thing the customer said
 * @returns {string} - Gemini voice reply
 */
async function runGeminiPrompt(customer, config, customerInput = "") {
  const systemInstruction = `
You are an experienced payment collection agent calling on behalf of "${config.businessName}".
You speak to Indian customers like a polite human, mixing Hindi and English ("Hinglish").
Keep sentences short and sound like a real phone call — no robotic phrases, no long paragraphs.

The customer you're calling is: ${customer.name}
Pending amount: ₹${customer.amount}

${customerInput
    ? `They just said: "${customerInput}". Respond accordingly.`
    : `You're starting the call. Ask for the payment politely.`}

NEVER say you're an AI. Speak naturally and finish your message in under 15 seconds.
`;

  const result = await model.generateContent(systemInstruction);
  const response = await result.response;
  return response.text().trim();
}

module.exports = { runGeminiPrompt };

