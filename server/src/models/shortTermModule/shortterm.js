const mongoose = require("mongoose");
const { commonFields, updateTimestamps } = require('../commonFields');


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
    
  },
  AboutDepartment:{
    type:String,
    
  },
  Objective:{
    type:String,
    
  },
  Eligibility:{
    type:String,
    
  },
  NoteForParticipant:{
    type:String,
    
  },
  Registration:{
    type:String,
    
  },
  Confirmation:{
    type:String,
    
  },
  StartingDate:{
    type:Date,
    
  },
  title1:{
    type:String,
    
  },
  title2:{
    type:String,
    
  },
  banner:{
    type:String,
    
  },
  Contact:[{
    type:Object,
    properties:{
      name:{
        type:String
      },
      contactType:{
        type:String
      }
    }
  }],

  eventId:{
    type:String,
    
  }


  
});


ShortTermSchema.add(commonFields);

ShortTermSchema.pre('save', updateTimestamps);

const ShortTerm = mongoose.model("ShortTerm", ShortTermSchema);

module.exports = ShortTerm;
