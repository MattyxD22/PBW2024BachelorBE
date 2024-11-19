import request from 'supertest';
import app from '../server';

describe('GET /members', () => {

    let server: any;

    beforeAll(() => {
        server = app.listen(0, () => {
            const address = server.address();
            console.log(`Server running on port ${address.port}`);
        });
    });

    afterAll(() => {
        server.close();
    });

    it('should return a list of members with status 200', async () => {
        const response = await request(app).get('/api/clickup/members'); 
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

    it('should return task for a user using email and status 200', async () => {
        const response = await request(app).get('/api/clickup/tasks/kasper.schmidt1@hotmail.com'); 
        console.log(response.body);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);

        if (response.body.length > 0) {
            expect(response.body[0].loggedBy).toBe('kasper.schmidt1@hotmail.com');
            expect(response.body[0]).toHaveProperty('taskTitle');
        }
    });
});

