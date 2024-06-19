const express = require("express");
const { findAllPapers, addReviewer, findEventPaper, findPaper, updatePaper, removeReviewer, findPaperByReviewer } = require("../controller/papers");
const fileUploadMiddleware = require("../controller/uploadFileMiddleWare");
const uploadPaper = require("../controller/uploadFile");
const reupload = require("../controller/reupload");
const router = express.Router();
const path = require('path');

router.get("/uploadpaper", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});
router.get("/reuploadpaper", (req, res) => {
  res.sendFile(path.join(__dirname, "index2.html"));
});

router.get("/", findAllPapers);
router.get("/:id", findEventPaper); 
router.get("/paper/:id", findEventPaper);// To find paper using paperId (not _id)
router.get("/reviewer/:id", findPaperByReviewer);//to find paper using UserID
router.post("/addpaper/:id", fileUploadMiddleware, uploadPaper); // upload paper
router.post('/addReviewer/:id', addReviewer);
router.post('/removeReviewer/:id', removeReviewer);
router.post("/reuploadPaper/:id", fileUploadMiddleware, reupload);
router.patch("/:id", updatePaper); // By _id

module.exports = router;
