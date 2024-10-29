import fetch from "node-fetch";

export const getTeamupEvents = async (req: any, res: any) => {
  const calendarId = req.params.calendarId;
  const url = `${process.env.teamupUrl}${calendarId}/events`;
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
    res.status(200).json(data);
  } catch (error: any) {
    console.error("Error fetching users:", error.message);
    res.status(500).json({ error: error.message });
  }
};


export const getTeamupSubcalenders = async (req: any, res: any) => {
  const calendarId = req.params.calendarId;
  const url = `${process.env.teamupUrl}${calendarId}/subcalendars?includeInactive=false`;
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
    console.error("Error fetching sub calendars:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const getTeamupAuth = async (req: any, res: any) => {
  const url = `${process.env.teamupUrl}auth/tokens`;
  const teamup_api = process.env.teamup as string;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Teamup-Token": teamup_api,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: req.body.email,
        password: req.body.password,
      }),
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
