const mongoose = require('mongoose')

const hospitalSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    location: { type: String, required: true },
    phone: { type: String, required: true },
  },
  { timestamps: true }
)

const Hospital = mongoose.model('Hospital', hospitalSchema)
module.exports = Hospital
