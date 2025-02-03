const cron = require("cron");
const https = require("https");
require('dotenv').config();

const backendUrl = process.env.APP_URL;
const job = new cron.CronJob("*/14 * * * *", function () {
    https.get(backendUrl, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) { // Checks for success status codes (2xx range)
        } else {
            console.error(`Failed to ping server (${backendUrl}) – Status Code ${res.statusCode}`);
        }
    })
        .on("error", (err) => {
            console.error(`Error during ping: ${err.message}`);
        })
    }, null, true, 'Africa/lagos'); 
    
module.exports = { job };