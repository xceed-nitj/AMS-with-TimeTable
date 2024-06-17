export const extractDateTime = (timestamp) => {
  const dateTime = new Date(timestamp);
  const formattedDate = dateTime.toDateString();
  const formattedTime = dateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${formattedDate} ${formattedTime}`;
};

  