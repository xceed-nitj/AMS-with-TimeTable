const mongoose = require("mongoose");

const nirfSchema = new mongoose.Schema({
    InstitueId: {
        type: String,
    },
    Institute: {
        type: String,
    },
    Year: {
        type: String,
    },
    Category: {
        type: String,
    },
    Rank: {
        type: Number,
    },
    Location: {
        type: String,
    },
    State: {
        type: String
    },
    // templates:templateSchema,
});

const Nirf = mongoose.model("Nirf", nirfSchema);

module.exports = Nirf;
