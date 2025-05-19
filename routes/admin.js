const express = require("express");
const auth = require("../middleware/auth");
const {
  getCurrentAdmin,
  AjouterExpert,
  AjouterGrage,
  getAllExpert,
  getAllGrage,
  findGestionnaire,
  getListAdminSidBar,
} = require("../controller/admin");
const router = express.Router();

router.get("/currentAdmin", auth, getCurrentAdmin);
router.get("/findGestionnaire", findGestionnaire);
router.post("/AjouterExpert", AjouterExpert);
router.get("/getExpert", getAllExpert);
router.post("/AjouterGrage", AjouterGrage);
router.get("/getgrage", getAllGrage);
router.get("/getListAdminSidBar", getListAdminSidBar);
module.exports = router;
