const mongoose = require("mongoose");

const sickDaySchema = new mongoose.Schema({
    patientId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Patient",
		required: true,
    },
    data: {
		date: { type: Date, required: true },
		time: { type: String, required: true },
		bloodSugar: { type: Number, required: true },
		carboLevel: { type: Number, required: true },
		insulin: { type: Number, required: true },
		longLastingInsulin: { type: Number, required: true },
    }
}, { timestamps: true }
);

const SickDay = new mongoose.model("SickDay", sickDaySchema);

module.exports = SickDay;
