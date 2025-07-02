const { getServiceConfig } = require("../../utils/serviceSelector");
const whisperSTT = require("./whisperSTT");
const googleSTT = require("./googleSTT");

async function transcribe(filePath) {
  const { sttService } = await getServiceConfig();

  if (sttService === "whisper") {
    return await whisperSTT.transcribe(filePath);
  } else if (sttService === "google") {
    return await googleSTT.transcribe(filePath);
  } else {
    throw new Error(`Unsupported STT service: ${sttService}`);
  }
}

module.exports = { transcribe };
