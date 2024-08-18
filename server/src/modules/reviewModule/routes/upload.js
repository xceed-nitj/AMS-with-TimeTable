const express = require("express");
const router = express.Router();
const path = require('path');
const fs = require('fs');

router.get("/:eventId/:userId/:type/:filename", (req, res) => {
  try{
    const filepath = path.join(__dirname, `../../../../uploads/reviewModule/${req.params.eventId}/${req.params.userId}/${req.params.type}/${req.params.filename}`)
    console.log(filepath);
    res.sendFile(filepath);
  }catch(error){
    console.log(error);
    res.send(err);
  }
});
//to delete the uploaded file
router.get("/delete/:eventId/:userId/:type/:filename", (req, res) => {
  try{
  const filepath = path.join(__dirname, `../../../../uploads/reviewModule/${req.params.eventId}/${req.params.userId}/${req.params.type}/${req.params.filename}`)
  console.log(filepath);
  fs.unlink(filepath,function(err){
    if(err) return console.log(err);
    console.log('file deleted successfully');
}); 
  res.send('file deleted successfully');
}catch(err){
  res.status(404).send("cannot find the specified file!");
}
})

module.exports = router;
