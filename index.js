const express = require("express");
const app = express();
const port = 3000;
const fetch = require("node-fetch");

// Use environment variables for API keys
const CLICKUP_API_TOKEN = process.env.clickup;
const TEAMUP_API_KEY = process.env.teamup;

// Function to make a request to get tasks from a space
async function getClickUpTasks(spaceId) {
  const url = `https://api.clickup.com/api/v2/space/${spaceId}/task`;

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
    return data; // Return the data to be used in the route
  } catch (error) {
    throw new Error("Error fetching ClickUp tasks: " + error.message);
  }
}

// Function to make a request to get events from a calendar
async function getTeamupEvents(calendarId) {
  const url = `https://api.teamup.com/${calendarId}/events`;
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Teamup-Token": TEAMUP_API_KEY, // Make sure this contains the right API key
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data; // Return the data to be used in the route
  } catch (error) {
    throw new Error("Error fetching Teamup events: " + error.message);
  }
}

// Function to get auth token from Teamup
async function getAuthTokenTeamup() {
  const url = "https://api.teamup.com/auth/tokens";

  const body = JSON.stringify({
    email: "mathiasbc97@gmail.com",
    password: TEMP_PASSWORD,
  });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Teamup-Token": TEAMUP_API_KEY, // Use your API key
      },
      body: body,
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data; // Return token data
  } catch (error) {
    throw new Error("Error fetching Teamup auth token: " + error.message);
  }
}

// Route to fetch ClickUp tasks for a specific space
app.get("/clickup/:spaceId", async (req, res) => {
  const spaceId = req.params.spaceId;

  try {
    const tasks = await getClickUpTasks(spaceId);
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to fetch Teamup events for a specific calendar
app.get("/teamup/:calendarId", async (req, res) => {
  const calendarId = req.params.calendarId;

  try {
    const events = await getTeamupEvents(calendarId);
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST route for authentication
app.post("/teamup/auth", async (req, res) => {
  try {
    const authData = await getAuthTokenTeamup();
    res.status(200).json(authData); // Send token data back to the client
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Root route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
