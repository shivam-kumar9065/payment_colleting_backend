const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json"); // Your actual file path

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

const decoded = Buffer.from(process.env.GOOGLE_CREDENTIALS_BASE64, 'base64').toString('utf-8');
const credentials = JSON.parse(decoded);

admin.initializeApp({
  credential: admin.credential.cert(credentials)
});



const db = admin.firestore();

module.exports = { admin, db };
