// Keeping track of all the properties I have created in the server.js file.
// This will help me identify the properties that are not used throughout the code, as well as those that need to be saved somewhere else.
// The properties shown here shall exclude the original data properties already hardcoded in /server.js file. To see them, refer to the server file.

const data = {
    backOff: {
        backOffDuration,
        backOffCount: 0, 
        maxRetries
    },
    error: {
        pro: 0,
    },
    userInputData : req.body, // app.post param
    res : res, // app.post param
}