const mongoose = require("mongoose");

const hospitalSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: { type: String, required: true },
    phone: { type: String, required: true },
    doctors: [{ type: String }],
    patients: [{ type: String }],
}, { timestamps: true }
);

const Hospital = mongoose.model("Hospital", hospitalSchema);
module.exports = Hospital;
