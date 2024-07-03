const express = require("express");
const { findAllPapers, findEventPaper, findPaper, updatePaper, addReviewer, removeReviewer, findPaperById,findPaperByReviewer,findPaperByAuthor, addAuthor, PaperCountByTrack } = require("../controller/papers");
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
router.get("/getPaperDetail/:id",findPaperById);
router.get("/reviewer/:id", findPaperByReviewer);//to find paper using UserID
router.get("/author/:id", findPaperByAuthor);//to find paper using UserID
router.get("/trackcount/:id",PaperCountByTrack);
router.post("/addpaper/:id", fileUploadMiddleware, uploadPaper); // upload paper
router.post('/addReviewer/:id', addReviewer);
router.post('/addAuthor', addAuthor);
router.post('/removeReviewer/:id', removeReviewer);
router.post("/reuploadPaper/:id", fileUploadMiddleware, reupload);
router.patch("/:id", updatePaper); // By _id

module.exports = router;
