// Funktion til at hente starten og slutningen af den nuværende uge
export const getCurrentWeek = () => {
  const currentDate = new Date();
  const currentDay = currentDate.getDay();

  // Beregn offset for mandag (1) og juster for søndag (7)
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
  const sundayOffset = currentDay === 0 ? 0 : 7 - currentDay;

  // Sætter starten af ugen til mandag
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() + mondayOffset);

  // Sæt slutningen af ugen til søndag
  const endOfWeek = new Date(currentDate);
  endOfWeek.setDate(currentDate.getDate() + sundayOffset);

  // Formater datoen til 'YYYY-MM-DD'
  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  return {
    startOfWeek: formatDate(startOfWeek),
    endOfWeek: formatDate(endOfWeek),
  };
};

// Funktion til at udtrække tid brugt på en opgave fra tidsregistreringsdata
export const extractTrackedTimeInfo = (timeEntry: any) => {
  if (!timeEntry || !timeEntry.intervals || timeEntry.intervals.length === 0)
    return null;

  // Beregn samlet brugt tid i timer og minutter
  const totalMinutes = Math.floor(timeEntry.time / 60000); // Konverter ms til minutter
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  // Brug `date_added` fra det første interval som den loggede dato
  const dateLogged = new Date(parseInt(timeEntry.intervals[0].date_added));

  // Formater datoen
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  };
  const formattedDate = dateLogged.toLocaleString("en-US", options);

  return {
    taskHours: hours,
    taskMinutes: minutes,
    formattedDate: formattedDate,
    dateLogged: timeEntry.intervals[0].date_added,
    loggedBy: timeEntry.user.email,
    taskTitle: timeEntry.title,
  };
};

module.exports = {
  getCurrentWeek,
  extractTrackedTimeInfo,
};
