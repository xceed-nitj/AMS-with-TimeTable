const mongoose = require("mongoose");

const DailyDosageSchema = new mongoose.Schema({
	patientId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Patient",
		required: true,
	},
	data: {
		date: { type: Date, required: true },
		session: {
			type: String,
			enum: ["pre-breakfast", "pre-lunch", "pre-dinner", "night"],
			required: true,
		},
		bloodSugar: { type: Number, required: true },
		carboLevel: { type: Number, required: true },
		insulin: { type: Number, required: true },
		longLastingInsulin: { type: Number, required: true },
		physicalActivity: { type: String },
	}
}, {timestamps: true}
);

const DailyDosage = new mongoose.model("DailyDosage", DailyDosageSchema);

module.exports = DailyDosage;
