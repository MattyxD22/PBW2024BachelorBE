import request from 'supertest';
import app from '../server';

describe('TeamUp Authentication and User Events', () => {
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
      .post('/api/teamup/auth')
      .set('Content-Type', 'application/json')
      .set('Teamup-Token', process.env.teamup as string);

    expect(authResponse.status).toBe(200);  // Ensure token is stored successfully
    authToken = authResponse.body.auth_token;  // Save the auth token
  });

  afterAll(() => {
    return new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('should return an array of events when authenticated', async () => {
    // Use the token to make a request for user events
    const response = await request(app)
      .get('/api/teamup/userEvents/mathiasbc97@gmail.com')
      .set('Authorization', `Bearer ${authToken}`);  // Include the token in the request header

    console.log(response.body);  // Log the response for debugging
    expect(Array.isArray(response.body)).toBe(true);  // Check that the response is an array
  });

});
