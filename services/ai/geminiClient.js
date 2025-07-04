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



// ✅ backend/services/ai/geminiClient.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const admin = require("firebase-admin");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });

const validPaymentStatuses = [
  "unpaid",
  "partially paid",
  "paid",
  "disputed",
  "promised to pay",
  "unreachable",
  "contacted - no response",
];

const generateReply = async (
  currentContents,
  isFinalTurn = false,
  customerData = null,
  ownerWhatsAppNumber = null,
  businessName = null,
  agentName = "CashFlow Assist"
) => {
  let contentsForGemini = [...currentContents];
  let finalSummaryPrompt = "";

  if (isFinalTurn && customerData) {
    finalSummaryPrompt = `Given the complete conversation above and the following customer details:
Customer Name: ${customerData.CustomerName}
Due Amount: ₹${customerData.DueAmount}
Service Details: ${customerData.ServiceDetails || "N/A"}
Last Payment Date: ${customerData.LastPaymentDate || "N/A"}
Remarks: ${customerData.Remarks || "N/A"}
Promised Date: ${customerData.promisedDate || "N/A"}
Current Payment Status: ${customerData.PaymentStatus}
Owner's WhatsApp Number (for UPI/Screenshot): ${ownerWhatsAppNumber || "N/A"}
Business Name: ${businessName || "N/A"}
Agent Name: ${agentName || "N/A"}

Provide a concise JSON summary of the entire call. Expected JSON structure:
{
  "callOutcome": "string (e.g., Payment Confirmed, Payment Promised, Unable to Pay, No Answer, Disputed, Other)",
  "conversationSummary": "string (brief summary of the entire call)",
  "actionTaken": "string (e.g., Sent payment link, Scheduled follow-up, Manual review needed)",
  "newPaymentStatus": "string (e.g., Paid, Partially Paid, Promised to Pay, Unpaid, Disputed, Unreachable, Contacted - No Response)",
  "promisedDate": "string (YYYY-MM-DD, if new promise given and confirmed by LLM during call)",
  "promisedTime": "string (HH:MM, if new promise given and confirmed by LLM during call)"
}`;
    contentsForGemini.push({ role: "user", parts: [{ text: finalSummaryPrompt }] });
  } else if (
    currentContents.length === 0 ||
    currentContents[currentContents.length - 1].role !== "user"
  ) {
    contentsForGemini.push({
      role: "user",
      parts: [
        {
          text: `You are a trained digital agent and a professional representative for small businesses like computer service, general store, and mobile shops. Your role is the Payments Specialist. Your name is '${agentName}'. You are polite, confident, and helpful.

Here are the customer details:
Customer Name: ${customerData.CustomerName}
Due Amount: ₹${customerData.DueAmount}
Service Details: ${customerData.ServiceDetails || "N/A"}
Last Payment Date: ${customerData.LastPaymentDate || "N/A"}
Remarks: ${customerData.Remarks || "N/A"}
Promised Date: ${customerData.promisedDate || "N/A"}

The ONLY accepted payment method is UPI to: ${ownerWhatsAppNumber}.

Strict rules:
- Only talk about payment collection. Redirect off-topic politely.
- If user says "I paid" → ask for screenshot + transaction ID.
- If user says "will pay later" → ask exact date + time. Max 2 days allowed.
- If user is rude → say “Owner will contact you later” and end.

Start by saying: "Hello, I'm ${agentName} from ${businessName}, calling to assist with your pending payment."`,
        },
      ],
    });
  }

  try {
    const result = await model.generateContent({ contents: contentsForGemini });
    const responseText = result.response.text();
    console.log("LLM Raw Response:", responseText);

    if (isFinalTurn) {
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedJson = JSON.parse(jsonMatch[0]);

          const status = parsedJson.newPaymentStatus?.toLowerCase();
          if (!validPaymentStatuses.includes(status)) {
            console.warn("Invalid status from Gemini. Defaulting...");
            parsedJson.newPaymentStatus =
              customerData.PaymentStatus?.toLowerCase() || "unpaid";
          } else {
            parsedJson.newPaymentStatus = status;
          }

          return parsedJson;
        } else {
          throw new Error("No JSON found in LLM final response");
        }
      } catch (e) {
        console.error("Error parsing LLM summary JSON:", e);
        return {
          callOutcome: "LLM Error",
          conversationSummary: `LLM failed: ${e.message}`,
          actionTaken: "Manual review",
          newPaymentStatus: customerData?.PaymentStatus || "unpaid",
          promisedDate: "",
          promisedTime: "",
        };
      }
    } else {
      return responseText;
    }
  } catch (error) {
    console.error("LLM error:", error);
    if (isFinalTurn) {
      return {
        callOutcome: "LLM Error",
        conversationSummary: `LLM failed: ${error.message}`,
        actionTaken: "Manual review",
        newPaymentStatus: customerData?.PaymentStatus || "unpaid",
        promisedDate: "",
        promisedTime: "",
      };
    }
    return "I'm sorry, I'm having trouble connecting right now.";
  }
};

module.exports = { generateReply };
