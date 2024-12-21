import * as globalService from "../services/global.service";
import * as sqlString from "sqlstring";
import { formatDateForAccess } from "../utils/helper-utils";
import { query, response } from "express";

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

async function getUserID(safeEmail: string) {
  try {
    const query = `SELECT ID FROM UserTable WHERE email = ${safeEmail}`;
    const access: any = await globalService.getAllAccess(query);

    if (!access || access.length === 0) {
      return null;
    }
    return access.response[0].ID; // Return userID if exists
  } catch (error: any) {
    console.log("error in function: getUserID()");
    throw new Error(error.message);
  }
}

async function handleUserEvents(userID: number, userEvents: any[]) {
  const eventIDs: any[] = []; // Array to hold generated event IDs
  try {
    for (const event of userEvents) {
      const { isoDate: isoStartDate, isoTime: isoStartTime } =
        formatDateForAccess(event.startDate);
      const { isoDate: isoEndDate, isoTime: isoEndTime } = formatDateForAccess(
        event.endDate
      );
      const safeSubCalendarName = sqlString.escape(event.subCalendarName);

      const eventExists = await checkIfEventExists(
        userID,
        isoStartDate,
        isoStartTime
      );

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
}

async function checkIfEventExists(
  userID: number,
  safeStartDate: string,
) {
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
}

export const updateEvent = async (
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

export const insertEvent = async (
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

async function handleUserTasks(
  userID: number,
  eventIDs: any[],
  userTasks: any[]
) {
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
}

async function insertNewUser(safeEmail: string, safeUserName: string) {
  try {
    const insertUserQuery = `INSERT INTO UserTable (email, userName) VALUES (${safeEmail}, ${safeUserName})`;
    const userResponse: any = await globalService.sendQuery(insertUserQuery);

    if (userResponse.insertId) {
      return userResponse.insertId;
    }
  } catch (error: any) {
    throw new Error("Failed to insert new user");
  }
}

export const exportCSV = async (req: any, res: any) => {
  try {
    const jsonData = req.body;
    await updateMSAccessDatabase(jsonData);

    res
      .status(200)
      .json({ Status: 200, Message: "Data successfully processed" });
  } catch (error: any) {
    console.error("Error processing data:", error.message);
    res.status(500).json({ error: error.message });
  }
};

async function checkIfTaskExists(
  userID: number,
  clickupTaskID: string
): Promise<boolean> {
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
}

const getOrCreateUserID = async (
  email: string,
  userName: string
): Promise<number> => {
  const userID = await getUserID(email);
  return userID ?? (await insertNewUser(email, userName));
};
