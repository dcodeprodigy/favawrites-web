() => {
    if (response.candidates && response.candidates.length > 0) {
        if (response.candidates.length > 1) {
            console.warn(`This response had ${response.candidates.length} ` +
                `candidates. Returning text from the first candidate only. ` +
                `Access response.candidates directly to use the other candidates.`);
        }
        if (hadBadFinishReason(response.candidates[0])) {
            throw new GoogleGenerativeAIResponseError(`${formatBlockErrorMessage(response)}`, response);
        }
        return getText(response);
    }
    else if (response.promptFeedback) {
        throw new GoogleGenerativeAIResponseError(`Text not available. ${formatBlockErrorMessage(response)}`, response);
    }
    return "";
  }