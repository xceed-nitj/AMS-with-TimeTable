const mongoose = require("mongoose");

const hospitalSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: { type: String, required: true },
    phone: { type: String, required: true },
    doctors: [{
        doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
        name: { type: String } // Add this line
    }],
    patients: [{
        patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
        name: { type: String } // Add this line
    }]
}, { timestamps: true }
);

const Hospital = mongoose.model("Hospital", hospitalSchema);
module.exports = Hospital;
