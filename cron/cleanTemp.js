const fs = require("fs");
const path = require("path");
const cron = require("node-cron");

// Folder to clean
const tempFolder = path.join(__dirname, "../temp");

// Delete files older than 1 hour
const MAX_AGE_MINUTES = 60;

function deleteOldFiles() {
  fs.readdir(tempFolder, (err, files) => {
    if (err) return console.error("Error reading temp folder:", err);

    const now = Date.now();

    files.forEach(file => {
      const filePath = path.join(tempFolder, file);

      fs.stat(filePath, (err, stats) => {
        if (err) return console.error("Error reading file stats:", err);

        const ageMinutes = (now - stats.mtimeMs) / (1000 * 60);
        if (ageMinutes > MAX_AGE_MINUTES) {
          fs.unlink(filePath, err => {
            if (err) console.error("Error deleting file:", err);
            else console.log(`🧹 Deleted old temp file: ${file}`);
          });
        }
      });
    });
  });
}

// Schedule to run every 15 minutes
cron.schedule("*/15 * * * *", () => {
  console.log("🕒 Running temp folder cleanup...");
  deleteOldFiles();
});
