const mongoose = require('mongoose');

const platformSchema = new mongoose.Schema({
    roles: [{
        type: String,
    }],
    exemptedLinks: [{
        type: String,
    }],
    researchArea: [{
        type: String,
    }]
});
  
const Platform = mongoose.model("Platform", platformSchema);
module.exports = Platform;