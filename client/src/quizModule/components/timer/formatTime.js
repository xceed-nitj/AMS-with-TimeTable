export const formatTime = (timeInSeconds) => {
    const secondsInMinute = 60;
    const secondsInHour = 60 * secondsInMinute;
    const secondsInDay = 24 * secondsInHour;
  
    const days = Math.floor(timeInSeconds / secondsInDay);
    const hours = Math.floor((timeInSeconds % secondsInDay) / secondsInHour);
    const minutes = Math.floor((timeInSeconds % secondsInHour) / secondsInMinute);
    const seconds = timeInSeconds % secondsInMinute;
  
    return `${days}D:${hours}H:${minutes}M:${seconds}S`;
  };
  