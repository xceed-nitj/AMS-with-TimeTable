const mongoose = require("mongoose");
/*name: 
rollno: 
batch: year-year 
degree: 
dept: 
company: 
story: 
linkedIn: 
 */
const storySchema = new mongoose.Schema({
  name: { type: String, required: true },
  rollno: { type: String, required: true },
  batch: { type: String, required: true }, // Format: YYYY-YYYY
  degree: { type: String, required: true },
  dept: { type: String, required: true },
  company: { type: String, required: true },
  story: { type: String, required: true },
  linkedIn: { type: String, required: true }
});

const Story = mongoose.model("Stories", storySchema);

module.exports = Story;
