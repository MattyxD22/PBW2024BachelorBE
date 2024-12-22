import * as globalService from "../services/global.service";
import * as sqlString from "sqlstring";
import * as scheduler from "node-schedule";

import {
  extractTrackedTimeInfo,
  formatDateForAccess,
  getCurrentWeek,
  getTaskTimeEntries,
} from "../utils/helper-utils";
import {
  fetchTeamupAuth,
  fetchTeamupSubCalendars,
  fetchTeamupUserEvents,
  fetchTeamupUsers,
} from "../services/teamup.service";
import { fetchClickupTasksFromList } from "../services/clickup.service";

// Function to update or insert data into MS Access
const updateMSAccessDatabase = async (data: any) => {
  try {
    for (const record of data) {
      const safeEmail = sqlString.escape(record.userEmail);
      const safeUserName = sqlString.escape(record.userName);

      const userID = await getOrCreateUserID(safeEmail, safeUserName);
      const eventIDs = await handleUserEvents(userID, record.userEvents);
      await handleUserTasks(userID, eventIDs, record.userTasks);
    }
  } catch (error: any) {
    console.error("Error updating the database:", error.message);
    throw error;
  }
};

const getUserID = async (safeEmail: string) => {
  try {
    const query = `SELECT ID FROM UserTable WHERE email = ${safeEmail}`;
    const access: any = await globalService.sendQuery(query);
    if (!access || access.length === 0) {
      return null;
    }
    return access[0].ID; // Return userID if exists
  } catch (error: any) {
    console.log("error in function: getUserID()");
    throw new Error(error.message);
  }
};

const handleUserEvents = async (userID: number, userEvents: any[]) => {
  try {
    const eventIDs: any[] = [];
    for (const event of userEvents) {
      const { isoDate: isoStartDate, isoTime: isoStartTime } =
        formatDateForAccess(event.startDate);
      const { isoDate: isoEndDate, isoTime: isoEndTime } = formatDateForAccess(
        event.endDate
      );
      const safeSubCalendarName = sqlString.escape(event.subCalendarName);
      const eventExists = await checkIfEventExists(userID, isoStartDate);

      let eventID = 0;
      if (eventExists.length && eventExists.eventID) {
        eventID = eventExists.eventID;
        await updateEvent(
          userID,
          isoStartDate,
          isoStartTime,
          isoEndDate,
          isoEndTime,
          event.eventHours,
          safeSubCalendarName,
          eventID
        );
      } else {
        eventID = await insertEvent(
          userID,
          isoStartDate,
          isoStartTime,
          isoEndDate,
          isoEndTime,
          event.eventHours,
          safeSubCalendarName
        );
      }
      eventIDs.push({
        eventID: eventID,
        isoStartDate: isoStartDate,
      }); // Store eventID for later use in tasks
    }
    return eventIDs;
  } catch (error: any) {
    console.log("Error in function: handleUserEvents() ", error);
    throw new Error(error.message);
  }
};

const checkIfEventExists = async (userID: number, safeStartDate: string) => {
  try {
    const eventCheckQuery = `
      SELECT * FROM userEvents 
      WHERE userID = ${userID} AND startDate = ${safeStartDate}
    `;

    const eventResponse = await globalService.sendQuery(eventCheckQuery);
    const rows = eventResponse as { ID: number }[];

    const responseLength = eventResponse.length;
    const eventID = responseLength > 0 ? rows[0].ID : null;

    return {
      length: responseLength,
      eventID: eventID,
    };
  } catch (error: any) {
    console.error("Error in function: checkIfEventExists() ", error.message);
    throw new Error(error.message);
  }
};

const updateEvent = async (
  userID: number,
  isoStartDate: string,
  isoStartTime: string,
  isoEndDate: string,
  isoEndTime: string,
  eventHours: string,
  safeSubCalendarName: string,
  eventID: number
) => {
  try {
    const updateEventQuery = `
      UPDATE userEvents
      SET 
        startDate = ${isoStartDate},
        startTime = ${isoStartTime},
        endDate = ${isoEndDate},
        endTime = ${isoEndTime},
        eventHours = ${sqlString.escape(eventHours)},
        subCalendarName = ${safeSubCalendarName}
      WHERE ID = ${eventID} AND userID = ${userID}
    `;

    await globalService.sendQuery(updateEventQuery);
  } catch (error: any) {
    console.log("Error in updateEvent()", error);
    throw new Error(error.message);
  }
};

const insertEvent = async (
  userID: number,
  isoStartDate: string,
  isoStartTime: string,
  isoEndDate: string,
  isoEndTime: string,
  eventHours: string,
  safeSubCalendarName: string
): Promise<number> => {
  try {
    const insertEventQuery = `
    INSERT INTO userEvents (userID, startDate, startTime, endDate, endTime, eventHours, subCalendarName) 
    VALUES (
      ${userID}, 
      ${isoStartDate}, 
      ${isoStartTime}, 
      ${isoEndDate}, 
      ${isoEndTime}, 
      ${sqlString.escape(eventHours)}, 
      ${safeSubCalendarName}
    )
  `;
    const result: any = await globalService.sendQuery(insertEventQuery);
    return result.insertId;
  } catch (error: any) {
    console.log("Error in insertEvent()");
    throw new Error(error.message);
  }
};

const handleUserTasks = async (
  userID: number,
  eventIDs: any[],
  userTasks: any[]
) => {
  try {
    for (const task of userTasks) {
      let relatedEventID = null;
      for (const event of eventIDs) {
        const eventIsoStartDate = event.isoStartDate.replace(/#/g, "");

        if (eventIsoStartDate === task.formattedDate.split("T")[0]) {
          relatedEventID = event.eventID;
          break;
        }
      }

      if (relatedEventID) {
        // Task found and related to event
        const taskExists = await checkIfTaskExists(userID, task.clickupTaskID);

        if (taskExists) {
          const updateTaskQuery = `
            UPDATE userTasks
            SET 
              taskHours = ${task.taskHours}, 
              taskMinutes = ${task.taskMinutes}, 
              formattedDate = ${sqlString.escape(task.formattedDate)},
              taskTitle = ${sqlString.escape(task.taskTitle)},
              eventID = ${relatedEventID}
            WHERE userID = ${userID} AND clickupTaskID = ${sqlString.escape(
            task.clickupTaskID
          )}
          `;
          await globalService.sendQuery(updateTaskQuery);
        } else {
          const insertTaskQuery = `
            INSERT INTO userTasks (userID, taskHours, taskMinutes, formattedDate, taskTitle, clickupTaskID, eventID)
            VALUES (
              ${userID}, 
              ${task.taskHours}, 
              ${task.taskMinutes}, 
              ${sqlString.escape(task.formattedDate)}, 
              ${sqlString.escape(task.taskTitle)}, 
              ${sqlString.escape(task.clickupTaskID)}, 
              ${relatedEventID}
            )
          `;
          await globalService.sendQuery(insertTaskQuery);
        }
      }
    }
  } catch (error: any) {
    console.log("Error in function: handleUserTasks() ", error);
    throw new Error(error.message);
  }
};
const insertNewUser = async (safeEmail: string, safeUserName: string) => {
  try {
    const insertUserQuery = `INSERT INTO UserTable (email, userName) VALUES (${safeEmail}, ${safeUserName})`;
    await globalService.sendQuery(insertUserQuery);
    const returnQuery = `SELECT ID FROM UserTable WHERE email = ${safeEmail}`;
    const returnIDResponse: any = await globalService.sendQuery(returnQuery);
    if (returnIDResponse && returnIDResponse.length > 0) {
      const userId = returnIDResponse[0].ID;
      return userId;
    }
  } catch (error: any) {
    console.error("Error inserting new user:", error);
    throw new Error("Failed to insert new user");
  }
};

const checkIfTaskExists = async (userID: number, clickupTaskID: string) => {
  try {
    const taskCheckQuery = `
      SELECT * FROM userTasks
      WHERE userID = ${userID} AND clickupTaskID = ${sqlString.escape(
      clickupTaskID
    )}
    `;

    const taskResponse = await globalService.sendQuery(taskCheckQuery);
    return taskResponse.length > 0;
  } catch (error: any) {
    console.error("Error in function: checkIfTaskExists() ", error.message);
    throw new Error(error.message);
  }
};

const getOrCreateUserID = async (email: string, userName: string) => {
  const userID = await getUserID(email);
  return userID ?? (await insertNewUser(email, userName));
};

const updateFromScheduler = async () => {
  const calendarID = process.env.TEAMUP_CALENDARID as string;

  // Fetch TeamUp users
  const teamupUsers = await fetchTeamupUsers(calendarID).then((res) => {
    return res.users.map((user: any) => ({
      email: user.members[0]?.email || null,
      name: user.name || null,
    }));
  });

  // Fetch TeamUp subcalendars
  const teamupSubcalendars = await fetchTeamupSubCalendars().then((res) => {
    return res.subcalendars.map((calendar: any) => ({
      id: calendar.id,
      name: calendar.name,
      active: calendar.active,
      color: calendar.color,
    }));
  });

  // Get the current week's start and end dates
  const { startOfWeek, endOfWeek } = getCurrentWeek();

  // Fetch ClickUp tasks and format them with tracked time info
  const teamupUserEvents = await Promise.all(
    teamupUsers.map(async (user: any) => {
      // Fetch user events from TeamUp
      const userEvents = await fetchTeamupUserEvents(
        user.email,
        startOfWeek,
        endOfWeek
      ).then((res: any) => {
        return res.events.map((event: any) => {
          return {
            id: event.id,
            subcalenderId: event.subcalendar_id,
            all_day: event.all_day,
            rrule: event.rrule,
            title: event.title,
            timezone: event.tz,
            startDate: event.start_dt,
            endDate: event.end_dt,
            custom: event.custom,
          };
        });
      });

      // Fetch ClickUp tasks for the user
      const clickupTasks = await fetchClickupTasksFromList();
      const tasks = clickupTasks.tasks || [];

      // Filter tasks assigned to the user
      const userTasksFilter = tasks.filter((task: any) =>
        task.assignees?.some((assignee: any) => assignee.email === user.email)
      );

      // Extract tracked time for each task
      const userTasks = (
        await Promise.all(
          userTasksFilter.map(async (task: any) => {
            const timeEntries = await getTaskTimeEntries(task.id);
            return timeEntries.map((entry: any) => ({
              ...extractTrackedTimeInfo(entry),
              taskTitle: task.name,
              clickupTaskID: task.id,
              email: user.email,
            }));
          })
        )
      ).flat();

      // Process user events, calculate hours, and match with subcalendar
      const events = userEvents.map((event: any) => {
        const start = new Date(event.startDate);
        const end = new Date(event.endDate);
        const hours = (end.getTime() - start.getTime()) / 3600000; // Calculate hours

        // Match the subCalendarId to the corresponding subCalendar and get the name
        const matchedCalendar = teamupSubcalendars.find(
          (calendar: any) => calendar.id === event.subcalenderId
        );
        const subCalendarName = matchedCalendar
          ? matchedCalendar.name
          : "Unknown";

        return {
          email: user.email,
          startDate: start,
          endDate: start,
          eventHours: hours.toFixed(2), // rounding to 2 decimal places
          subCalendarName, // Include the calendar name
        };
      });

      return {
        userTasks, // Add the user's tasks to the return value
        events, // Add the events to the return value
      };
    })
  );

  // Format the final structure as required
  const formattedUserData = teamupUsers.map((user: any, index: number) => {
    const { events, userTasks } = teamupUserEvents[index]; // Corresponding events and tasks for the user
    return {
      userEmail: user.email,
      userName: user.name,
      userEvents: events, // Attach the formatted events
      userTasks, // Attach the formatted user tasks
    };
  });
  return formattedUserData;
};

export const exportCSV = async (req: any, res: any) => {
  try {
    let jsonData = req.body;
    await updateMSAccessDatabase(jsonData);

    res
      .status(200)
      .json({ Status: 200, Message: "Data successfully processed" });
  } catch (error: any) {
    console.error("Error processing data:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// Job that repeats every 5 minutes
const recurringJob = scheduler.scheduleJob("59 23 * * * *", async () => {
  console.log("starting scheduler");

  if (process.env.TEAMUP_AUTH === null || process.env.TEAMUP_AUTH === "") {
    await fetchTeamupAuth().then((res) => {
      process.env.TEAMUP_AUTH = res.auth_token;
    });
  }

  const data = await updateFromScheduler();
  await updateMSAccessDatabase(data);
  console.log("scheduler complete");
});
