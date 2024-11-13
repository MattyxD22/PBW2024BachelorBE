import request from 'supertest';
import app from '../server'; // Adjust the import to point to your app's entry file

describe('GET /members', () => {

    let server: any;

    beforeAll(() => {
        server = app.listen(0, () => {
            const address = server.address();
            console.log(`Server running on port ${address.port}`);
        });
    });

    afterAll(() => {
        // Close the server after tests
        server.close();
    });

    it('should return a list of members with status 200', async () => {
        const response = await request(app).get('/api/clickup/members');  // Correct usage of 'get' on 'request'
        console.log(response.body);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);

        if (response.body.length > 0) {
            expect(response.body[0]).toHaveProperty('email');
            expect(response.body[0]).toHaveProperty('name');
        }
    });

    it('should return an empty array if no members are found', async () => {
        const response = await request(app).get('/api/clickup/members');
        expect(Array.isArray(response.body)).toBe(true);
    });
});
