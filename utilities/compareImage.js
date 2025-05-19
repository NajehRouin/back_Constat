const fs = require("fs");
const { PNG } = require("pngjs");
const { default: pixelmatch } = require("pixelmatch");
const sharp = require("sharp");
const path = require("path");

// Convertit une image en PNG et retourne un buffer compatible avec PNGjs
async function loadAsPNGBuffer(imagePath) {
  const pngBuffer = await sharp(imagePath).png().toBuffer();
  return PNG.sync.read(pngBuffer);
}

// Compare deux images (jpg ou png)
async function compareImages(pathOld, pathNew) {
  try {
    const img1 = await loadAsPNGBuffer(pathOld);
    const img2 = await loadAsPNGBuffer(pathNew);

    if (img1.width !== img2.width || img1.height !== img2.height) {
      throw new Error("Les dimensions des images ne correspondent pas");
    }

    const diff = new PNG({ width: img1.width, height: img1.height });

    const numDiffPixels = pixelmatch(
      img1.data,
      img2.data,
      diff.data,
      img1.width,
      img1.height,
      { threshold: 0.1 }
    );

    const totalPixels = img1.width * img1.height;
    const percentDiff = (numDiffPixels / totalPixels) * 100;
    const similarity = 100 - percentDiff;

    return {
      differences: numDiffPixels,
      percentDiff: percentDiff.toFixed(2) + "%",
      similarity: similarity.toFixed(2) + "%",
    };
  } catch (error) {
    return { error: error.message };
  }
}

async function compareAllImages(oldImages, newImages) {
  const results = {};

  for (const key of Object.keys(newImages)) {
    if (oldImages[key]) {
      try {
        results[key] = await compareImages(oldImages[key], newImages[key]);
      } catch (err) {
        results[key] = { error: err.message };
      }
    }
  }

  return results;
}

module.exports = {
  compareImages,
  compareAllImages,
};
