const admin = require("firebase-admin");
const serviceAccount = require("./your-service-account.json"); // Firebase Admin

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const { handleConversation } = require("./logic/conversationLoop");

handleConversation("OWNER_UID", "CUSTOMER_ID").catch(console.error);
// This is a test script to run the conversation loop manually