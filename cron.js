const cron = require("cron");
require('dotenv').config();
const backendUrl = process.env.APP_URL;
let protocol = backendUrl.split(":")[0];
protocol = require(`${protocol}`);

const job = new cron.CronJob("*/14 * * * *", function () {
        protocol.get(backendUrl, (res) => {
            if (res.statusCode >= 300 ) {
                console.error(`Failed to ping server (${backendUrl}) - Status Code ${res.statusCode}`);
            } else {
                console.log("Ping Success");
            }
        })
    }, null, true, 'Africa/lagos'); 
    
module.exports = { job };