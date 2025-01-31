// create.test.js
const request = require('supertest');
const fs = require('fs');
const { exec } = require('child_process');
const nunjucks = require('nunjucks');
const path = require('path');
const app = require('../app');

// Mock the required modules
jest.mock('fs');
jest.mock('child_process');
jest.mock('nunjucks');

describe('POST /create', () => {
let server;
    beforeAll((done) => {
        server = app.listen(4000, done); // Start the server
    });

    afterAll((done) => {
        server.close(done);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should create a new repository and configure it', async () => {
        exec.mockImplementation((cmd, callback) => callback(null, '', ''));
        fs.writeFileSync.mockImplementation(() => { });
        fs.copyFileSync.mockImplementation(() => { });
        nunjucks.render.mockReturnValue('mocked-passwd-content');

        const response = await request(app)
            .post('/api/create')
            .send({
                repoName: 'testRepo',
                users: [
                    { username: 'user1', password: 'password1' },
                    { username: 'user2', password: 'password2' }
                ],
                fileLock: true
            });

        expect(response.status).toBe(201);
        expect(response.body.message).toBe('Repository created successfully');
        expect(exec).toHaveBeenCalledWith(expect.stringContaining('svnadmin create /var/svn/2024_testRepo'), expect.any(Function));
        expect(fs.writeFileSync).toHaveBeenCalledWith('/var/svn/2024_testRepo/conf/passwd', 'mocked-passwd-content');
        expect(fs.copyFileSync).toHaveBeenCalledWith(path.join(__dirname, 'views', 'svnserve.conf'), path.join('/var/svn/2024_testRepo/conf', 'svnserve.conf'));
    }, 10000);  // Increase timeout to 10 seconds

    it('should handle errors gracefully', async () => {
        exec.mockImplementation((cmd, callback) => callback(new Error('exec error'), '', ''));

        const response = await request(app)
            .post('/create')
            .send({
                repoName: 'testRepo',
                users: [
                    { username: 'user1', password: 'password1' },
                    { username: 'user2', password: 'password2' }
                ],
                fileLock: true
            });

        expect(response.status).toBe(500);
    }, 10000);  // Increase timeout to 10 seconds
});
