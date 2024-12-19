import * as globalService from "../services/global.service";
import * as sqlString from "sqlstring";
import { formatDateForAccess } from "../utils/helper-utils";

// Function to update or insert data into MS Access
const updateMSAccessDatabase = async (data: any) => {
  try {
    for (const record of data) {
      const safeEmail = sqlString.escape(record.userEmail);
      const safeUserName = sqlString.escape(record.userName);
      let userID = -1;
      userID = await getUserID(safeEmail);

      if (userID && userID !== -1) {
        console.log("user exists");

        // Handle user events
        await handleUserEvents(userID, record.userEvents);

        // Handle user tasks
        await handleUserTasks(userID, record.userTasks);
      } else {
        console.log("user no exist");
        // Insert new user
        const newUserID = await insertNewUser(safeEmail, safeUserName);

        // Insert new events and tasks for the new user
        await handleUserEvents(newUserID, record.userEvents);
        await handleUserTasks(newUserID, record.userTasks);
      }
    }

    console.log("Database operations completed successfully.");
  } catch (error: any) {
    console.error("Error updating the database:", error.message);
    throw error;
  }
};

async function getUserID(safeEmail: string) {
  const query = `SELECT ID FROM UserTable WHERE email = ${safeEmail}`;
  const access: any = await globalService.getAllAccess(query);

  if (!access || access.length === 0) {
    return null;
  }
  return access.response[0].ID; // Return userID if exists
}

async function handleUserEvents(userID: number, userEvents: any[]) {
  for (const event of userEvents) {
    const isoStartDate = formatDateForAccess(event.startDate);
    const isoStartTime = event.startTime; // Ensure proper formatting if needed
    const isoEndDate = formatDateForAccess(event.endDate);
    const isoEndTime = event.endTime; // Ensure proper formatting if needed
    const safeSubCalendarName = sqlString.escape(event.subCalendarName);

    console.log("here 1");

    const eventExists = await checkIfEventExists(
      userID,
      isoStartDate,
      isoStartTime
    );

    console.log("here 2");

    if (eventExists) {
      console.log(
        `Updating event for user: ${userID}, ${isoStartDate} ${isoStartTime} - ${isoEndDate} ${isoEndTime}`
      );
      await updateEvent(
        userID,
        isoStartDate,
        isoStartTime,
        isoEndDate,
        isoEndTime,
        event.eventHours,
        event.subCalendarName
      );
    } else {
      console.log(`Inserting event for user: ${userID}`);
      await insertEvent(
        userID,
        isoStartDate,
        isoStartTime,
        isoEndDate,
        isoEndTime,
        event.eventHours,
        event.subCalendarName
      );
    }
  }
}

async function checkIfEventExists(
  userID: number,
  safeStartDate: string,
  safeStartTime: string
) {
  const eventCheckQuery = `
    SELECT * FROM userEvents 
    WHERE userID = ${userID} AND startDate = ${safeStartDate} AND startTime = ${safeStartTime}
  `;
  const eventResponse = await globalService.getAllAccess(eventCheckQuery);
  return eventResponse.length > 0;
}

export const updateEvent = async (
  userID: number,
  isoStartDate: string,
  isoStartTime: string,
  isoEndDate: string,
  isoEndTime: string,
  eventHours: string,
  safeSubCalendarName: string
) => {
  const updateEventQuery = `
    UPDATE userEvents 
    SET 
      endDate = ${sqlString.escape(isoEndDate)}, 
      endTime = ${sqlString.escape(isoEndTime)}, 
      eventHours = ${sqlString.escape(eventHours)}, 
      subCalendarName = ${safeSubCalendarName}
    WHERE userID = ${userID} AND startDate = ${sqlString.escape(
    isoStartDate
  )} AND startTime = ${sqlString.escape(isoStartTime)}
  `;
  await globalService.sendQuery(updateEventQuery);
};

export const insertEvent = async (
  userID: number,
  isoStartDate: string,
  isoStartTime: string,
  isoEndDate: string,
  isoEndTime: string,
  eventHours: string,
  safeSubCalendarName: string
) => {
  const insertEventQuery = `
    INSERT INTO userEvents (userID, startDate, startTime, endDate, endTime, eventHours, subCalendarName) 
    VALUES (
      ${userID}, 
      ${sqlString.escape(isoStartDate)}, 
      ${sqlString.escape(isoStartTime)}, 
      ${sqlString.escape(isoEndDate)}, 
      ${sqlString.escape(isoEndTime)}, 
      ${sqlString.escape(eventHours)}, 
      ${safeSubCalendarName}
    )
  `;
  await globalService.sendQuery(insertEventQuery);
};

async function handleUserTasks(userID: number, userTasks: any[]) {
  for (const task of userTasks) {
    const insertTaskQuery = `
      INSERT INTO userTasks (userID, taskDate, taskTitle, taskHours, taskMinutes, clickupTaskID) 
      VALUES (${userID}, ${sqlString.escape(
      task.formattedDate
    )}, ${sqlString.escape(task.taskTitle)}, ${sqlString.escape(
      task.taskHours
    )}, ${sqlString.escape(task.taskMinutes)}, ${task.clickupTaskID})
    `;
    await globalService.sendQuery(insertTaskQuery);
  }
}

async function insertNewUser(safeEmail: string, safeUserName: string) {
  const insertUserQuery = `INSERT INTO UserTable (email, userName) VALUES (${safeEmail}, ${safeUserName})`;

  console.log("b ", safeEmail, safeUserName, insertUserQuery);

  const userResponse: any = await globalService.sendQuery(insertUserQuery);

  console.log("a");

  if (userResponse.insertId) {
    return userResponse.insertId; // Return the new userID
  }

  throw new Error("Failed to insert new user");
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

