import request from "supertest";
import app from "../server";

describe("ClickUp og Teamup tests", () => {
  let server: any;
  let authToken: string;

  beforeAll(async () => {
    // Start serveren på en ledig port (port 0)
    server = app.listen(0, () => {
      const address = server.address();
      console.log(`Server running on port ${address.port}`);
    });

    // Authenticate and store token
    const authResponse = await request(app)
      .post("/api/teamup/auth")
      .set("Content-Type", "application/json")
      .set("Teamup-Token", process.env.teamup as string);

    expect(authResponse.status).toBe(200); // Ensure token is stored successfully
    authToken = authResponse.body.auth_token; // Save the auth token
  });

  afterAll(() => {
    server.close();
  });

  // ------------------------------------ ClickUp Tests ------------------------------------

  it("should return a list of members with status 200", async () => {
    process.env.clickup = "falseTest";
    const response = await request(app).get("/api/clickup/members");
    console.log("!!!: ", response.body);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);

    if (response.body.length > 0) {
      expect(response.body[0]).toHaveProperty("email");
      expect(response.body[0]).toHaveProperty("name");
    }
  });

  it("should return an empty array if no members are found", async () => {
    const response = await request(app).get("/api/clickup/members");
    expect(Array.isArray(response.body)).toBe(true);
  });

  it("should return task for a user using email and status 200", async () => {
    const response = await request(app).get(
      "/api/clickup/tasks/kasper.schmidt1@hotmail.com"
    );
    console.log(response.body);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);

    if (response.body.length > 0) {
      expect(response.body[0].loggedBy).toBe("kasper.schmidt1@hotmail.com");
      expect(response.body[0]).toHaveProperty("taskTitle");
    }
  });

  it("should return task for a user using email and status 200", async () => {
    const response = await request(app).get(
      "/api/clickup/tasks/kasper.schmidt1@hotmail.com"
    );
    console.log(response.body);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);

    if (response.body.length > 0) {
      expect(response.body[0].loggedBy).not.toBe("mathiasbc97@gmail.com");
      expect(response.body[0]).toHaveProperty("taskTitle");
    }
  });

  it("Returns 400 if email does not exist in the members list", async () => {
    const response = await request(app).get("/api/clickup/members");
    console.log(response.body);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);

    const members = response.body;
    const memberExists = members.some(
      (member: any) => member.email === "test@gmail.com"
    );

    expect(memberExists).toBe(false);
  });

  // ------------------------------------ TeamUp Tests ------------------------------------

  it("should return an array of events when authenticated", async () => {
    // Use the token to make a request for user events
    const response = await request(app)
      .get("/api/teamup/userEvents/mathiasbc97@gmail.com")
      .set("Authorization", `Bearer ${authToken}`); // Include the token in the request header

    console.log(response.body); // Log the response for debugging
    expect(Array.isArray(response.body)).toBe(true); // Check that the response is an array

    expect(response.status).toBe(200);
  });

  it("should get users", async () => {
    const response = await request(app)
      .get(`/api/teamup/searchUser/eqv4en`)
      .set({
        "Teamup-Token": process.env.teamup,
        Authorization: `Bearer ${authToken}`,
      });
    console.log(response.body);

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
    console.log("Amount of users:", response.body.length);
  });

  it("should get events", async () => {
    const response = await request(app)
      .get(`/api/teamup/events`)
      .set({
        "Teamup-Token": process.env.teamup,
        Authorization: `Bearer ${authToken}`,
      });
    console.log(response.body);

    expect(response.status).toBe(200);
  });

  it("Get subcalenders", async () => {
    const response = await request(app)
      .get(`/api/teamup/subcalendars`)
      .set({
        "Teamup-Token": process.env.teamup,
        Authorization: `Bearer ${authToken}`,
      });
    console.log(response.body);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);

    if (response.body.length > 0) {
      expect(response.body[0]).toHaveProperty("id");
      expect(response.body[0]).toHaveProperty("name");
    }
  });

  it("get events for user by email", async () => {
    const response = await request(app)
      .get(`/api/teamup/userEvents/kasper.schmidt1@hotmail.com`)
      .set({
        "Teamup-Token": process.env.teamup,
        Authorization: `Bearer ${authToken}`,
      });
    console.log(response.body);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);

    if (response.body.length > 0) {
      expect(response.body[0]).toHaveProperty("title");
      expect(response.body[0]).toHaveProperty("startDate");
      expect(response.body[0]).toHaveProperty("endDate");
    }
  });
});
