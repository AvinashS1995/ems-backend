export function getPollutantAQI(value, pollutant) {
  switch (pollutant) {
    case "pm2_5":
      if (value <= 12) return 1;
      else if (value <= 35.4) return 2;
      else if (value <= 55.4) return 3;
      else if (value <= 150.4) return 4;
      else if (value <= 250.4) return 5;
      else return 6;
    case "pm10":
      if (value <= 50) return 1;
      else if (value <= 100) return 2;
      else if (value <= 150) return 3;
      else if (value <= 250) return 4;
      else if (value <= 350) return 5;
      else return 6;
    default:
      return 0;
  }
}

export function getAQILabel(aqi) {
  switch (aqi) {
    case 1:
      return "Good";
    case 2:
      return "Fair";
    case 3:
      return "Unhealthy for Sensitive Groups";
    case 4:
      return "Unhealthy";
    case 5:
      return "Very Unhealthy";
    case 6:
      return "Hazardous";
    default:
      return "Unknown";
  }
}

export function aggregateDaily(hourlyArray, start, end) {
  const slice = hourlyArray.slice(start, end);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}
