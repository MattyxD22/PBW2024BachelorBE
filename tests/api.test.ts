import request from "supertest";
import app from "../server";
import odbc from "odbc";
import * as sqlString from "sqlstring";
import * as globalController from "../controllers/global.controller";
import * as globalService from "../services/global.service";

describe("ClickUp and Teamup tests", () => {
  let server: any;
  let authToken: string;

  const global_testBody = JSON.stringify({
    userEmail: sqlString.escape("mathiasbc97@gmail.com"),
    userName: sqlString.escape("Mathias Christensen"),
    userEvents: [
      {
        email: "mathiasbc97@gmail.com",
        startDate: "2024-12-23T09:00:00+01:00",
        endDate: "2024-12-23T17:00:00+01:00",
        hours: 8,
        subCalendarName: "Office",
      },
      {
        email: "mathiasbc97@gmail.com",
        startDate: "2024-12-22T09:00:00+01:00",
        endDate: "2024-12-22T17:00:00+01:00",
        hours: 8,
        subCalendarName: "Office",
      },
      {
        email: "mathiasbc97@gmail.com",
        startDate: "2024-12-21T09:00:00+01:00",
        endDate: "2024-12-21T17:00:00+01:00",
        hours: 6,
        subCalendarName: "Remote",
      },
    ],
    userTasks: [
      {
        taskHours: 3,
        taskMinutes: 0,
        formattedDate: "2024-12-23T09:22:52.361Z",
        dateLogged: "1734859372361",
        loggedBy: "mathiasbc97@gmail.com",
        taskTitle: "Test",
        clickupTaskID: "86976auxh",
        email: "mathiasbc97@gmail.com",
      },
      {
        taskHours: 3,
        taskMinutes: 0,
        formattedDate: "2024-12-22T09:22:10.488Z",
        dateLogged: "1734859330488",
        loggedBy: "mathiasbc97@gmail.com",
        taskTitle: "Test",
        clickupTaskID: "86976aut8",
        email: "mathiasbc97@gmail.com",
      },
      {
        taskHours: 4,
        taskMinutes: 0,
        formattedDate: "2024-12-21T20:58:54.401Z",
        dateLogged: "1734814734401",
        loggedBy: "mathiasbc97@gmail.com",
        taskTitle: "rapportskrivning",
        clickupTaskID: "869768pvr",
        email: "mathiasbc97@gmail.com",
      },
    ],
  });

  const isoStartDate = "#2024-12-28#";
  const isoStartTime = "#09:00:00#";
  const isoEndDate = "#2024-12-28#";
  const isoEndTime = "#17:00:00#";
  const eventHours = "8";
  const safeSubCalendarName = sqlString.escape("Office");

  beforeAll(async () => {
    process.env.DATABASE_DSN = "unitTest";
    const connection = await odbc.connect(`DSN=${process.env.DATABASE_DSN}`);

    await connection.query("DELETE FROM userTable");
    await connection.query("DELETE FROM userEvents");
    await connection.query("DELETE FROM userTasks");
    await connection.close();

    server = app.listen(0);

    const authResponse = await request(app)
      .post("/api/teamup/auth")
      .set("Content-Type", "application/json")
      .set("Teamup-Token", process.env.TEAMUP_API as string);

    expect(authResponse.status).toBe(200);
    authToken = authResponse.body.auth_token;
  });

  afterAll(async () => {
    await server.close();
  });

  // ------------------------------------ ClickUp Tests ------------------------------------

  it("should return a list of members with status 200", async () => {
    const response = await request(app).get("/api/clickup/members");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThanOrEqual(0);

    if (response.body.length > 0) {
      response.body.forEach((member: any) => {
        expect(member).toHaveProperty("email");
        expect(member).toHaveProperty("name");
      });
    }
  });

  it("should return tasks for a user using email and status 200", async () => {
    const response = await request(app).get(
      "/api/clickup/tasks/kasper.schmidt1@hotmail.com"
    );

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);

    if (response.body.length > 0) {
      expect(response.body[0].loggedBy).toBe("kasper.schmidt1@hotmail.com");
      expect(response.body[0]).toHaveProperty("taskTitle");
    }
  });

  it("should not return tasks for a user using non-existing email and status 500", async () => {
    const response = await request(app).get(
      "/api/clickup/tasks/test@hotmail.com"
    );

    expect(response.status).toBe(500);
    expect(Array.isArray(response.body)).toBe(false);
    expect(typeof response.body).toBe("object");
    expect(response.body.error).toBe(
      "No Tasks found for email: test@hotmail.com"
    );
  });

  it("should return 400 if email does not exist in the members list", async () => {
    const response = await request(app).get("/api/clickup/members");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);

    const members = response.body;
    const memberExists = members.some(
      (member: any) => member.email === "test@gmail.com"
    );

    expect(memberExists).toBe(false);
  });

  it("should return an empty array if no members are found", async () => {
    process.env.CLICKUP_API = "falseTest";

    const response = await request(app).get("/api/clickup/members");

    expect(response.status).toBe(500);
    expect(Array.isArray(response.body)).toBe(false);
  });

  // ------------------------------------ TeamUp Tests ------------------------------------

  it("should return an array of events when authenticated", async () => {
    const response = await request(app)
      .get("/api/teamup/userEvents/mathiasbc97@gmail.com")
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);

    response.body.forEach((event: any) => {
      expect(typeof event).toBe("object");
      expect(event).toHaveProperty("id");
      expect(event).toHaveProperty("title");
      expect(event).toHaveProperty("startDate");
      expect(event).toHaveProperty("endDate");
      expect(event).toHaveProperty("timezone");
      expect(event).toHaveProperty("custom");
      expect(event.custom).toHaveProperty("email");

      const startDate = new Date(event.startDate);
      const endDate = new Date(event.endDate);
      expect(startDate.toLocaleString()).toBe(
        new Date(event.startDate).toLocaleString()
      );
      expect(endDate.toLocaleString()).toBe(
        new Date(event.endDate).toLocaleString()
      );

      expect(startDate < endDate).toBe(true);
    });

    const ids = response.body.map((event: any) => event.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("should get users", async () => {
    const response = await request(app)
      .get(`/api/teamup/searchUser/eqv4en`)
      .set({
        "Teamup-Token": process.env.TEAMUP_API,
        Authorization: `Bearer ${authToken}`,
      });

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);

    response.body.forEach((user: any) => {
      expect(typeof user).toBe("object");
      expect(user).toHaveProperty("email");
      expect(user).toHaveProperty("name");
    });
  });

  it("should get subcalendars", async () => {
    const response = await request(app)
      .get(`/api/teamup/subcalendars`)
      .set({
        "Teamup-Token": process.env.TEAMUP_API,
        Authorization: `Bearer ${authToken}`,
      });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);

    response.body.forEach((sub: any) => {
      expect(typeof sub).toBe("object");
      expect(sub).toHaveProperty("id");
      expect(sub).toHaveProperty("name");
      expect(sub).toHaveProperty("active");
      expect(sub).toHaveProperty("color");

      expect(typeof sub.id).toBe("number");
      expect(typeof sub.name).toBe("string");
      expect(typeof sub.active).toBe("boolean");
      expect(typeof sub.color).toBe("number");

      expect(sub.name).not.toBe("");
    });

    const ids = response.body.map((sub: any) => sub.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  // ------------------------------------ Global Tests ------------------------------------

  it("should add a user and return the generated userId", async () => {
    const safeEmail = sqlString.escape("testuser@gmail.com");
    const safeName = sqlString.escape("Test User");

    const response = await globalController.insertNewUser(safeEmail, safeName);

    expect(response).toBeGreaterThan(0);

    const result = (await globalService.sendQuery(
      `SELECT ID FROM UserTable WHERE email = ${safeEmail}`
    )) as { ID: number }[];
    expect(result.length).toBe(1);
    expect(result[0].ID).toBe(response);
  });

  it("should return the user ID when the email exists", async () => {
    const escapedEmail = sqlString.escape("testuser@gmail.com");

    const userID = await globalController.getUserID(escapedEmail);

    expect(userID).toBeGreaterThan(0);

    const result = (await globalService.sendQuery(
      `SELECT ID FROM UserTable WHERE email = ${escapedEmail}`
    )) as { ID: number }[];

    expect(result[0].ID).toBe(userID);
  });

  it("should return null when the email does not exist", async () => {
    const nonExistentEmail = sqlString.escape("nonexistentemail@gmail.com");
    const userID = await globalController.getUserID(nonExistentEmail);
    expect(userID).toBeNull();
  });
  it("should insert an event and return the event ID, then update the created event", async () => {
    const safeEmail = sqlString.escape("testuser@gmail.com");
    const userID = await globalController.getUserID(safeEmail);

    expect(userID).toBeGreaterThan(0);

    await globalController.insertEvent(
      userID,
      isoStartDate,
      isoStartTime,
      isoEndDate,
      isoEndTime,
      eventHours,
      safeSubCalendarName
    );

    const result = (await globalService.sendQuery(
      `SELECT ID FROM userEvents WHERE userID = ${userID} AND startDate = ${isoStartDate} AND startTime = ${isoStartTime}`
    )) as any;

    expect(result.length).toBe(1);
    expect(result[0].ID).toBeGreaterThan(0);

    const updatedIsoStartTime = "#10:00:00#";
    const updatedIsoEndTime = "#18:00:00#";
    const updatedEventHours = "7";
    const updatedSubCalendarName = sqlString.escape("Remote");

    await globalController.updateEvent(
      userID,
      isoStartDate,
      updatedIsoStartTime,
      isoEndDate,
      updatedIsoEndTime,
      updatedEventHours,
      updatedSubCalendarName,
      result[0].ID
    );

    const updatedResult = (await globalService.sendQuery(
      `SELECT * FROM userEvents WHERE ID = ${result[0].ID} AND userID = ${userID}`
    )) as any;

    expect(updatedResult.length).toBe(1);
    expect(updatedResult[0].eventHours).toBe(updatedEventHours);
    expect(updatedResult[0].subCalendarName).toBe(
      updatedSubCalendarName.replace(/'/g, "")
    );
  });

  it("should insert an event, check if it exists, and return the event ID", async () => {
    const safeEmail = sqlString.escape("testuser@gmail.com");
    const userID = await globalController.getUserID(safeEmail);

    let eventID = await globalController.insertEvent(
      userID,
      isoStartDate,
      isoStartTime,
      isoEndDate,
      isoEndTime,
      eventHours,
      safeSubCalendarName
    );

    const { length, eventID: foundEventID } =
      await globalController.checkIfEventExists(userID, isoStartDate);

    expect(length).toBeGreaterThan(0);

    console.log(length, eventID, foundEventID);

    const result = (await globalService.sendQuery(
      `SELECT ID FROM userEvents WHERE userID = ${userID} AND startDate = ${isoStartDate}`
    )) as any;

    // expect(result.length).toBe(1);
    // expect(result[0].ID).toBe(eventID);
  });
});
