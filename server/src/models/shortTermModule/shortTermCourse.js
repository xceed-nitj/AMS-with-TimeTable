const mongoose = require("mongoose");
const { commonFields, updateTimestamps } = require('./commonFields');


const ShortTermSchema = new mongoose.Schema({
  GuestOfHonour: [{
    
    type: Object,
    properties: {
      name: { 
        type: String 
    },
      designation: {
         type: String 
        },
      affiliation: { 
        type: String 
    },
    }
    
  }] ,
  ResourcePerson:[{
    
    type: Object,
    properties: {
      name: { 
        type: String 
    },
      designation: {
         type: String 
        },
      affiliation: { 
        type: String 
    },
    }
    
  }] ,
  Patron:[{
    
    type: Object,
    properties: {
      name: { 
        type: String 
    },
      designation: {
         type: String 
        },
      affiliation: { 
        type: String 
    },
    }
    
  }] ,
  CourseConveners:[{
    type:Object,
    properties: {
        name: { 
          type: String 
      },
        designation: {
           type: String 
          },
        department: { 
          type: String 
      },
      }

  }],
  CourseCoordinators:[{
    type:Object,
    properties: {
        name: { 
          type: String 
      },
        designation: {
           type: String 
          },
        department: { 
          type: String 
      },
      }

  }] ,
  AboutCollege:{
    type:String,
    required:true
  },
  AboutDepartment:{
    type:String,
    required:true
  },
  Objective:{
    type:String,
    required:true
  },
  Eligibility:{
    type:String,
    required:true
  },
  NoteForParticipant:{
    type:String,
    required:true
  },
  Registration:{
    type:String,
    required:true
  },
  Confirmation:{
    type:String,
    required:true
  },
  StartingDate:{
    type:Date,
    required:true
  },
  title1:{
    type:String,
    required:true
  },
  title2:{
    type:String,
    required:true
  },
  banner:{
    type:String,
    required:true
  },
  Contact:[{
    type:Object,
    properties:{
      name:{type:String},
      contactType:{type:string}
    }
  }]


  
});


ShortTermSchema.add(commonFields);

ShortTermSchema.pre('save', updateTimestamps);

const ShortTerm = mongoose.model("Note", ShortTermSchema);

module.exports = ShortTerm;
