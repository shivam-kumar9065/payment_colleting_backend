// setAdmin.js
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function setAdmin(uid) {
  await admin.auth().setCustomUserClaims(uid, { admin: true });
  console.log("✅ Admin claim set for UID:", uid);
}

setAdmin("k2Ynl0jDWQUYCc6e7eAYY0riknm2");
