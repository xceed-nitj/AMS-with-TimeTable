const getIndianTime = async (timestamp) => {
  const date = new Date(timestamp);

  // Specify the IST offset in minutes (GMT+5:30)
  const ISTOffsetMinutes = 330; // 5 hours and 30 minutes

  // Calculate the UTC timestamp with the IST offset
  const utcTimestamp = date.getTime() + (ISTOffsetMinutes * 60000);

  // Create a new Date object with the adjusted UTC timestamp
  const istDate = new Date(utcTimestamp);

  // Format the date in IST to 'DD/MM/YYYY' format
  const day = String(istDate.getDate()).padStart(2, '0');
  const month = String(istDate.getMonth() + 1).padStart(2, '0'); // Months are zero-based
  const year = istDate.getFullYear();

  // Format the time in IST in HH:MM:SS AM/PM format
  const hours = String(istDate.getHours() % 12 || 12).padStart(2, '0');
  const minutes = String(istDate.getMinutes()).padStart(2, '0');
  const seconds = String(istDate.getSeconds()).padStart(2, '0');
  const ampm = istDate.getHours() < 12 ? 'AM' : 'PM';

  const formattedDateTime = `${day}/${month}/${year} ${hours}:${minutes}:${seconds} ${ampm}`;

  return formattedDateTime;
}

module.exports = getIndianTime;
