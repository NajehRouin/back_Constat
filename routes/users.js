const express = require("express");
const router = express.Router();
const Joi = require("joi");
const usersStore = require("../controller/users");
const validateWith = require("../middleware/validation");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
//const auth = require("../middleware/auth");
const {
  addVehiculeToUser,
  getUsersForSidebar,
  getCurrentUser,
} = require("../controller/users");
const auth = require("../middleware/auth");
const User = require("../models/User");

// Schéma de validation pour un véhicule
const vehiculeSchema = {
  vehicules: Joi.array()
    .items(
      Joi.object({
        brand: Joi.string().required(),
        numeroSerie: Joi.string().required(),
        numeroMatricule: Joi.string().required(),
        type: Joi.string().required(),
        numeroContrat: Joi.string().required(),
        assure: Joi.string().required(),
        agence: Joi.string().required(),
        insuranceStartDate: Joi.date().required(),
        insuranceEndDate: Joi.date().required(),
      })
    )
    .required(), // Le champ "vehicles" est obligatoire
};

// Schéma de validation pour l'utilisateur
const userSchema = {
  name: Joi.string().required().min(2),
  prenom: Joi.string().required(),
  cin: Joi.string().required(),
  password: Joi.string().required().min(5),
  numeroTelephone: Joi.string().required(),
  adresse: Joi.string().required(),
  numeroPermis: Joi.string().required(),
  dateDelivrance: Joi.date().required(),
  dateExpiration: Joi.date().required(),
  categoriesPermis: Joi.array().required(),
  vehicules: Joi.array()
    .items(
      Joi.object({
        brand: Joi.string().required(),
        numeroSerie: Joi.string().required(),
        numeroMatricule: Joi.string().required(),
        type: Joi.string().required(),
        numeroContrat: Joi.string().required(),
        assure: Joi.string().required(),
        agence: Joi.string().required(),
        insuranceStartDate: Joi.date().required(),
        insuranceEndDate: Joi.date().required(),
      })
    )
    .required(), // Le champ "vehicles" est obligatoire
};

// Route pour créer un utilisateur
router.post("/", validateWith(userSchema), async (req, res) => {
  const {
    name,
    prenom,
    cin,
    password,
    numeroTelephone,
    adresse,
    numeroPermis,
    dateDelivrance,
    dateExpiration,
    categoriesPermis,
    vehicules,
  } = req.body;

  // Vérifier si l'utilisateur existe déjà
  const existingUser = await usersStore.getUserByCin(cin);
  if (existingUser) {
    return res
      .status(400)
      .send({ error: "Un utilisateur avec ce CIN existe déjà." });
  }

  let passwordHash = await bcrypt.hash(password, 10);

  // Ajouter l'utilisateur
  const user = {
    name,
    prenom,
    cin,
    password: passwordHash,
    numeroTelephone,
    adresse,
    numeroPermis,
    dateDelivrance,
    dateExpiration,
    categoriesPermis,
    vehicules,
  };
  const newUser = await usersStore.addUser(user);

  res.status(201).send(newUser);
});

// Route pour obtenir tous les utilisateurs
router.get("/", async (req, res) => {
  const users = await usersStore.getUsers();
  res.send(users);
});

// Route pour ajouter un véhicule à un utilisateur
router.post("/:userId/vehicules", async (req, res) => {
  console.log("Requête reçue :", req.body); // Log du corps de la requête
  console.log("ID utilisateur :", req.params.userId);

  const { userId } = req.params;
  const { registration, insuranceStartDate, insuranceEndDate } = req.body;

  try {
    const vehicule = {
      brand,
      registration,
      insuranceStartDate,
      insuranceEndDate,
    };

    const updatedUser = await addVehiculeToUser(userId, vehicule);
    res.status(201).send(updatedUser);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Route pour obtenir les véhicules d'un utilisateur
//auth,
router.get("/:userId/vehicules", async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await usersStore.getUserById(userId);
    if (!user) {
      return res.status(404).send({ error: "Utilisateur non trouvé." });
    }

    res.send(user.vehicules);
  } catch (error) {
    res
      .status(500)
      .send({ error: "Erreur lors de la récupération des véhicules." });
  }
});

router.get("/", auth, getUsersForSidebar);

router.get("/currentUser", auth, getCurrentUser);

router.get("/getAllVehicule", auth, async (req, res) => {
  try {
    let findUser = await User.findById({ _id: req.user?._id });

    res.status(201).send({ result: findUser?.vehicules });
  } catch (error) {
    res.status(500).json({ error: "Internal server error", error });
  }
});

router.post(
  "/addvehicule",
  auth,

  async (req, res) => {
    try {
      let findUser = await User.findById({ _id: req.user?._id });

      const { vehicules } = req.body;

      findUser.vehicules.push(vehicules);
      await findUser.save();

      res.status(201).send(findUser);
    } catch (error) {
      res.status(500).json({ error: "Internal server error", error });
    }
  }
);

router.post("/deleteVehicule", auth, async (req, res) => {
  try {
    const { vehiculeId } = req.body;

    if (!vehiculeId) {
      return res.status(400).json({ message: "vehiculeId manquant" });
    }

    const result = await User.updateOne(
      { _id: req.user._id },
      { $pull: { vehicules: { _id: vehiculeId } } }
    );

    res.status(200).json({ message: "Véhicule supprimé avec succès", result });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression", error });
  }
});

router.get("/allUsers", getUsersForSidebar);

module.exports = router;
