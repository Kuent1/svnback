// app.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const routes = require('./routes');
const logger = require('./tools/logger');

const app = express();

// Enable all CORS requests
app.use(cors());

// Set up middleware
app.use(bodyParser.json());
app.use(routes); // Use routes under /api prefix

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    logger.info(`Node server is running on port ${port}`);
});

module.exports = app;