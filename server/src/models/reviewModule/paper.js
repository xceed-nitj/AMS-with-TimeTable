const mongoose = require('mongoose');
const User = require('../usermanagement/user.js');
const Event = require('./event.js');

const paperSchema = new mongoose.Schema({

    paperId: { type: Number,  required:true},                          
    eventId: { type: mongoose.Schema.Types.ObjectId, ref:'Event' },    
    authors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }],  
    pseudo_authors: {
        type: Array,
        default: []
    },
    abstract: {type:String, authorAccess:true,},
    tracks:[{type: String}],
    title: {type:String, authorAccess:true,},
    uploadLink: [{type:String, authorAccess:true,}],
    codeLink: [{type:String, authorAccess:true,}],
    version:{type: Number, default: 1,},
    submissionStatus:{
        type: String,
        default: "Submitted"
    },
    createdAt: {type:Date, },
    updatedAt: {type:Date, },
    ResubmissionDate: {type:Date, editorAccess:true,},

    reviewers: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', editorAccess: true },
        username:{ type: String, authorAccess: true },
        comment_author: { type: String, authorAccess: true },
        rating: { type: Number, reviewerAccess: true },
        comment_editor: { type: String, editorAccess: true },
        dueDate: { type: Date, editorAcess: true },
        completedDate: { type: Date, editorAcess: true },
        status: {
            type: String,
            enum: ['Under Review', 'Accepted', 'Rejected'],
            default: 'Under Review',
            reviewerAccess: true,
        },
        version: {
            type: Number,
            default: function () {
                return this.parent().version;
            },
        },
        reviewerStatus: {
            type: String,
            enum: ['Accepted', 'Waiting', 'Rejected'],
            default: 'Waiting',
            reviewerAccess: true,
        }
    }],
    editors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }],
    finalDecision: { type: String },
    status: {
        type: String,
        enum: ['Accepted', 'Rejected', 'Under Review'],
        default: 'Under Review'
    },
    terms: {
        type: Boolean,
        default: true,
    }
},{timestamps: true});

const Paper = mongoose.model("PRS-Paper", paperSchema);

module.exports = Paper;