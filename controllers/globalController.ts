import * as odbc from 'odbc';
import { extractTrackedTimeInfo, getCurrentWeek } from '../utils/helper-utils';

const DSN = 'msAccess'; // Replace with the DSN name you set up earlier

// Function to update or insert data into MS Access
const updateMSAccessDatabase = async (data: any[]) => {
  try {
      const connection = await odbc.connect(`DSN=${DSN}`);

      // Loop through the data array and process each entry
      for (const record of data) {
          // Extract the tracked time info using the helper function
          const trackedTime = extractTrackedTimeInfo(record);
          if (!trackedTime) {
              console.warn('No valid tracked time found for record:', record);
              continue;
          }

          // Destructure the useful information from the parsed result
          const { taskTitle, formattedDate, dateLogged, loggedBy, duration } = trackedTime;

          console.log(`Processing Task: ${taskTitle} for User: ${loggedBy}`);

          // Example of inserting or updating a record based on `dateLogged` and `taskTitle`
          const selectQuery = `SELECT * FROM Table1 WHERE dateLogged = ? AND taskTitle = ?`;
          const result = await connection.query(selectQuery, [dateLogged, taskTitle]);

          if (result.length > 0) {
              // Record exists, update it
              const updateQuery = `
                  UPDATE Table1
                  SET formattedDate = ?, loggedBy = ?, durationHours = ?, durationMinutes = ?
                  WHERE dateLogged = ? AND taskTitle = ?
              `;
              await connection.query(updateQuery, [formattedDate, loggedBy, duration.hours, duration.minutes, dateLogged, taskTitle]);
              //console.log(`Updated task: ${taskTitle}`);
          } else {
              // Record does not exist, insert it
              const insertQuery = `
                  INSERT INTO Table1 (taskTitle, formattedDate, dateLogged, loggedBy, durationHours, durationMinutes)
                  VALUES (?, ?, ?, ?, ?, ?)
              `;
              await connection.query(insertQuery, [taskTitle, formattedDate, dateLogged, loggedBy, duration.hours, duration.minutes]);
              //console.log(`Inserted task: ${taskTitle}`);
          }
          const selectQuery2 = `SELECT * FROM Table1 WHERE dateLogged = ? AND taskTitle = ?`;
          const result2 = await connection.query(selectQuery2, [dateLogged, taskTitle]);
          console.log('test: ', result2);
          
      }

      await connection.close();
      console.log('Database operations completed successfully.');
  } catch (error: any) {
      console.error('Error updating the database:', error.message);
      throw error;
  }
};


export const exportCSV = async (req: any, res: any) => {
    try {
        const jsonData = req.body;
        console.log('Received data:', jsonData);

        // Process the data
        await updateMSAccessDatabase(jsonData);

        res.status(200).json({ Status: 200, Message: 'Data successfully processed' });
    } catch (error: any) {
        console.error('Error processing data:', error.message);
        res.status(500).json({ error: error.message });
    }
};
