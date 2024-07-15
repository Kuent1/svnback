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
app.use(routes);

module.exports = app;