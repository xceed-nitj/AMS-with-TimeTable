
const mongoose = require('mongoose');
const Subject = require('../../../models/subject');

async function findDuplicateSubjects(code) {
  try {
    const duplicates = await Subject.aggregate([
      {
        $match: { code }, 
      },
      {
        $group: {
          _id: '$subName', 
          count: { $sum: 1 },
        },
      },
      {
        $match: { count: { $gt: 1 } }, 
      },
    ]);

    return duplicates.map((duplicate) => duplicate._id); 
  } catch (error) {
    console.error('Error finding duplicates:', error);
    throw error;
  }
}

module.exports = { findDuplicateSubjects };