function getDayInMilliseconds(dayAmount) {
  const secondInMs = 1000;
  const minuteInSecs = 60;
  const hourInMins = 60;
  const dayInHrs = 24;

  const result = secondInMs * minuteInSecs * hourInMins * dayInHrs * dayAmount;

  return result;
}

function getMinutesInMilliseconds(minutesAmount) {
  const secondInMs = 1000;
  const minuteInSecs = 60;

  const result = secondInMs * minuteInSecs * minutesAmount;

  return result;
}

const dateConverter = {
  getDayInMilliseconds,
  getMinutesInMilliseconds,
};

export default dateConverter;
