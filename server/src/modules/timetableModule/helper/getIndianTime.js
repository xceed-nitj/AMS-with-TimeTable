function getIndianTime(timestamp) {
    const date = new Date(timestamp);
  
    // Specify the timezone offset for IST (GMT+5:30)
    const timezoneOffsetMinutes = 330; // 5 hours and 30 minutes
  
    // Apply the IST timezone offset to the date
    date.setMinutes(date.getMinutes() + timezoneOffsetMinutes);
  
    // Format the date and time in IST
    const formattedDate = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata', // IST (Indian Standard Time)
      dateStyle: 'long',
      timeStyle: 'medium',
    }).format(date);
  
    return formattedDate;
  }
  
  