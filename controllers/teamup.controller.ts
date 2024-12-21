import * as teamupService from "../services/teamup.service";
import { getCurrentWeek } from "../utils/helper-utils";
import session from "express-session";

export const getTeamupUserEvents = async (req: any, res: any) => {
  const email = req.params.email;
  // Henter startDate og endDate fra forespørgelsesparametre
  const { startDate, endDate } = req.query;

  // Hvis ingen startDate og endDate, default til getCurrentWeek
  const { startOfWeek, endOfWeek } =
    startDate && endDate
      ? { startOfWeek: startDate, endOfWeek: endDate }
      : getCurrentWeek();
  try {
    const response = await teamupService.fetchTeamupUserEvents(
      email,
      startOfWeek,
      endOfWeek
    );

    // Henter data fra API'et og mapper events til et nyt format med relevante oplysninger
    const data = await response;
    // hvis der er en fejl, check om data objektet har en "ok" property og i så fald, se om den er false
    if (data.error) {
      throw new Error(`Error: ${data.status} ${data.statusText}`);
    }

    const userEvents = data.events.map((event: any) => {
      return {
        id: event.id,
        subcalenderId: event.subcalendar_id,
        all_day: event.all_day,
        rrule: event.rrule,
        title: event.title,
        timezone: event.tz,
        startDate: event.start_dt,
        endDate: event.end_dt,
        custom: event.custom,
      };
    });

    res.status(200).json(userEvents);
  } catch (error: any) {
    console.error("Error fetching events:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// Henter alle brugere på TeamUp
export const getTeamupUsers = async (req: any, res: any) => {
  try {
    // Henter den alle brugere og mapper dem til nyt format med array for email og navn
    const data = await teamupService.fetchTeamupUsers(req.params.calendarId);

    if (data.error) {
      throw new Error(`Error: ${data.status} ${data.statusText}`);
    }

    const users = data.users.map((user: any) => {
      return {
        email: user.members[0].email,
        name: user.name,
      };
    });

    res.status(200).json(users);
  } catch (error: any) {
    console.error("Error fetching users:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// Henter underkalendere for en specifik kalender fra TeamUp API'et.
export const getTeamupSubcalenders = async (req: any, res: any) => {
  try {
    const data = await teamupService.fetchTeamupSubCalendars();

    if (data.error) {
      throw new Error(`Error: ${data.status} ${data.statusText}`);
    }

    const subCalendars = data.subcalendars.map((calendar: any) => {
      return {
        id: calendar.id,
        name: calendar.name,
        active: calendar.active,
        color: calendar.color,
      };
    });
    res.status(200).json(subCalendars);
  } catch (error: any) {
    console.error("Error fetching sub calendars:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// Funktion som sender en POST-anmodning til TeamUp API'et for at få en autentificeringstoken
// Anmodningen inkluderer loginoplysninger i JSON-format i body'en, samt en TeamUp API-token i headeren
export const getTeamupAuth = async (req: any, res: any) => {
  try {
    const response = await teamupService.fetchTeamupAuth();

    process.env.TEAMUP_AUTH = response.auth_token;

    res.status(200).json({
      message: "Token stored successfully",
      auth_token: response.auth_token,
    });
  } catch (error: any) {
    console.log("error in getTeamupAuth()");
    res.status(500).json({ error: error.message });
  }
};
