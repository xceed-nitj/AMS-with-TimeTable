const { default: mongoose } = require("mongoose");

const gamificationSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Patient', 
        required: true},
    date: {type: Date, required: true},
    progress: {type: Number, required: true},
    entryTime: {type: String, default: Date.now()},
    badgeCount: {type: Number, default: 0},
    starCount: {type: Number, default: 0},
    TotalStars: {type: Number, default: 0},
    TotalBadges: {type: Number, default: 0}
});

const Gamification = mongoose.model('Gamification', gamificationSchema);

module.exports = Gamification;