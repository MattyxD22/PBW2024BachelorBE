import * as globalService from "../services/global.service";
import * as sqlString from "sqlstring";

// Function to update or insert data into MS Access
const updateMSAccessDatabase = async (data: any) => {
  try {
    for (const record of data) {
      const safeEmail = sqlString.escape(record.userEmail);
      const safeUserName = sqlString.escape(record.userName);
      let userID = -1;
      userID = await getUserID(safeEmail);
      console.log("returned userID: ", userID);

      if (userID !== -1) {
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
    const safeStartDate = sqlString.escape(event.startDate);
    const safeEndDate = sqlString.escape(event.endDate);
    const safeSubCalendarName = sqlString.escape(event.subCalendarName);

    const eventExists = await checkIfEventExists(userID, safeStartDate);

    if (eventExists) {
      console.log(
        `Updating event for user: ${userID}  ${safeStartDate}, ${safeEndDate}, ${event.eventHours}`
      );
      await updateEvent(
        userID,
        safeStartDate,
        safeEndDate,
        event.eventHours,
        safeSubCalendarName
      );
    } else {
      console.log(`Inserting event for user: ${userID}`);
      await insertEvent(
        userID,
        safeStartDate,
        safeEndDate,
        event.eventHours,
        safeSubCalendarName
      );
    }
  }
}

async function checkIfEventExists(userID: number, safeStartDate: string) {
  const eventCheckQuery = `SELECT * FROM userEvents WHERE userID = ${userID} AND startDate = ${safeStartDate}`;
  const eventResponse = await globalService.getAllAccess(eventCheckQuery);
  return eventResponse.length > 0;
}

async function updateEvent(
  userID: number,
  safeStartDate: string,
  safeEndDate: string,
  eventHours: string,
  safeSubCalendarName: string
) {
  try {
    const updateEventQuery = `
  UPDATE userEvents 
  SET endDate = ${safeEndDate}, eventHours = ${sqlString.escape(
      eventHours
    )} , safeSubCalendarName = ${safeSubCalendarName}
  WHERE userID = ${userID} AND startDate = ${safeStartDate}

  `;
    await globalService.sendQuery(updateEventQuery);
  } catch (error: any) {
    throw new Error(error);
  }
}

async function insertEvent(
  userID: number,
  safeStartDate: string,
  safeEndDate: string,
  eventHours: string,
  safeSubCalendarName: string
) {
  const insertEventQuery = `
    INSERT INTO userEvents (userID, startDate, endDate, eventHours, subCalendarName) 
    VALUES (${userID}, ${safeStartDate}, ${safeEndDate}, ${sqlString.escape(
    eventHours
  )}, ${safeSubCalendarName})
  `;
  await globalService.sendQuery(insertEventQuery);
}

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
  const userResponse: any = await globalService.sendQuery(insertUserQuery);

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

// import * as globalService from "../services/global.service";
// import * as sqlString from "sqlstring";

// // Function to update or insert data into MS Access
// const updateMSAccessDatabase = async (data: any) => {
//   try {
//     for (const record of data) {
//       console.log(record);

//       const safeEmail = sqlString.escape(record.userEmail);
//       const query = `SELECT * FROM UserTable WHERE email = ${safeEmail}`;
//       const response = await globalService.getAllAccess(query);

//       if (!response) {
//         throw new Error("No response from ms access");
//       }

//       if (response.length > 0) {
//         console.log("User exists");

//         for (const task of record.userTasks) {
//           const safeFormattedDate = sqlString.escape(task.formattedDate);
//           const safeTaskTitle = sqlString.escape(task.taskTitle);

//           // Check if the task already exists
//           const taskCheckQuery = `
//             SELECT * FROM userTasks
//             WHERE email = ${safeEmail} AND taskDate = ${safeFormattedDate} AND taskTitle = ${safeTaskTitle}
//           `;
//           const taskResponse = await globalService.getAllAccess(taskCheckQuery);

//           if (taskResponse.length > 0) {
//             // Update the task if necessary
//             console.log(
//               `Task already exists for ${safeEmail} on ${task.formattedDate}`
//             );
//             if (task.needsUpdate) {
//               const updateQuery = `
//                 UPDATE userTasks
//                 SET timeSpent = ${sqlString.escape(task.timeSpent)}
//                 WHERE email = ${safeEmail} AND taskDate = ${safeFormattedDate} AND taskTitle = ${safeTaskTitle}
//               `;
//               await globalService.updateRecord(updateQuery);
//             }
//           } else {
//             // Insert the task if it doesn't exist
//             const insertQuery = `
//               INSERT INTO userTasks (email, taskDate, taskTitle, timeSpent)
//               VALUES (${safeEmail}, ${safeFormattedDate}, ${safeTaskTitle}, ${sqlString.escape(
//               task.timeSpent
//             )})
//             `;
//             await globalService.createTaskRecord(insertQuery);
//           }
//         }
//       } else {
//         console.log("User doesn't exist");
//         const insertUserQuery = `INSERT INTO UserTable (email) VALUES (${safeEmail})`;
//         await globalService.createUserRecord(insertUserQuery);
//       }
//     }

//     console.log("Database operations completed successfully.");
//   } catch (error: any) {
//     console.error("Error updating the database:", error.message);
//     throw error;
//   }
// };

// export const exportCSV = async (req: any, res: any) => {
//   try {
//     const jsonData = req.body;
//     // Process the data
//     await updateMSAccessDatabase(jsonData);

//     res
//       .status(200)
//       .json({ Status: 200, Message: "Data successfully processed" });
//   } catch (error: any) {
//     console.error("Error processing data:", error.message);
//     res.status(500).json({ error: error.message });
//   }
// };
