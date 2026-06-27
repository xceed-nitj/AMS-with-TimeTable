const express = require("express");
const router = express.Router();
const path = require("path")

const { getFolderTree, getFilesWithPagination, streamFile } = require("../controllers/mldataFolderSizeController.js");

router.get("/", async (req, res) => {
    try {
        const tree = await getFolderTree(path.join(__dirname, "../../../../ml-data"));
        res.json(tree);
    }
    catch(err){
        res.status(500).json({error: err.message})
    }
})

/*
GET /api/ml-data/files
Query Params:
folder=<relative-folder-path>
page=1
limit=50
*/
router.get("/files", getFilesWithPagination);

/*
GET /api/ml-data/file
Query Params:
path=<relative-file-path>
*/
router.get("/file", streamFile);

module.exports = router