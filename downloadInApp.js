const express = require('express');
const fs = require('fs');
const path = require('path');
const tempDir = process.env.TEMP_DIR

const app = express();

// Route to download the file
app.get('/download/:filename', (req, res) => {
    const safeFilename = path.basename(req.params.filename); // Ensure safe filenames
    const filePath = path.join(`${tempDir}`, safeFilename);

    if (fs.existsSync(filePath)) {
        res.download(filePath, safeFilename, (err) => {
            if (err) {
                console.error('Error sending file:', err);
                res.status(500).send('Internal Server Error');
            } else {
                console.log(`Sent File ${filePath} to user Successfully!`);
            }
        });
    } else {
        res.status(404).send('File not found. Please check your URL and try again.');
    }
});

// Export the app for use in other files
module.exports = app
