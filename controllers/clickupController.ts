import fetch from "node-fetch";
import { extractTrackedTimeInfo} from "../utils/helper-utils"
const CLICKUP_API_TOKEN = process.env.clickup as string;

// Henter liste af opgaver for en bruger ud fra emails
export const getClickUpTasksFromList = async (req: any, res: any) => {
  const userEmail = req.params.email;
  const url = `${process.env.clickupUrl}v2/list/${process.env.CLICKUP_LISTID}/task`;

  // GET-anomdning for at hente opgaver fra ClickUp 
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

    // Henter json data over opgaver eller en tom liste
    const data = await response.json();
    const tasks = data.tasks || [];

    // Kører alle asynkrone operationer samtidigt og venter til de er færdige inden der fortsættes. Henter opgaver og tiden for opgaver for den spicifikke email
    const userTrackedTime = (
      await Promise.all(
        tasks
          .filter((task: any) =>
            task.assignees && task.assignees.some((assignee: any) => assignee.email === userEmail)
          )
          .map(async (task: any) => {
            const timeEntries = await getTaskTimeEntries(task.id);
            return timeEntries.map((entry: any) => ({
              
              // Kopierer alle egenskaber fra et objekt og spreder dem ind i et nyt objekt
              ...extractTrackedTimeInfo(entry), 
              taskTitle: task.name
            }));
          })
      )
    ).flat(); // Flader alle tidsregistreringer ud i én liste
    res.status(200).json(userTrackedTime);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Henter liste af brugere
export const getClickupListUsers = async(req: any, res: any) => {
  const url = `${process.env.clickupUrl}v2/list/${process.env.CLICKUP_LISTID}/member`;
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
    const users = data.members.map((user: any) => {
      return {
        email: user.email,
        name: user.username
      };
    });    
    res.status(200).json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// Henter en enkelt opgave ud fra taskID
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

// Henter opgaver med tid
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

    const trackedTimeInfo = extractTrackedTimeInfo(data);

    // Retunere info om tiden sammen med selve opgaven
    res.status(200).json({ 
      task: data, 
      trackedTimeInfo 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Henter tiden for en specifik opgave
const getTaskTimeEntries = async (taskId: string) => {
  const url = `${process.env.clickupUrl}v2/task/${taskId}/time`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: CLICKUP_API_TOKEN,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching time entries for task ${taskId}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error(error);
    return [];
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
