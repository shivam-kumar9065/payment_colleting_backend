const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

// System prompt: adjust as needed
const SYSTEM_PROMPT = `
You are a smart voice agent working for a small business like a computer repair shop, electronic dealer, or clothing store.
You speak politely and handle payment recovery calls from customers who missed their due dates.
Based on what the customer says, you must guide them, acknowledge payments, note promises to pay, or offer polite reminders.
Always keep your tone respectful and helpful.
`;

/**
 * Generates a response using Gemini Pro
 * @param {Array} history - [{ role: "user"|"assistant", content: "..." }]
 * @param {string} latestUserInput - Latest transcription from customer
 * @returns {Promise<string>} - Gemini-generated reply
 */
async function generateReply(history, latestUserInput) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const messages = [
    { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
    ...history,
    { role: "user", parts: [{ text: latestUserInput }] },
  ];

  const result = await model.generateContent({
    contents: messages,
    generationConfig: {
      temperature: 0.7,
    },
  });

  const reply = result.response.text().trim();
  return reply;
}

module.exports = { generateReply };
