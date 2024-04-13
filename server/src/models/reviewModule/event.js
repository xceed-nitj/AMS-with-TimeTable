const mongoose = require("mongoose");
const User = require("./user.js");

const eventSchema = new mongoose.Schema({
    /*eventID: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },*/
    name: {
        type: String,
        required: true,
    },
    dates:{
        fromDate:{
            type: Date,
        },
        toDate:{
            type: Date,
        },
    },
    editor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }],
    paperSubmissionDate:{
        type: Date,
    },
    reviewTime:{
        type: String, 
    },
    instructions:{type:String},
});

const Event = mongoose.model("PRS-Event", eventSchema);

module.exports = Event;
