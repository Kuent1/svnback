require('dotenv').config();
const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const nunjucks = require('nunjucks');
const logger = require('./tools/logger');
const cors = require('cors');
const path = require('path');
const transporter = require('./tools/mailer');


const app = express();
const PORT = 3000;

// Middleware to parse JSON requests and allow CORS
app.use(express.json());
app.use(cors());

// Configure Nunjucks as template engine
nunjucks.configure('views', {
    autoescape: true,
    express: app
});

// Test route
app.get('/ping', (req, res) => {
    const ip = req.ip;
    res.send('pong');
    console.log('ping from ', ip);
}); 

// Route to create and configure a new SVN repository
app.post('/create', async (req, res, next) => {
    const { repoName, users, fileLock } = req.body;
    const getFullYear = new Date().getFullYear();
    const localPath = `/var/svn/${getFullYear}_${repoName}`;
    // const templatePath = 'svn://dsnas.polymorph.local/SVNDevTemplate'
    // const tempExportPath = `/volume1/scripts/svncreatorapi/tmp/${getFullYear}_${repoName}`;
    // const tempTemplatePath = `/volume1/scripts/svncreatorapi/tmp/SVNDevTemplate`;
    // const checkoutLink = `svn://svn.polymorph.fr/${getFullYear}_${repoName}`;


    const passwdFilePath = `${localPath}/conf/passwd`;
    const confFilePath = `${localPath}/conf`;
    const sourceFilePath = path.join(__dirname, 'views', 'svnserve.conf');
    const destinationFilePath = path.join(confFilePath, 'svnserve.conf');

    try {
        // Create the SVN repository
        await new Promise((resolve, reject) => {
            exec(`svnadmin create ${localPath}`, (error, stdout, stderr) => {
                if (error || stderr) {
                    reject(error)
                } else {
                    resolve();
                }
            });
        });

        // Write passwd file
        const passwdContent = nunjucks.render('passwd.njk', { users });
        fs.writeFileSync(passwdFilePath, passwdContent);

        // Write conf file
        fs.copyFileSync(sourceFilePath, destinationFilePath);

        // // Checkout new repository
        // await new Promise((resolve, reject) => {
        //     exec(`svn checkout ${checkoutLink} ${tempExportPath} --username ${users[0].username} --password ${users[0].password}`, (error, stdout, stderr) => {
        //         if (error || stderr) {
        //             reject(error || new Error(stderr));
        //         } else {
        //             resolve();
        //         }
        //     });
        // });

        // // Export the template structure from another repository
        // await new Promise((resolve, reject) => {
        //     exec(`svn export ${templatePath} ${tempTemplatePath} --username user --password control35`, (error, stdout, stderr) => {
        //         if (error || stderr) {
        //             reject(error || new Error(stderr));
        //         } else {
        //             resolve();
        //         }
        //     });
        // });
        // logger.debug(`Template structure exported successfully`);

        // // Copy the template structure to the new repository
        // await new Promise((resolve, reject) => {
        //     exec(`cp -r ${tempTemplatePath}/* ${tempExportPath}`, (error, stdout, stderr) => {
        //         if (error || stderr) {
        //             reject(error || new Error(stderr));
        //         } else {
        //             resolve();
        //         }
        //     });
        // });

        // // Add files to version control
        // await new Promise((resolve, reject) => {
        //     exec(`cd ${tempExportPath} && svn add ${tempExportPath}/*`, (error, stdout, stderr) => {
        //         if (error || stderr) {
        //             reject(error || new Error(stderr));
        //         } else {
        //             resolve();
        //         }
        //     });
        // });
        // logger.debug(`${tempExportPath} added successfully`);

        // Add file lock on Graph folder if user requested it
        // if (fileLock) {
        //     await new Promise((resolve, reject) => {
        //         exec(`svn propset svn:auto-props 'svn:needs-lock=*' ${tempExportPath}/Graph`, (error, stdout, stderr) => {
        //             if (error || stderr) {
        //                 reject(error || new Error(stderr));
        //             } else {
        //                 resolve();
        //             }
        //         });
        //     });
        // };

        // // Commit changes
        // await new Promise((resolve, reject) => {
        //     exec(`svn commit ${tempExportPath} -m "Import structure" --username ${users[0].username} --password ${users[0].password}`, (error, stdout, stderr) => {
        //         if (error || stderr) {
        //             reject(error || new Error(stderr));
        //         } else {
        //             resolve();
        //         }
        //     });
        // });
        // logger.debug(`${tempExportPath} committed successfully`);

        // Send confirmation email to each user
        for (const user of users) {
            const mailOptions = {
                from: `"🤖 SVN Creator" ${process.env.MAIL_USER}`,
                to: `${user.username}@gmail.com`,
                subject: `Dépôt SVN ${repoName} créé`,
                html: `<p>Hello ${user.username} 👋,</p><br><p>Le dépôt SVN '${repoName}' a été créé avec succès ! <br> <p>Voici la liste des utilisateurs :</p><ul>${users.map(user => `<li>${user.username}</li>`).join('')}</ul><br><br> Prends note de l'adresse suivante, afin de pouvoir la retrouver facilement:<br> <i>svn://svn.kuentin.me/${getFullYear}_${repoName}</i> <br> N'hésite pas, également, à rentrer tes identifiants dans <a href="https://pass.polymorph.fr:9443">Passbolt</a> !</p><br><br> <p>Prends en bien soin,<br>🤖 SVN Creator</p>`,
            };
            try {
                await transporter.sendMail(mailOptions);
                console.log(`Email sent to ${user.username}`);
            } catch (error) {
                logger.error(`Error sending email: ${error.message}`);
                return next(error);
            }
        }

        // Remove temp folder
        // await new Promise((resolve, reject) => {
        //     exec(`rm -rf ${tempExportPath} && rm -rf ${tempTemplatePath}`, (error, stdout, stderr) => {
        //         if (error || stderr) {
        //             reject(error || new Error(stderr));
        //         } else {
        //             resolve();
        //         }
        //     });
        // });
        // logger.debug(`${tempExportPath} deleted successfully`);

        // Final response if everything succeeds
        logger.warn(`${localPath} created successfully`);
        res.status(201).json({ message: `${localPath} created successfully` });
    } catch (error) {
        logger.error(`Error creating SVN repository: ${error.message}`);
        next(error); // Pass error to the error handling middleware
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).send(err.stack);
});

app.listen(PORT, () => {
    console.log(`SVN Creator API is running on port ${PORT}`);
});