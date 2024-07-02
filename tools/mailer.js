require('dotenv').config();
const nodemailer = require('nodemailer');

// Create and export the transporter
const transporter = nodemailer.createTransport({
    host: 'smtp-relay.gmail.com',
    secure: false,
    port: '587',
    tls: {
        ciphers: "SSLv3",
        rejectUnauthorized: false,
    },
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    }
});

module.exports = transporter;