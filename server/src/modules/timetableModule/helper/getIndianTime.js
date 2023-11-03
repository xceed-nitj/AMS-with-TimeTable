const getIndianTime = async(timestamp)=> {
  const date = new Date(timestamp);
  
  // Specify the IST offset in minutes (GMT+5:30)
  const ISTOffsetMinutes = 0;
  
  // Calculate the UTC timestamp with the IST offset
  const utcTimestamp = date.getTime() + (ISTOffsetMinutes * 60000);

  // Create a new Date object with the adjusted UTC timestamp
  const istDate = new Date(utcTimestamp);

  // Format the date and time in IST
  const formattedDate = istDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });

  return formattedDate;
}

module.exports=getIndianTime;