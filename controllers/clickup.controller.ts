import * as clickupService from "../services/clickup.service";
import {
  extractTrackedTimeInfo,
  getTaskTimeEntries,
} from "../utils/helper-utils";

// Henter liste af opgaver for en bruger ud fra emails
export const getClickUpTasksFromList = async (req: any, res: any) => {
  try {
    const userEmail = req.params.email;
    // Henter json data over opgaver eller en tom liste
    const data = await clickupService.fetchClickupTasksFromList();
    const tasks = data.tasks || [];

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
    if (!userTrackedTime.length) {
      throw new Error(`No Tasks found for email: ${userEmail}`);
    }

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
