const express = require("express");
const router = express.Router();

router.use('/addevent', require("./addevent")); 
router.use('/certificate', require("./certificate")); 
router.use('/participant', require("./participant"));
router.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
  });
  
  router.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  });
  
module.exports = router;

