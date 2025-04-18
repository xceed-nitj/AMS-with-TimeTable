
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender:     { type: mongoose.Types.ObjectId, ref: 'User', required: true },
  title:     { type: String, required: true },
 
  content:    { type: String, required: true },
  targetRole: { type: String,
                enum: ['ITTC', 'DTTI', 'CM', 'admin', 'EO', 'editor', 'PRM', 'FACULTY', 'doctor', 'patient', 'dm-admin'],
                default: 'DTTI' },  
  

},{
  timestamps: true,
});

module.exports = mongoose.model('Message', MessageSchema);
