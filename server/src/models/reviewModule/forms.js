const mongoose = require("mongoose");
const Paper = require("./paper");
const User = require("../usermanagement/user");
const Event = require("./event");

const questionSchema = new mongoose.Schema({
    question: { type: String, required: true },
    type: { type: String, required: true },
    options: [{ type: String }],
    order: { type: Number, required: true },
});

const formSchema = new mongoose.Schema({
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    show: { type: Boolean, default: false },
    questions: [questionSchema],
    title: { type: String, required: true },
    section: { type: String, required: true },
    sharedWith: [{ type: String }],
    deadline: { type: Date },
    accessRole: { type: String, required: true }
}, { timestamps: true });

const Form = mongoose.model("PRS-Form", formSchema);

module.exports = Form;
