import * as globalService from "../services/global.service";
import * as sqlString from "sqlstring";

// Function to update or insert data into MS Access
const updateMSAccessDatabase = async (data: any) => {
  try {
    // Loop through the data array and process each entry
    for (const record of data) {
      const safeEmail = sqlString.escape(record.userEmail);
      const query = `SELECT * FROM UserTable WHERE email = ${safeEmail}`;
      const response = await globalService.getAllAccess(query);

      if (!response) {
        throw new Error("No response from ms access");
      }

      if (response.length > 0) {
        console.log("user exists");
        record.userTasks.forEach(async (task: any) => {
          const safeFormattedDate = sqlString.escape(task.formattedDate);
          const safeTaskTitle = sqlString.escape(task.taskTitle);
          const query = `INSERT INTO UserTaskTable (email, taskDate, taskTitle) VALUES (${safeEmail}, ${safeFormattedDate}, ${safeTaskTitle})`;

          await globalService.createTaskRecord(query);
        });
      } else {
        console.log("user doesnt exist");
        const query = `INSERT INTO UserTable (email) VALUES (${safeEmail})`;
        await globalService.createUserRecord(query);
      }
    }

    console.log("Database operations completed successfully.");
  } catch (error: any) {
    console.error("Error updating the database:", error.message);
    throw error;
  }
};

export const exportCSV = async (req: any, res: any) => {
  try {
    const jsonData = req.body;
    // Process the data
    await updateMSAccessDatabase(jsonData);

    res
      .status(200)
      .json({ Status: 200, Message: "Data successfully processed" });
  } catch (error: any) {
    console.error("Error processing data:", error.message);
    res.status(500).json({ error: error.message });
  }
};
