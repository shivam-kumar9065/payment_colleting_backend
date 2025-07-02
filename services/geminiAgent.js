// backend/services/geminiAgent.js

const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

/**
 * Builds smart response from Gemini using customer context + Whisper transcription
 * @param {*} customer - { name, amount, phone }
 * @param {*} config - { businessName }
 * @param {string} customerInput - Whisper transcribed text
 * @returns {string} - Gemini reply
 */
async function runGeminiPrompt(customer, config, customerInput) {
  const prompt = `
You are a polite and helpful AI voice assistant working for "${config.businessName}". 
You are calling ${customer.name} who has an unpaid balance of ₹${customer.amount}.

The customer just said: "${customerInput}"

Your job is to respond kindly and clearly regarding their pending payment. 
If they say they paid, ask for transaction details. If they say "will pay", confirm the promise.
Avoid being rude or robotic. Do not repeat already known facts.

Reply conversationally and briefly.
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  return text;
}

module.exports = { runGeminiPrompt };
