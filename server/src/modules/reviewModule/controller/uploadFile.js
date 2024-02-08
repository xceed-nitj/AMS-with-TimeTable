const Paper = require("../../../models/reviewModule/paper.js");

const uploadPaper = (req, res) => {
  const fileName = req.fileName;

  if (!fileName) {
    return res.status(400).send("File name is missing in the request.");
  }

  const newPaper = new Paper({
    paperId: fileName,
  });

  newPaper
    .save()
    .then((savedPaper) => {
      //console.log("Paper saved successfully:", savedPaper);
      res.status(200).send("Paper uploaded and saved successfully!");
    })
    .catch((error) => {
     // console.error("Error saving paper:", error);
      res.status(500).send("Internal Server Error");
    });
};

module.exports = uploadPaper;
