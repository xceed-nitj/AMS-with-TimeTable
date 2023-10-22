const TimeTable = require("../../../models/timetable");

const findtt = async (code) => {
  try {
    const oldtt = await TimeTable.findOne({ code:code });
    return oldtt;
  } catch (error) {
    console.error(error);
    throw error;
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
const existingtt = await findtt(generatedLink);
    if (!existingtt) {
      isLinkUnique = true;
    }
  }
   return generatedLink;
};
module.exports = generateUniqueLink;


