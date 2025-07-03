const express = require('express');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
const generateQueueRoute = require('./routes/generateQueue');
const voiceRoutes = require('./routes/voice');
const sttRoutes = require('./routes/stt'); // ✅ Added STT route
require('./cron/cleanTemp');
const twimlHandler = require("./routes/twimlHandler");
const twimlAiAgent = require("./routes/twimlAiAgent");

const triggerDailyQueue = require("./routes/triggerDailyQueue");

const path = require("path");``

const startCallsRoute = require("./routes/startCalls");
const cors = require('cors');
const twimlPlay = require("./routes/twimlPlay");
//


// // ✅ Initialize Firebase Admin
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });


const app = express();
const PORT = process.env.PORT || 3000;


app.use(express.json());
app.use(cors({
  origin: "http://localhost:5173", // or "*" for open access
  credentials: true
}));

// ✅ API Routes
app.use('/api', generateQueueRoute);
app.use('/api/voice', voiceRoutes);
app.use('/api/stt', sttRoutes); // ✅ Use STT route
app.use("/twiml-handler", twimlHandler);
app.use("/audio", express.static(path.join(__dirname, "/temp"))); // Serve audio files
app.use("/twiml/ai-agent", twimlAiAgent); 
app.use("/api/queue", triggerDailyQueue);
 app.use("/twiml", twimlPlay);

// 👇 Serve audio files for Twilio from /temp folder
//app.use("/temp", express.static(path.join(__dirname, "temp")));
app.use("/audio", express.static(path.join(__dirname, "temp/audio")));
app.use("/api", startCallsRoute); 
// ✅ Start daily reset cron
require("./cron/resetDailyAttempts");

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
