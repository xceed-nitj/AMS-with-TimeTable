const mongoose = require('mongoose');
const User = require('./user.js');
const Event = require('./event.js');
 
const paperSchema = new mongoose.Schema({
    paperId: { type: String,  required:true},
    eventId: { type: mongoose.Schema.Types.ObjectId, ref:'Event' },
    authors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    abstract: {type:String},
    uploadLink: {type:String},
    version:{type:String},
    createdAt: {type:Date, },
    updatedAt: {type:Date, },
    reviewers: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User',  },
        comment_author: {type: String},
        rating: {type: Number},
        comment_editor: {type: String},
        status:{
            type:String,
            enum: ['Under Review','Accepted','Rejected'],
            default: 'Under Review'
        }
    }],
    editors:[{ type: mongoose.Schema.Types.ObjectId, ref: 'User',  }],
    finalDecision: {type:String}
});

const Paper = mongoose.model("PRS-Paper", paperSchema);

module.exports = Paper;