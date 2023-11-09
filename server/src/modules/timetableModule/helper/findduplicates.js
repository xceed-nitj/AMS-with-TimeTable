// Import the necessary modules and your Mongoose model
const mongoose = require('mongoose');
const Subject = require('../../../models/subject');

// Function to check for duplicates based on subName
async function findDuplicateSubjects(code) {
  try {
    const duplicates = await Subject.aggregate([
      {
        $match: { code }, // Match documents with the specified code
      },
      {
        $group: {
          _id: '$subName', // Group by the subName field
          count: { $sum: 1 },
        },
      },
      {
        $match: { count: { $gt: 1 } }, // Filter for subName duplicates
      },
    ]);

    return duplicates.map((duplicate) => duplicate._id); // Return an array of duplicate subNames
  } catch (error) {
    console.error('Error finding duplicates:', error);
    throw error;
  }
}

module.exports = { findDuplicateSubjects };
