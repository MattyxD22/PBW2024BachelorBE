export const getCurrentWeek = () => {
    const currentDate = new Date();
    const currentDay = currentDate.getDay();
    
    // Calculate the offset for Monday (1) and Sunday (0)
    // Sunday (0) is treated as the last day of the week
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay; // Monday is the first day of the week
    const sundayOffset = 0 - currentDay; // Sunday is the last day of the week

    // Set the start of the week (Monday)
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() + mondayOffset);

    // Set the end of the week (Sunday)
    const endOfWeek = new Date(currentDate);
    endOfWeek.setDate(currentDate.getDate() + sundayOffset);

    // Format date to 'YYYY-MM-DD'
    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    return {
        startOfWeek: formatDate(startOfWeek),
        endOfWeek: formatDate(endOfWeek),
    };
}

// Function to extract tracked time information from task data
export const extractTrackedTimeInfo = (timeEntry: any) => {
    // Return null if `timeEntry` or `intervals` is missing
    if (!timeEntry || !timeEntry.intervals || timeEntry.intervals.length === 0) return null;

    // Calculate total tracked time in hours and minutes
    const totalMinutes = Math.floor(timeEntry.time / 60000); // Convert ms to minutes
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    // Use the `date_added` from the first interval as the logged date
    const dateLogged = new Date(parseInt(timeEntry.intervals[0].date_added));

    // Format the date
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    };
    const formattedDate = dateLogged.toLocaleString('dk-DA', options);

    return {
      duration: {
        hours: hours,
        minutes: minutes,
      },
      dateLogged: timeEntry.intervals[0].date_added,
      loggedBy: timeEntry.user.email,
      taskTitle: timeEntry.title
    };
};

module.exports = {
    getCurrentWeek,
    extractTrackedTimeInfo
  };