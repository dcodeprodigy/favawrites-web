const cron = require("cron");
const https = require("https");

const backendUrl = "https://favawrites.onrender.com"; 

const job = new cron.CronJob("*/14 * * * *", function () {
    console.log("Restarting Server...");
    https.get(backendUrl, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) { // Checks for success status codes (2xx range)
            console.log("Server pinged successfully.");
        } else {
            console.error(`Failed to ping server with status code ${res.statusCode}`);
        }
    })
        .on("error", (err) => {
            console.error(`Error during ping: ${err.message}`);
        })
    }, null, true, 'Africa/lagos'); 


module.exports = { job };