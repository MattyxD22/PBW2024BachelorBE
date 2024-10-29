import fetch from "node-fetch";

const CLICKUP_API_TOKEN = process.env.clickup as string;

export const getClickUpTasksFromList = async (req: any, res: any) => {
  const listID = req.params.listID;
  const url = `${process.env.clickupUrl}v2/list/${listID}/task`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: CLICKUP_API_TOKEN,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getClickupListUsers = async(req: any, res: any) => {
  const listID = req.params.listID;
  const url = `${process.env.clickupUrl}v2/list/${listID}/member`;
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: CLICKUP_API_TOKEN,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export const getClickupSingleTask = async(req: any, res: any) => {
  const taskID = req.params.taskID;
  const url = `${process.env.clickupUrl}v2/task/${taskID}`;
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: CLICKUP_API_TOKEN,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export const getClickupTaskWithTrackedTime = async (req: any, res: any) => {
  const taskID = req.params.taskID;
  const url = `${process.env.clickupUrl}v2/task/${taskID}`;
  
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: CLICKUP_API_TOKEN,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Extract tracked time information
    const trackedTimeInfo = extractTrackedTimeInfo(data);

    // Return the tracked time info along with the original task data
    res.status(200).json({ 
      task: data, 
      trackedTimeInfo 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// parsing functions

// Function to extract tracked time information from task data
const extractTrackedTimeInfo = (task: any) => {
  if (task.time_spent && task.time_spent > 0) {
    // Convert time_spent from milliseconds to hours and minutes
    const totalMinutes = Math.floor(task.time_spent / 60000); // Convert ms to minutes
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    const dateAdded = new Date(parseInt(task.date_created));

    // Format the date to a readable format
    const options: Intl.DateTimeFormatOptions = {
      year:   'numeric',  
      month:  'long',    
      day:    'numeric',   
      hour:   '2-digit',  
      minute: '2-digit',
      hour12: false,    
    };
    
    const formattedDate = dateAdded.toLocaleString('dk-DA', options);

    // Create a result object with extracted information
    const result = {
      taskId: task.id,
      taskName: task.name,
      dateAdded: formattedDate,
      duration: {
        hours: hours,
        minutes: minutes,
      },
      loggedBy: task.creator.email, // Assuming the creator logged the time
    };

    return result;
  } else {
    return null; // No tracked time available
  }
};


// TODO implement if oauth is needed
// not needed for instances with personal token from clickup
// export const getClickupAuthToken = async (req: any, res: any) => {
//   const url = `${process.env.clickupUrl}v2/user`;

//   try {
//     const resp = await fetch(url, {
//       method: "GET",
//       headers: {
//         Authorization: process.env.clickup as string,
//       },
//     });

//     const data = await resp.text();

//     process.env.CLICKUP_AUTH = data.

//     console.log(data);
//   } catch (error: any) {
//     res.json({ error: 500, message: error.message });
//   }
// };
