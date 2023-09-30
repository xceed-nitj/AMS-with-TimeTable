const express = require('express');
const ConfController = require('../crud/conf');

const router = express.Router();
const confController = new ConfController();


// / GET endpoint--> all data conf id
// / POST endpoint--> add data
// / PUT endpoint--> update data
// /:id delete--> delete data
// /:id GET endpoint--> get data by id

router.get('/', async (req, res) => {
    try {
        const resp = await confController.getConf();
        res.status(200).json(resp);
    } catch (e) {
        console.error("Error retrieving conf items:", e);
        res.status(e?.errorCode || 500).json({ error: e?.message || "Internal server error" });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const resp = await confController.getConfById(id);
        res.status(200).json(resp);
    } catch (e) {
        console.error("Error retrieving conf items:", e);
        res.status(e?.code || 500).json({ error: e?.message || "Internal server error" });
    }
});

router.post('/', async (req, res) => {
    try {
        const confObj = req.body;
        await confController.addConf(confObj);
        res.status(200).json({ success: "Added Successfully" });
    } catch (e) {
        console.error("Error retrieving navbar items:", e);
        res.status(e?.code || 500).json({ error: e?.message || "Internal server error" });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const confObj = req.body;
        await confController.updateConf(confObj, req.params.id);
        res.status(200).json({ success: "Updated Successfully" });
    } catch (e) {
        console.error("Error retrieving navbar items:", e);
        res.status(e?.code || 500).json({ error: e?.message || "Internal server error" });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await confController.deleteConf(id);
        res.status(200).json({ success: "Deleted Successfully" });
    } catch (e) {
        console.error("Error retrieving navbar items:", e);
        res.status(e?.code || 500).json({ error: e?.message || "Internal server error" });
    }
});

module.exports = router;