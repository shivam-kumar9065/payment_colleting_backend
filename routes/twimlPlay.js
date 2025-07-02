const express = require("express");
const path = require("path");
const fs = require("fs");
const { VoiceResponse } = require("twilio").twiml;

const router = express.Router();

router.post("/play-audio", async (req, res) => {
  const { file } = req.query;
  const response = new VoiceResponse();

  const audioUrl = `${process.env.PUBLIC_WEB_URL}/audio/${file}`;
  response.play(audioUrl);

  res.type("text/xml");
  res.send(response.toString());
});

module.exports = router;




// const twimlPlay = require("./routes/twimlPlay");
// app.use("/twiml", twimlPlay);

// // To serve audio files
// app.use("/audio", express.static(path.join(__dirname, "temp/audio")));
