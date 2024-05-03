const mongoose = require('mongoose');
const User = require('./user.js');
const Event = require('./event.js');
 
const paperSchema = new mongoose.Schema({
    paperId: { type: String,  required:true},                          
    eventId: { type: mongoose.Schema.Types.ObjectId, ref:'Event' },    
    authors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],  
    abstract: {type:String, authorAccess:true,},
    title: {type:String, authorAccess:true,},
    uploadLink: [{type:String, authorAccess:true,}],
    version:{type: Number, default: 1,},
    createdAt: {type:Date, },
    updatedAt: {type:Date, },
    ResubmissionDate: {type:Date, editorAccess:true,},
    reviewers: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', editorAccess:true, },
        comment_author: {type: String, authorAccess:true,},
        rating: {type: Number, reviewerAccess:true,},
        comment_editor: {type: String, editorAccess:true,},
        status:{
            type:String,
            enum: ['Under Review','Accepted','Rejected'],
            default: 'Under Review',
            reviewerAccess:true,
        },
        version: {type: Number, default: function(){
            return this.parent().version;
        },},
        reviewerStatus: {
            type:String,
            enum: ['Accepted','Waiting','Rejected'],
            default: 'Waiting',
            reviewerAccess:true,
        }
    }],
    editors:[{ type: mongoose.Schema.Types.ObjectId, ref: 'User',  }],
    finalDecision: {type:String}
});

const Paper = mongoose.model("PRS-Paper", paperSchema);

module.exports = Paper;