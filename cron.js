const cron = require("cron");
require('dotenv').config();
const backendUrl = process.env.APP_URL;
let protocol = backendUrl.split(":")[0];

protocol = require(`${protocol}`);

const job = new cron.CronJob("*/14 * * * *", async () => {
        try {
            const response = await protocol.get(backendUrl);
            response.statusCode >= 300 ? console.error(`Failed to ping server (${backendUrl}) - Status Code ${res.statusCode}`) : null;
        } catch (error) {
            console.error(`Unable to get url ${backendUrl}: ${error}`);
        }
    }, null, true, 'Africa/lagos'); 
    
module.exports = { job };