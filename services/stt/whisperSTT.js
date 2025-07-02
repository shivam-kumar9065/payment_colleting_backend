const { spawn } = require("child_process");
const path = require("path");

async function transcribeWithWhisper(filePath) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve(__dirname, "whisper-helper.py");
    const process = spawn("python3", [scriptPath, filePath]);

    let output = "", error = "";

    process.stdout.on("data", (data) => output += data.toString());
    process.stderr.on("data", (data) => error += data.toString());

    process.on("close", (code) => {
      if (code !== 0) reject(new Error("Whisper failed: " + error));
      else resolve(output.trim());
    });
  });
}

module.exports = { transcribeWithWhisper };
