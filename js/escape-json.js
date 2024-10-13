function escapeJsonString(jsonString) {
    // Helper function to escape unescaped double quotes in a string
    function escapeUnescapedQuotes(str) {
        return str.replace(/(?<!\\)"/g, '\\"');
    }

    // Helper function to process JSON-like strings
    function processJsonString(str) {
        const regex = /("(?:[^"\\]|\\.)*?"|"(?:[^"\\]|\\.)*?")/g;
        return str.replace(regex, (match, p1) => {
            if (p1) {
                const content = p1.slice(1, -1); // Remove the enclosing double quotes
                const escapedContent = escapeUnescapedQuotes(content); // Escape inner quotes
                return `"${escapedContent}"`;
            }
            return match;
        });
    }

    // Process the input JSON string to escape unescaped quotes in string values
    const escapedJsonString = processJsonString(jsonString);

    // Parse the escaped JSON string to ensure it's valid JSON
    let jsonObj;
    try {
        jsonObj = JSON.parse(escapedJsonString);
    } catch (e) {
        throw new Error('Invalid JSON string after escaping');
    }

    // Convert the JSON object back to a string
    return JSON.stringify(jsonObj, null, 4);
}