const cron = require("cron");
const https = require("https");

const backendUrl = "https://favawrites.onrender.com"
const job = new cron.CronJob("*/14 * * * *", function () {
    console.log("Restarting Server");
    https.get(backendUrl, (res) => {
        if (res.statusCode === 200) {
            console.log("Server Restarted");
        } else {
            console.error(`Failed to restart server with status code ${res.statusCode}`);
        }
    })
        .on("error", (err) => {
            console.error(`Error during restart: ${err.message}`)
        })
})

module.exports = {
    job,
}