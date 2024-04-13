const Paper = require("../../../models/reviewModule/paper.js");

const uploadPaper = (req, res) => {
  const fileName = req.fileName;
  const title = req.title;
  const abstract = req.abstract;

  if (!fileName) {
    return res.status(400).send("File name is missing in the request.");
  }

  const newPaper = new Paper({
    paperId: fileName,
    title: title,
    abstract: abstract,
    uploadLink: fileName,
  });

  newPaper
    .save()
    .then((savedPaper) => {
      //console.log("Paper saved successfully:", savedPaper);
      res.status(200).send("Paper uploaded and saved successfully!");
    })
    .catch((error) => {
     // console.error("Error saving paper:", error);
      res.status(500).send(error);
    });
};

module.exports = uploadPaper;
