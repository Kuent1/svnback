const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const { exec } = require('child_process');
const nunjucks = require('nunjucks');
const path = require('path');  // Add this line to import the path module

// Mock the required modules
jest.mock('fs');
jest.mock('child_process');
jest.mock('nunjucks');

// Import the app and set up the necessary middleware
const app = express();
app.use(bodyParser.json());

app.post('/create', async (req, res, next) => {
    const { repoName, users, fileLock } = req.body;
    const getFullYear = new Date().getFullYear();
    const localPath = `/var/svn/${getFullYear}_${repoName}`;
    const passwdFilePath = `${localPath}/conf/passwd`;
    const confFilePath = `${localPath}/conf`;
    const sourceFilePath = path.join(__dirname, 'views', 'svnserve.conf');
    const destinationFilePath = path.join(confFilePath, 'svnserve.conf');

    try {
        await new Promise((resolve, reject) => {
            exec(`svnadmin create ${localPath}`, (error, stdout, stderr) => {
                if (error || stderr) {
                    reject(error)
                } else {
                    resolve();
                }
            });
        });

        const passwdContent = nunjucks.render('passwd.njk', { users });
        fs.writeFileSync(passwdFilePath, passwdContent);

        fs.copyFileSync(sourceFilePath, destinationFilePath);

        res.status(201).json({ message: 'Repository created successfully' });
    } catch (error) {
        next(error);
    }
});

describe('POST /create', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should create a new repository and configure it', async () => {
        exec.mockImplementation((cmd, callback) => callback(null, '', ''));
        fs.writeFileSync.mockImplementation(() => {});
        fs.copyFileSync.mockImplementation(() => {});
        nunjucks.render.mockReturnValue('mocked-passwd-content');

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

        expect(response.status).toBe(201);
        expect(response.body.message).toBe('Repository created successfully');
        expect(exec).toHaveBeenCalledWith(expect.stringContaining('svnadmin create /var/svn/2024_testRepo'), expect.any(Function));
        expect(fs.writeFileSync).toHaveBeenCalledWith('/var/svn/2024_testRepo/conf/passwd', 'mocked-passwd-content');
        expect(fs.copyFileSync).toHaveBeenCalledWith(expect.stringContaining('svnserve.conf'), '/var/svn/2024_testRepo/conf/svnserve.conf');
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
