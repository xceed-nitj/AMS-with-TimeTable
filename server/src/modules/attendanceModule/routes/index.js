const express = require("express");
const router  = express.Router();
const acquisitionControlRoutes = require('./acquisitionControlRoutes');


router.use('/student',      require("./student"));
router.use('/ground-truth', require("./groundTruthRoutes"));
router.use('/roll-assign',  require("./rollAssignRoutes"));
router.use('/flags',        require("./flagRoutes"));
router.use('/reports',      require("./attendanceReportRoutes"));
router.use('/cameras',      require("./cameraRoutes"));
router.use('/embeddings',   require("./embeddingRouter"));
router.use('/frame-verification', require("./frameVerificationRoutes"));
router.use('/ground-truth-upload', require("./groundTruthUploadRoutes"));
router.use('/acquisition-control', acquisitionControlRoutes);


module.exports = router;