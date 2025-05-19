const compareImagesPython = require("./utilities/compareTwoImagesPython");

const oldImages = {
  frontImage: "uploads/images/v1.jpg",
};

const newImages = {
  frontImage: "uploads/images/v3.jpg",
};

(async () => {
  try {
    const comparisonResults = {};

    for (let key of Object.keys(newImages)) {
      if (oldImages[key]) {
        const result = await compareImagesPython(
          oldImages[key],
          newImages[key]
        );
        comparisonResults[key] = result;
        console.log(`${key}:`, result);
      }
    }

    const similarities = Object.values(comparisonResults)
      .map((res) =>
        res.similarity ? parseFloat(res.similarity.replace("%", "")) : null
      )
      .filter((s) => s !== null);

    if (similarities.length > 0) {
      const averageSimilarity =
        similarities.reduce((acc, val) => acc + val, 0) /
        similarities.length /
        100;

      console.log(
        " Moyenne de similarité:",
        (averageSimilarity * 100).toFixed(2) + "%"
      );
      console.log("averageSimilarity", averageSimilarity);
      console.log(
        "Object.keys(comparisonResults),",
        Object.keys(comparisonResults)
      );

      // Condition mise à jour
      if (averageSimilarity > 0.65) {
        console.log("averageSimilarity", averageSimilarity);
        console.log(" Véhicule probablement similaire.");
      } else {
        console.log(" Véhicule probablement différent.");
      }
    } else {
      console.log(
        " Aucune similarité calculable (véhicule non détecté dans une ou plusieurs images)."
      );
    }
  } catch (err) {
    console.error(" Erreur lors de l'exécution du script Node.js : ", err);
  }
})();
