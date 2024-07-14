const app = require("./app");
const logger = require("./tools/logger");

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    logger.info(`Node server is running on port ${port}`);
});