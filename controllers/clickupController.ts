import * as clickupService from "../services/clickup.service";
import { extractTrackedTimeInfo } from "../utils/helper-utils";

// Henter liste af opgaver for en bruger ud fra emails
export const getClickUpTasksFromList = async (req: any, res: any) => {
  try {
    const userEmail = req.params.email;
    // Henter json data over opgaver eller en tom liste
    const data = await clickupService.fetchClickupTasksFromList();
    const tasks = data.tasks || [];

    console.log(tasks);

    // Kører alle asynkrone operationer samtidigt og venter til de er færdige inden der fortsættes. Henter opgaver og tiden for opgaver for den spicifikke email
    const userTrackedTime = (
      await Promise.all(
        tasks
          .filter(
            (task: any) =>
              task.assignees &&
              task.assignees.some(
                (assignee: any) => assignee.email === userEmail
              )
          )
          .map(async (task: any) => {
            const timeEntries = await getTaskTimeEntries(task.id);
            return timeEntries.map((entry: any) => ({
              // Kopierer alle egenskaber fra et objekt og spreder dem ind i et nyt objekt
              ...extractTrackedTimeInfo(entry),
              taskTitle: task.name,
              clickupTaskID: task.id,
              email: userEmail,
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
export const getClickupListUsers = async (req: any, res: any) => {
  try {
    const data = await clickupService.fetchClickupListUsers();
    const users = data.members.map((user: any) => {
      return {
        email: user.email,
        name: user.username,
      };
    });
    res.status(200).json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Henter en enkelt opgave ud fra taskID
export const getClickupSingleTask = async (req: any, res: any) => {
  try {
    const data = await clickupService.fetchClickupSingleTask(req.params.taskID);
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Henter opgaver med tid
export const getClickupTaskWithTrackedTime = async (req: any, res: any) => {
  try {
    const data = await clickupService.fetchClickupTaskWithTrackedTime(
      req.params.taskID
    );

    const trackedTimeInfo = extractTrackedTimeInfo(data);

    // Retunere info om tiden sammen med selve opgaven
    res.status(200).json({
      task: data,
      trackedTimeInfo,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Henter tiden for en specifik opgave
const getTaskTimeEntries = async (taskID: string) => {
  try {
    const data = await clickupService.fetchTaskTimeEntries(taskID);
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
