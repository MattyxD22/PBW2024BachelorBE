import fetch from "node-fetch";
import {getCurrentWeek} from '../utils/helper-utils'

export const getTeamupUserEvents = async( req: any, res: any) => {
  const email = req.params.email;
  // Extract startDate and endDate from query parameters
  const { startDate, endDate } = req.query;

  // If startDate or endDate is not provided, use getCurrentWeek
  const { startOfWeek, endOfWeek } = startDate && endDate
    ? { startOfWeek: startDate, endOfWeek: endDate }
    : getCurrentWeek();
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

    process.env.TEAMUP_AUTH = data.auth_token; // Update the environment variable in memory
    res.status(200).json({
      message: "Token stored successfully",
      auth_token: data.auth_token, // Return the token, necessarry for postman. should be removed
    });
  } catch (error: any) {
    console.error("Error fetching Teamup auth token:", error.message);
    res.status(500).json({ error: error.message });
  }
};
