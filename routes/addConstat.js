const express = require("express");
const router = express.Router();
const constatStore = require("../controller/constatController");
const validateWith = require("../middleware/validation");
const constatSchema = require("../schemas/constatSchema");
const Accident = require("../models/Accident");
const auth = require("../middleware/auth");
const ConstatModel = require("../models/Constat");

const Constat = require("../models/Constat");
const fs = require("fs");

const Fraud = require("../models/Fraud");
const compareImagesPython = require("../utilities/compareTwoImagesPython");

// Ajouter une route pour initialiser un accident
router.post("/accident_init", async (req, res) => {
  try {
    const { accidentId, totalVehicles } = req.body;

    const existingAccident = await Accident.findOne({ accidentId });
    if (existingAccident) {
      return res.status(400).json({ message: "Cet accident existe déjà" });
    }
    const newAccident = new Accident({
      accidentId,
      totalVehicles,
      submittedVehicles: 0,
    });
    await newAccident.save();
    res.status(201).json({ message: "Accident initialisé avec succès" });
  } catch (error) {
    console.error("Erreur lors de l’initialisation de l’accident :", error);
    res
      .status(500)
      .json({ message: "Erreur lors de l’initialisation de l’accident" });
  }
});

// Ajouter un constat
router.post(
  "/addConstat",
  auth,
  validateWith(constatSchema),
  async (req, res) => {
    try {
      // Validation manuelle
      if (!req.body.accidentId) {
        return res.status(400).json({
          error: "Validation failed",
          details: {
            missingFields: ["accidentId"],
            receivedData: req.body,
          },
        });
      }

      const userId = req.user._id;

      // Récupérer anciens constats du même utilisateur
      const anciensConstats = await Constat.findOne({
        userId,
        vehicleRegistration: req.body.vehicleRegistration,
        face: req.body.face,
      });

      const newConstat = await constatStore.addConstat(req.body);

      const accident = await Accident.findOne({
        accidentId: req.body.accidentId,
      });
      if (accident) {
        accident.submittedVehicles += 1;
        await accident.save();
      }

      newConstat.userId = userId;
      await newConstat.save();

      if (anciensConstats) {
        const anciensImages = getImagesByFace(
          anciensConstats.face,
          anciensConstats
        );
        const nouveauxImages = getImagesByFace(newConstat.face, newConstat);

        const comparisonResults = {};

        for (let key of Object.keys(nouveauxImages)) {
          if (anciensImages[key]) {
            const result = await compareImagesPython(
              anciensImages[key],
              nouveauxImages[key]
            );
            comparisonResults[key] = result;
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

          // Si la similarité est supérieure à 0.6, détecter et enregistrer la fraude
          //0.2 pour faire le test
          if (averageSimilarity > 0.2) {
            const newFraud = new Fraud({
              userId,
              nvConstat: newConstat._id,
              ancienConstat: anciensConstats._id,
              similarity: averageSimilarity.toFixed(2),
              imagesCompared: Object.keys(comparisonResults),
              createdAt: new Date(),
            });
            await newFraud.save();
          }
        } else {
          console.log(
            " Aucune similarité calculable (véhicule non détecté dans une ou plusieurs images)."
          );
        }
      }

      res.status(201).json({
        message: "Constat enregistré avec succès",
        constat: newConstat,
        completed: `${accident.submittedVehicles}/${accident.totalVehicles}`,
      });
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du constat :", error);
      res
        .status(500)
        .json({ message: "Erreur lors de l'enregistrement du constat" });
    }
  }
);

// Récupérer un constat par ID
router.get("/:id", async (req, res) => {
  try {
    const constat = await constatStore.getConstatById(req.params.id);
    if (!constat) {
      return res.status(404).json({ message: "Constat non trouvé" });
    }
    res.status(200).json(constat);
  } catch (error) {
    console.error("Erreur lors de la récupération du constat :", error);
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération du constat" });
  }
});

// Récupérer tous les constats
router.get("/", async (req, res) => {
  try {
    const constats = await constatStore.getAllConstats();
    res.status(200).json(constats);
  } catch (error) {
    console.error("Erreur lors de la récupération des constats :", error);
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération des constats" });
  }
});

//getAll constat by user

router.post("/constatByUser", auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const getAllConstats = await ConstatModel.find({ userId });
    res.status(201).json({ result: getAllConstats });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération du constat" });
  }
});

router.post("/getConstatUser", async (req, res) => {
  try {
    const { userId } = req.body;

    let findConstat = await ConstatModel.find({ userId: userId }).populate(
      "userId",
      "name prenom"
    );

    res.status(200).json({
      result: findConstat,
      succes: true,
      error: false,
    });
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la récupération du constat",
      succes: false,
      error: true,
    });
  }
});

router.get("/getConstat/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const constat = await Constat.findById(id);

    if (!constat) {
      return res.status(404).json({ message: "Constat non trouvé" });
    }

    res.json({
      constat,
      nouveauxImages: getImagesByFace(constat.face, constat),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});
/*router.get("/accident/:accidentId", async (req, res) => {
  try {
    const accident = await Accident.findOne({ accidentId: req.params.accidentId });
    if (!accident) {
      return res.status(404).json({ message: "Accident non trouvé" });
    }
    res.status(200).json({
      totalVehicles: accident.totalVehicles,
      submittedVehicles: accident.submittedVehicles,
      isComplete: accident.submittedVehicles === accident.totalVehicles,
    });
  } catch (error) {
    console.error("Erreur lors de la vérification du statut :", error);
    res.status(500).json({ message: "Erreur lors de la vérification du statut" });
  }
});*/

function getImagesByFace(face, constat) {
  const images = {};

  if (face.includes("avant")) {
    images.frontImage = constat.frontImage;
  }
  if (face.includes("arrière")) {
    images.backImage = constat.backImage;
  }
  if (face.includes("gauche")) {
    images.leftImage = constat.leftImage;
  }
  if (face.includes("droite")) {
    images.rightImage = constat.rightImage;
  }
  if (face === "tous") {
    images.frontImage = constat.frontImage;
    images.backImage = constat.backImage;
    images.leftImage = constat.leftImage;
    images.rightImage = constat.rightImage;
  }

  return images;
}

module.exports = router;
