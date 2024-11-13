// TODO fix jest så den kan håndtere flere filer på samme tid, bare gør brug af clickup.test.ts indtil videre

// import request from 'supertest';
// import app from '../server'; // Adjust the import to point to your app's entry file

// describe('GET /userEvents', () => {

//     let server: any;

//     beforeAll(() => {
//         server = app.listen(0, () => {
//             const address = server.address();
//             console.log(`Server running on port ${address.port}`);
//         });
//     });

//     afterAll(() => {
//         // Close the server after tests
//         server.close();
//     });


//     it('should return an array on provided email', async () => {
//         const response = await request(app).get('/api/teamup/userEvents/mathiasbc97@gmail.com');
//         console.log(response);

//         expect(Array.isArray(response.body)).toBe(true);
//     });
// });
