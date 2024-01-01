const getIndianTime = (timestamp) => {
  const date = new Date(timestamp);

  // Specify the IST offset in minutes (GMT+5:30)
  const ISTOffsetMinutes = 0; // 5 hours and 30 minutes

  // Set the UTC hours and minutes with the IST offset
  date.setUTCHours(date.getUTCHours() + ISTOffsetMinutes / 60);
  date.setUTCMinutes(date.getUTCMinutes() + ISTOffsetMinutes % 60);

  const formattedDateTime = date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  return formattedDateTime;
};

module.exports = getIndianTime;
