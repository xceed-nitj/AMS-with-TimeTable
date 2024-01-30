const mongoose = require('mongoose');
const User = require('./user.js')

const paperSchema = new mongoose.Schema({
    paperId: { type: mongoose.Schema.Types.ObjectId, required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, required: true },
    authors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    abstract: {type:String},
    uploadLink: {type:String},
    version:{type:String},
    createdAt: {type:Date, required: true},
    updatedAt: {type:Date, required: true},
    reviewers: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        comment_author: {type: String},
        Rating: {type: Number},
        comment_editor: {type: String},
        status:{
            type:String,
            enum: ['Under Review','Accepted','Rejected'],
            default: 'Under Review'
        }
    }],
    editors:[{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    finalDecision: {type:String}
});

const Paper = mongoose.model("Paper", paperSchema);

module.exports = Paper;