const express = require("express");
const router = express.Router();
const path = require("path")

const { getFolderTree } = require("../controllers/mldataFolderSizeController.js");

router.get("/", async (req, res) => {
    try {
        const tree = await getFolderTree(path.join(__dirname, "../../../../ml-data"));
        res.json(tree);
    }
    catch(err){
        res.status(500).json({error: err.message})
    }
})

module.exports = router