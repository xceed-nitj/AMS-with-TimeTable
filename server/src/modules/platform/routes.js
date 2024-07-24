const express = require("express");
const router = express.Router();

const {addPlatform,getPlatform,updatePlatform,deletePlatform,getPlatformById} = require('../platform/controller');

router.post("/add", addPlatform);
router.get("/getplatform", getPlatform);
router.get("/get/:id", getPlatformById);
router.patch("/update/:id", updatePlatform);
router.delete("/delete/:id", deletePlatform);

module.exports = router;