// routes.js
const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const nunjucks = require('nunjucks');
const path = require('path');
const logger = require('./tools/logger');


const router = express.Router();

router.get('/ping', (req, res, next) => {
    res.status(200).json({ message: 'pong' });
});

router.post('/create', async (req, res, next) => {
    const { repoName, users, fileLock } = req.body;
    const getFullYear = new Date().getFullYear();
    const localPath = `/var/svn/${getFullYear}_${repoName}`;
    const passwdFilePath = `${localPath}/conf/passwd`;
    const confFilePath = `${localPath}/conf`;
    const sourceFilePath = path.join(__dirname, 'views', 'svnserve.conf');
    const destinationFilePath = path.join(confFilePath, 'svnserve.conf');
    const passwdFileSource = path.join(__dirname, 'views', 'passwd.njk');

    try {
        await new Promise((resolve, reject) => {
            exec(`svnadmin create ${localPath}`, (error, stdout, stderr) => {
                if (error || stderr) {
                    reject(error);
                    logger.error(`Error executing svnadmin create command: ${error}`);
                    next(error);
                } else {
                    resolve();
                }
            });
        });

        const passwdContent = nunjucks.render(passwdFileSource, { users });
        fs.writeFileSync(passwdFilePath, passwdContent);

        fs.copyFileSync(sourceFilePath, destinationFilePath);

        logger.info(`Repository ${repoName} created successfully`);
        res.status(201).json({ message: 'Repository created successfully' });
    } catch (error) {
        logger.error(`Error creating repository: ${error}`);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
