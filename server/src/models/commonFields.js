const mongoose = require('mongoose');

const commonFields = {
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
};

const updateTimestamps = function (next) {
  const currentDate = new Date();
  this.updated_at = currentDate;
  if (!this.created_at) {
    this.created_at = currentDate;
  }
  next();
};

module.exports = {
  commonFields,
  updateTimestamps,
};
