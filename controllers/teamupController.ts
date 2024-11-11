import fetch from "node-fetch";
import {getCurrentWeek} from '../utils/helper-utils'

export const getTeamupUserEvents = async( req: any, res: any) => {
  const email = req.params.email;
  // Henter startDate og endDate fra forespørgelsesparametre
  const { startDate, endDate } = req.query;

  // Hvis ingen startDate og endDate, default til getCurrentWeek
  const { startOfWeek, endOfWeek } = startDate && endDate
    ? { startOfWeek: startDate, endOfWeek: endDate }
    : getCurrentWeek();

  // Henter events fra specifik kalender, identificeret ved TEAMUP_CALENDARID, baseret på mail, startDate og endDate
  const url = `${process.env.teamupUrl}${process.env.TEAMUP_CALENDARID}/events?query=${email}&startDate=${startOfWeek}&endDate=${endOfWeek}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Teamup-Token": process.env.teamup as string,
        Authorization: `Bearer ${process.env.TEAMUP_AUTH as string}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    // Henter data fra API'et og mapper events til et nyt format med relevante oplysninger
    const data = await response.json();
    const userEvents = data.events.map((event:any) => {
      return {
        id: event.id,
        subcalenderId: event.subcalendar_id,
        all_day: event.all_day,
        rrule: event.rrule,
        title: event.title,
        timezone: event.tz,
        startDate: event.start_dt,
        endDate: event.end_dt,
        custom: event.custom
      }
    })
    
    res.status(200).json(userEvents);
  } catch (error: any) {
    console.error("Error fetching events:", error.message);
    res.status(500).json({ error: error.message });
  }
}

// Henter alle events
export const getTeamupEvents = async (req: any, res: any) => {
  const url = `${process.env.teamupUrl}${process.env.TEAMUP_CALENDARID}/events`;
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Teamup-Token": process.env.teamup as string,
        Authorization: `Bearer ${process.env.TEAMUP_AUTH as string}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error: any) {
    console.error("Error fetching events:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// Henter alle brugere på TeamUp
export const getTeamupUsers = async (req: any, res: any) => {
  const calendarId = req.params.calendarId;
  const url = `${process.env.teamupUrl}${calendarId}/users`;
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Teamup-Token": process.env.teamup as string,
        Authorization: `Bearer ${process.env.TEAMUP_AUTH as string}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    // Henter den alle brugere og mapper dem til nyt format med array for email og navn
    const data = await response.json();
    const users = data.users.map((user:any)=>{
      return {
        email: user.members[0].email,
        name: user.name
      }
    })

    res.status(200).json(users);
  } catch (error: any) {
    console.error("Error fetching users:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// Henter underkalendere for en specifik kalender fra TeamUp API'et.
export const getTeamupSubcalenders = async (req: any, res: any) => {
  const url = `${process.env.teamupUrl}${process.env.TEAMUP_CALENDARID}/subcalendars`;
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Teamup-Token": process.env.teamup as string,
        Authorization: `Bearer ${process.env.TEAMUP_AUTH as string}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const subCalendars = data.subcalendars.map((calendar:any)=>{
      return {
        id: calendar.id,
        name: calendar.name,
        active: calendar.active,
        color: calendar.color
      }
    })
    res.status(200).json(subCalendars);
  } catch (error: any) {
    console.error("Error fetching sub calendars:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// Funktion som sender en POST-anmodning til TeamUp API'et for at få en autentificeringstoken
// Anmodningen inkluderer loginoplysninger i JSON-format i body'en, samt en TeamUp API-token i headeren
export const getTeamupAuth = async (req: any, res: any) => {
  const url = `${process.env.teamupUrl}auth/tokens`;
  const teamup_api = process.env.teamup as string;

  const bodyObj = JSON.stringify({
    email: process.env.teamup_email as string,
    password: process.env.teamup_pass as string,
  })

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Teamup-Token": teamup_api,
        "Content-Type": "application/json",
      },
      body: bodyObj,
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    process.env.TEAMUP_AUTH = data.auth_token; 
    res.status(200).json({
      message: "Token stored successfully",
      auth_token: data.auth_token,
    });
  } catch (error: any) {
    console.error("Error fetching Teamup auth token:", error.message);
    res.status(500).json({ error: error.message });
  }
};
