import fetch from "node-fetch";

export const fetchTeamupUserEvents = async (
  email: string,
  startDate: string,
  endDate: string
) => {
  try {
    // Henter events fra specifik kalender, identificeret ved TEAMUP_CALENDARID, baseret på mail, startDate og endDate
    const url = `${process.env.teamupUrl}${process.env.TEAMUP_CALENDARID}/events?query=${email}&startDate=${startDate}&endDate=${endDate}`;

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
    return response.json();
  } catch (error: any) {
    return {
      statusText:
        "Something went wrong when fetching from fetchTeamupUserEvents",
      error: error.message,
      ok: false,
      status: 500,
    };
  }
};

export const fetchTeamupUsers = async (calendarId: string) => {
  try {
    const url = `${process.env.teamupUrl}${calendarId}/users`;
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

    return response.json();
  } catch (error: any) {
    console.log("err");

    return {
      statusText: "Something went wrong when fetching from fetchTeamupUsers",
      error: error.message,
      ok: false,
      status: 500,
    };
  }
};

export const fetchTeamupSubCalendars = async () => {
  try {
    const url = `${process.env.teamupUrl}${process.env.TEAMUP_CALENDARID}/subcalendars`;

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

    return response.json();
  } catch (error: any) {
    return {
      statusText:
        "Something went wrong when fetching from fetchTeamupSubCalendars",
      error: error.message,
      ok: false,
      status: 500,
    };
  }
};

export const fetchTeamupAuth = async () => {
  try {
    const url = `${process.env.teamupUrl}auth/tokens`;
    const teamup_api = process.env.teamup as string;

    const bodyObj = JSON.stringify({
      email: process.env.teamup_email as string,
      password: process.env.teamup_pass as string,
    });

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

    return response.json();
  } catch (error: any) {
    return {
      statusText:
        "Something went wrong when fetching from fetchTeamupSubCalendars",
      error: error.message,
      ok: false,
      status: 500,
    };
  }
};
