const { spawn } = require("child_process");
const path = require("path");

const compareTwoImagesPython = (img1, img2) => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, "/image_compare.py");

    const process = spawn("python", [scriptPath, img1, img2]);

    let result = "";
    let error = "";

    process.stdout.on("data", (data) => {
      result += data.toString();
    });

    process.stderr.on("data", (data) => {
      error += data.toString();
    });

    process.on("close", () => {
      if (error) {
        return reject(new Error(error));
      }

      try {
        const jsonLine = result
          .split("\n")
          .find((line) => line.trim().startsWith("{"));

        if (!jsonLine) {
          return reject(new Error("La sortie n'est pas un JSON valide"));
        }

        const parsed = JSON.parse(jsonLine);

        if (parsed.error) {
          return resolve({
            similarity: null,
            error: parsed.error,
            message: parsed.message,
          });
        }

        const similarity = (parsed.similarity * 100).toFixed(2) + "%";
        resolve({ similarity });
      } catch (err) {
        reject(new Error("Erreur lors de l’analyse JSON : " + err.message));
      }
    });
  });
};

module.exports = compareTwoImagesPython;
