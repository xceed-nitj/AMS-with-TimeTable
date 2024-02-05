const mongoose = require("mongoose");
const User = require("./user.js");

const eventSchema = new mongoose.Schema({
    /*eventID: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },*/
    type: {
        type: String,
        required: true,
    },
    dates:{
        fromDate:{
            type: Date,
            required: true,
        },
        toDate:{
            type: Date,
            required: true,
        },
    },
    editor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    paperSubmissionDate:{
        type: Date,
        required: true,
    },
    reviewTime:{
        type: String, 
        required: true,
    }
});

const Event = mongoose.model("Event", eventSchema);

module.exports = Event;
