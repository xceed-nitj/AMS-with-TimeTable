const express = require("express");
const router = express.Router();

const {addPlatform,getPlatform,updatePlatform,deletePlatform,getPlatformById,addService} = require('../platform/controller');

router.post("/add", addPlatform);
router.post("/add/service", addService);
router.get("/getplatform", getPlatform);
router.get("/get/:id", getPlatformById);
router.patch("/update/:id", updatePlatform);
router.delete("/delete/:id", deletePlatform);

module.exports = router;