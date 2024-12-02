import * as odbc from "odbc";
import * as sqlString from "sqlstring";

const DSN = "msAccess"; // Replace with the DSN name you set up earlier

// Function to update or insert data into MS Access
const updateMSAccessDatabase = async (data: any) => {
  try {
    const connection = await odbc.connect(`DSN=${DSN}`);

    // Loop through the data array and process each entry
    for (const record of data) {
      const safeEmail = sqlString.escape(record.userEmail);
      const query = `SELECT * FROM UserTable WHERE email = ${safeEmail}`;

      const result = await connection.query(query);

      console.log(result.length);
      if (result.length > 0) {
        console.log("user exists");
        record.userTasks.forEach(async (task: any) => {
          const safeFormattedDate = sqlString.escape(task.formattedDate);
          const safeTaskTitle = sqlString.escape(task.taskTitle);

          const insertTask = `INSERT INTO UserTaskTable (email, taskDate, taskTitle) VALUES (${safeEmail}, ${safeFormattedDate}, ${safeTaskTitle})`;
          try {
            await connection.query(insertTask);
          } catch (err) {
            console.error("Error inserting task:", err);
          }
        });
      } else {
        console.log("user doesnt exist");
        const insertQuery = `INSERT INTO UserTable (email) VALUES (${safeEmail})`;
        try {
          await connection.query(insertQuery);
        } catch (err) {
          console.error("Error inserting task:", err);
        }
      }
    }

    await connection.close();
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
