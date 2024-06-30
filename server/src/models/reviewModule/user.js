const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    role:{
        type:String,
        enum: ['Author','Editor','Reviewer'],
        required: true,
    },
    password: { type: String, required: true },
    experience: {
        Dept:{type: String},
        Designation:{type: String},
        College:{type: String},
        Period:{type: Number},
    },
    profession: {type: String},
    email: [{type: String, required: true}],
    area:[{type: String}],
});

const User = mongoose.model("PRS-User", userSchema);

module.exports = User;
