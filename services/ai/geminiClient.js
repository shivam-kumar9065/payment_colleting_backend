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





// // backend/services/geminiClient.js
// const { GoogleGenerativeAI } = require("@google/generative-ai");
// require("dotenv").config();

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // use "gemini-pro" for higher quality

// /**
//  * Generate a human-like voice reply using Gemini in a live voice call setting.
//  * @param {Array} history - [{ role: "user" | "assistant", content: "..." }]
//  * @param {string} customerInput - Latest customer speech (from Whisper)
//  * @param {*} customer - { name, amount }
//  * @param {*} config - { businessName }
//  * @returns {Promise<{ reply: string, updatedHistory: Array }>}
//  */
// async function generateReply(history, customerInput, customer, config) {
//   const SYSTEM_PROMPT = `
// You are a payment collection agent for a small Indian business: "${config.businessName}".

// You are talking to ${customer.name}, who owes ₹${customer.amount}.

// Your tone should be:
// - Friendly, respectful, polite
// - Use short, natural phrases (mix of Hindi + English)
// - Never robotic
// - Assume this is a phone call, not a chatbot

// Keep replies under 20 words. Use Hinglish. If they say they paid, ask for transaction details. If they promise, confirm the date.`;

//   const messages = [
//     { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
//     ...history.map((entry) => ({
//       role: entry.role,
//       parts: [{ text: entry.content }],
//     })),
//     { role: "user", parts: [{ text: customerInput }] },
//   ];

//   const result = await model.generateContent({
//     contents: messages,
//     generationConfig: {
//       temperature: 0.7,
//       topP: 0.9,
//       maxOutputTokens: 100,
//     },
//   });

//   const reply = result.response.text().trim();

//   // Update history
//   const updatedHistory = [
//     ...history,
//     { role: "user", content: customerInput },
//     { role: "assistant", content: reply },
//   ];

//   return { reply, updatedHistory };
// }

// module.exports = { generateReply };





const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Allowed payment statuses
const validStatuses = [
  "unpaid",
  "partially paid",
  "paid",
  "disputed",
  "promised to pay",
  "unreachable",
  "contacted - no response"
];

// Core conversation function
async function generateReply(prevHistory, userText, customerData, config, isFinalTurn = false) {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const agentName = "CashFlow Assist";
  const businessName = config.businessName || "our business";
  const ownerWhatsAppNumber = config.ownerPhone || "N/A";

  const currentContents = [...prevHistory];

  // Add the latest user message
  currentContents.push({
    role: "user",
    parts: [{ text: userText }]
  });

  // Prepare the system prompt only if it's the start
  if (currentContents.length <= 1) {
    const systemPrompt = `You are a trained digital agent and a professional representative for the small business like computer service, General store, mobile store, etc.
Your designated role is the Payments Specialist. Your name is '${agentName}'. Your persona is that of a polite, confident, and helpful staff member.

Your mission: collect pending payments only. Do not discuss anything else. Always sound human, polite, professional, and firm.

Customer Details:
Name: ${customerData.name}
Due Amount: ₹${customerData.amount}
Service: ${customerData.serviceName || "N/A"}
Last Payment Date: ${customerData.lastPaymentDate || "N/A"}
Remarks: ${customerData.remarks || "N/A"}
Promised Date: ${customerData.promisedDate || "N/A"}
Status: ${customerData.status || "unpaid"}

**Only accepted payment method: UPI to ${ownerWhatsAppNumber}.**

Use this number for all payment verification and guidance.

Begin the conversation by introducing yourself as '${agentName}' from '${businessName}' and clearly state the purpose of the call.`;

    currentContents.unshift({
      role: "user",
      parts: [{ text: systemPrompt }]
    });
  }

  // Final JSON summary prompt
  if (isFinalTurn) {
    const finalPrompt = `
Given the above conversation, generate a JSON summary using this structure:

{
  "callOutcome": "e.g., Payment Confirmed, Payment Promised, Unable to Pay, No Answer, Disputed, Other",
  "conversationSummary": "brief string summary",
  "actionTaken": "e.g., Sent payment link, Scheduled follow-up, Manual review needed",
  "newPaymentStatus": "paid / unpaid / promised to pay / disputed / etc",
  "promisedDate": "YYYY-MM-DD",
  "promisedTime": "HH:MM"
}

Customer: ${customerData.name}, Amount: ₹${customerData.amount}, Status: ${customerData.status}, WhatsApp: ${ownerWhatsAppNumber}
`;

    currentContents.push({ role: "user", parts: [{ text: finalPrompt }] });
  }

  try {
    const result = await model.generateContent({ contents: currentContents });
    const responseText = result.response.text();

    if (isFinalTurn) {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        // Normalize status
        parsed.newPaymentStatus = (parsed.newPaymentStatus || customerData.status || "unpaid").toLowerCase();

        if (!validStatuses.includes(parsed.newPaymentStatus)) {
          parsed.newPaymentStatus = "unpaid";
        }

        return parsed;
      } else {
        throw new Error("LLM did not return valid JSON");
      }
    }

    // Add assistant response to memory
    currentContents.push({
      role: "model",
      parts: [{ text: responseText }]
    });

    return {
      reply: responseText,
      updatedHistory: currentContents
    };
  } catch (error) {
    console.error("❌ Gemini error:", error);
    return {
      reply: "I'm sorry, I’m having trouble responding right now. Please try again later.",
      updatedHistory: currentContents
    };
  }
}

module.exports = {
  generateReply
};

