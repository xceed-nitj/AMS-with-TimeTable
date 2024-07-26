const mongoose = require("mongoose");
const Paper=require("./paper");
const User =require("../usermanagement/user");
const Event =require("./event");

const formSchema = new mongoose.Schema({
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    show: { type: Boolean, default: false },
    type: [{ type: String }],
    question: [{ type: String }],
    options: [{ type: String }],
    order: [{ type: Number }],
    title: { type: String, required: true },
    section: { type: String, required: true },
    sharedWith: [{ type: String }], // Added field
    deadline: { type: Date },
    accessRole: { type: String, required: true }
}, { timestamps: true });

const Form = mongoose.model("PRS-Form", formSchema);

module.exports = Form;
