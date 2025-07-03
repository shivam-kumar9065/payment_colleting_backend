// const { GoogleGenerativeAI } = require("@google/generative-ai");

// const apiKey = process.env.GEMINI_API_KEY;
// const genAI = new GoogleGenerativeAI(apiKey);

// // System prompt: adjust as needed
// const SYSTEM_PROMPT = `
// You are a smart voice agent working for a small business like a computer repair shop, electronic dealer, or clothing store.
// You speak politely and handle payment recovery calls from customers who missed their due dates.
// Based on what the customer says, you must guide them, acknowledge payments, note promises to pay, or offer polite reminders.
// Always keep your tone respectful and helpful.
// `;

// /**
//  * Generates a response using Gemini Pro
//  * @param {Array} history - [{ role: "user"|"assistant", content: "..." }]
//  * @param {string} latestUserInput - Latest transcription from customer
//  * @returns {Promise<string>} - Gemini-generated reply
//  */
// async function generateReply(history, latestUserInput) {
//     const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

//   const messages = [
//     { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
//     ...history,
//     { role: "user", parts: [{ text: latestUserInput }] },
//   ];

//   const result = await model.generateContent({
//     contents: messages,
//     generationConfig: {
//       temperature: 0.7,
//     },
//   });

//   const reply = result.response.text().trim();
//   return reply;
// }

// module.exports = { generateReply };





// backend/services/geminiClient.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // use "gemini-pro" for higher quality

/**
 * Generate a human-like voice reply using Gemini in a live voice call setting.
 * @param {Array} history - [{ role: "user" | "assistant", content: "..." }]
 * @param {string} customerInput - Latest customer speech (from Whisper)
 * @param {*} customer - { name, amount }
 * @param {*} config - { businessName }
 * @returns {Promise<{ reply: string, updatedHistory: Array }>}
 */
async function generateReply(history, customerInput, customer, config) {
  const SYSTEM_PROMPT = `
You are a payment collection agent for a small Indian business: "${config.businessName}".

You are talking to ${customer.name}, who owes ₹${customer.amount}.

Your tone should be:
- Friendly, respectful, polite
- Use short, natural phrases (mix of Hindi + English)
- Never robotic
- Assume this is a phone call, not a chatbot

Keep replies under 20 words. Use Hinglish. If they say they paid, ask for transaction details. If they promise, confirm the date.`;

  const messages = [
    { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
    ...history.map((entry) => ({
      role: entry.role,
      parts: [{ text: entry.content }],
    })),
    { role: "user", parts: [{ text: customerInput }] },
  ];

  const result = await model.generateContent({
    contents: messages,
    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
      maxOutputTokens: 100,
    },
  });

  const reply = result.response.text().trim();

  // Update history
  const updatedHistory = [
    ...history,
    { role: "user", content: customerInput },
    { role: "assistant", content: reply },
  ];

  return { reply, updatedHistory };
}

module.exports = { generateReply };
