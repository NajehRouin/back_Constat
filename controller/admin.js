const Admin = require("../models/Admin");
let bcrypt = require("bcrypt");
const message = require("../models/message");
const getCurrentAdmin = async (req, res) => {
  try {
    let findAdmin = await Admin.findById({ _id: req.admin.adminId });
    if (!findAdmin) return res.status(400).json({ error: "Invalid token" });
    res.status(200).json({ data: findAdmin });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

const findGestionnaire = async (req, res) => {
  try {
    let findAdmin = await Admin.findOne({ role: "gestionnaire" }).select("_id");
    res.status(200).json({ result: findAdmin, succes: true, error: false });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message, succes: false, error: true });
  }
};

const AjouterExpert = async (req, res) => {
  try {
    let { name, email, password } = req.body;

    let findExpert = await Admin.findOne({ email });

    if (findExpert)
      return res.status(400).json({ message: "Expert deja existe" });
    let passwordHash = await bcrypt.hash(password, 10);

    let newAdmin = new Admin({
      name,
      email,
      password: passwordHash,
      role: "expert",
    });
    await newAdmin.save();

    res.status(200).json({
      message: "Expert ajouter avec succe",
      succes: true,
      error: false,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message, succes: false, error: true });
  }
};

const getAllExpert = async (req, res) => {
  try {
    let findExpert = await Admin.find({ role: "expert" });

    res.status(200).json({
      result: findExpert,
      succes: true,
      error: false,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message, succes: false, error: true });
  }
};

const AjouterGrage = async (req, res) => {
  try {
    let { name, email, password } = req.body;

    let findExpert = await Admin.findOne({ email });

    if (findExpert)
      return res.status(400).json({ message: "grage deja existe" });
    let passwordHash = await bcrypt.hash(password, 10);

    let newAdmin = new Admin({
      name,
      email,
      password: passwordHash,
      role: "grage",
    });
    await newAdmin.save();

    res.status(200).json({
      message: "grage ajouter avec succe",
      succes: true,
      error: false,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message, succes: false, error: true });
  }
};

const getAllGrage = async (req, res) => {
  try {
    let findExpert = await Admin.find({ role: "grage" });

    res.status(200).json({
      result: findExpert,
      succes: true,
      error: false,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message, succes: false, error: true });
  }
};

const getListAdminSidBar = async (req, res) => {
  try {
    const findAdmin = await Admin.find().select("name role");

    res.status(200).json({ result: findAdmin, succes: true, error: false });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message, succes: false, error: true });
  }
};

module.exports = {
  getCurrentAdmin,
  AjouterExpert,
  AjouterGrage,
  getAllExpert,
  getAllGrage,
  findGestionnaire,
  getListAdminSidBar,
};
