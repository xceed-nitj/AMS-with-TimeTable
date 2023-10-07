const mongoose = require('mongoose');
const express = require("express");
const TimeTable = require("../../../models/timetable");

const findtt = async (code) => {
  try {
    console.log(code);
    const oldtt = await TimeTable.findOne({ Code: code }); // Use "Code" directly
    console.log(oldtt);
    return oldtt;
  } catch (error) {
    console.error(error);
    throw error; // Handle the error appropriately
  }
};
const generateUniqueLink = async () => {

  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const generateRandomLink = () => {
    let link = '';
    for (let i = 0; i < 3; i++) {
      link += letters[Math.floor(Math.random() * letters.length)];
    }
    link += '-';
    for (let i = 0; i < 3; i++) {
      link += letters[Math.floor(Math.random() * letters.length)];
    }
    link += '-';
    for (let i = 0; i < 3; i++) {
      link += letters[Math.floor(Math.random() * letters.length)];
    }
    return link;
  };

   let generatedLink;
  let isLinkUnique = false;
  while (!isLinkUnique) {
   generatedLink = generateRandomLink();
    console.log(generatedLink);
const existingtt = await findtt(generatedLink);
    if (!existingtt) {
      isLinkUnique = true;
    }
  }
   return generatedLink;
};
module.exports = generateUniqueLink;


