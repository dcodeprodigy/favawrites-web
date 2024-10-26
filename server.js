"use strict"
const express = require('express');
const app = express();
const path = require('path');
// const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory, mainChatSession } = require('@google/generative-ai');
const { title } = require('process');
const { jsonrepair } = require('jsonrepair')
const { table } = require('console');
require('events').EventEmitter.defaultMaxListeners = 50;

// Middleware to parse JSON bodies
// app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE
  }
];

const generationConfig = {
  temperature: 1.5,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};

const data = {
  kdp_titles_subtitle_rules: `Book Title
    Titles are the most frequently used search attribute. The title field should contain only the actual title of your book as it appears on your book cover. Missing or erroneous title information may bury valid results among extraneous hits. Customers pay special attention to errors in titles and won't recognize the authenticity of your book if it has corrupted special characters, superfluous words, bad formatting, extra descriptive content, etc. Examples of items that are prohibited in the title field include but aren't limited to:

    Repeating generic keywords like "notebook," "journal," "gifts," "books," etc.
    Unauthorized reference to other titles or authors
    Unauthorized reference to a trademarked term
    Reference to sales rank (e.g., "bestselling")
    Reference to advertisements or promotions (e.g., "free")
    Only Punctuation (e.g. "!!!!!!!!")
    Using only "unknown," "n/a," "na," "blank," "none," "null," "not applicable"
    HTML tags
    If you're publishing multiple stories as one book, ensure the contents of your book are accurately reflected both in the title field and on the cover, by including terms such as "Collection," "Compilation," or "Series." Stories that are part of a series must be in sequential order within a book and collections of individual stories must have all stories listed in the metadata.

    For print books, your title must be listed on the cover (on the spine or front cover). It must also match the metadata you entered during title setup. Title information doesn't need to appear in your manuscript, but it must match the metadata if it does.

    Note: Ensure that there’s no language in your book title that implies your book is part of a bundled set or Boxed Set.


    Subtitle
    If your book has a subtitle, enter it here. A subtitle is a subordinate title that contains additional information about the content of your book. Your title and subtitle together must be fewer than 200 characters. The subtitle will appear on your book's detail page, and must adhere to the same guidelines as your title.
`,
  systemInstruction : function (userInputData) {
    return `You are an API, designed to sound like a human book writer. Please, read and sound human because you shall be writing full-fledged, production ready books. Avoid any pattern or mistakes that suggests you are an AI. Your tone must be ${userInputData.bookTone.trim()}. The genre of this book is ${userInputData.genre} and the audience is ${userInputData.audience.trim()}.
    THIS IS VERY IMPORTANT - The number of each subchapter under each chapter must not be 3. They must range from 4 and above. No two chapters must have the same number of subchapters.
    See added instructions for this book below, as provided by the user. Follow it: 
    
    ${userInputData.description.trim()}.
    
    Also, you must follow this behaviour when writing:
    As a human book writer, you will be creating full-fledged books that reflect a writing style indistinguishable from human authorship by using simple english, no big words or grammar at all. Focus on narrative techniques, creativity, and depth to ensure the text is not detectable by AI detectors.

    # Steps

    1. Understand the Genre and Audience: The genre and target audience for the book has already been written above to you. Understand them and tailor your writing style, vocabulary, and themes appropriately.
    2. Plot Development: On request, develop a detailed plot outline for each chapter at a time, ensuring it has a captivating beginning, engaging middle, and satisfying conclusion.
    3. Character Creation: Create complex, relatable characters with motivations, flaws, and arcs that contribute to the story’s progression. This should be under the same string as the plot.
    4. Narrative Voice and Style: Choose a consistent narrative voice and style that feels authentically human, with attention to natural language patterns and expressions.
    5. Writing: Compose the text, focusing on authenticity, creativity, and richness of language to enhance human-like qualities - this means your writing should not use predictable words that sounds like a language model, which was just trained to spit out patterns was used.
    6. Edit and Refine: Revise for consistency, coherence, and stylistic polish, ensuring the text flows naturally and showcases human-like creativity.

    # Examples

    * [Example 1 Start]*: If writing a mystery novel, create an intriguing hook in the first chapter, such as a mysterious incident or a puzzle. These chapters must be detailed and long, just like a conventional novel chapter.
    * [Example 1 Additional Detail]*: Develop clues and red herrings throughout the chapters, leading to a surprising yet satisfying resolution.
    * [Continuation of Example 1]*: Ensure character interactions and dialogue are nuanced and reflective of real human experiences, contributing to the mystery's unfolding - in cases of novels or fiction works.
    * [Example 1 End]*

    (Each book example should be a comprehensive and unique storyline, marked by creativity, and should reflect the length and complexity of a real novel.)

    # Notes

    - Pay close attention to emotional depth and narrative consistency.
    - Incorporate cultural, historical, or social references reflective of the human condition.
    - Avoid patterns or clichés typical of AI-generated content by using simple grammar.`
  },
  current_chapter: 1
}

const schema = {
  toc: `{

    "title": "The Title of the book I told you, exactly as i did",

    "subtitle" : "Generate a suitable subtitle to the title and place it here.",

    "toc" : [

        {"ch-1": "the title of the first chapter", "sch-1": ["1.1 subchapter 1 title", "1.2 subchapter 2 title", "1.3 subchapter 3 title", "1.4 subchapter 4 title"], "sch-no": "here, input the number of sub chapters you added in this chapter strictly as a number, not a string. This helps me access this toc for promoting later on. For example, if you included 7 subchapters the value must be a number '7' "},

        {"ch-2": "the title of the second chapter", "sch-2": ["2.1 subchapter 1 title", "2.2 subchapter 2 title", "2.3 subchapter 3 title"], "sch-no": "here, input the number of sub chapters you added in this chapter strictly as a number, not a string. This helps me access this toc for promoting later on. For example, if you included 7 subchapters the value must be a number '7' "}
    ],

    "chapters" : "Here, input the number of chapters in the toc as a number, not a string. This will help me access the available chapters to automatically prompt you later with code. For example, if you included 9 chapters, the value of this property must be just '9'"

}`,
  plot: `{
    "title" : "string, that reps the name of this subchapter. e.g., '1.1 The subchapter's title'", 
    "plot" : "The subchapter plot, alongside the characters"
  }`,
  myPlotSchema: `{
    "type": "object",
    "properties": {
      "title-> The title should just be named 'title'": {
        "type": "string",
        "description": "string, that reps the name of this subchapter. e.g., '1.1 The subchapter's title'"
      },
      "plot -> This should also just be named 'plot'": {
        "type": "string",
        "description": "The subchapter plot, alongside the characters."
      }
    },
    "required": [
      "title",
      "plot"
    ]
  }`,
  plotObject : {
    "chapter-1": [],
    "chapter-2": []
  }

}




const finalReturnData = {}; // An object for collecting data to be sent to the client

app.post("/generate_book", async (req, res) => {

  try {
    const userInputData = req.body;
    const systemInstruction = data.systemInstruction(userInputData);

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", systemInstruction });
    data["model"] = model; // Helps us access this model without having to pass numerous arguments and params
    const mainChatSession = model.startChat({ safetySettings, generationConfig });
    const tocPrompt = getTocPrompt(userInputData);
    const tocRes = await mainChatSession.sendMessage(tocPrompt);
    console.log("This is the model response as an object: \n" + parseJson(tocRes));
    console.log(mainChatSession.getHistory());
    finalReturnData["firstReq"] = parseJson(tocRes);; // Push to final object as an object not a json string
    finalReturnData.plots = {}; // Creates the 'plots' property here to avoid overriding previously added prompts in the loop for generating plots
    data["chatHistory"] = await mainChatSession.getHistory();


    // Next, begin creating each chapter's plot
    await generatePlot();
    res.send(finalReturnData);


    // Next, using the plots to guide the AI to generate chapters


  } catch (error) {

    if (!data.postErr) {
      data.postErr = []
    }
    data.postErr.push(error);
    console.log(data.postErr)
    res.status(500).send(data.postErr);
  }

});

function getTocPrompt(inputData) {
  console.log(inputData);
  return `Generate a comprehensive table of contents for a book titled ${inputData.title}. In your response, include a suitable subtitle that will cause anyone who sees this in an amazon kdp book listing to want to click on it. Keep it simple but effective. Make sure the subtitle follows the amazon kdp rules for subtitles as specified here : \n\n ${data.kdp_titles_subtitle_rules}.
    
    Finally, Return your response in this schema: ${schema.toc}`
}

function parseJson(param) {
  const repairedJSON = jsonrepair(param.response.text()); // firstly, repair the param, if needed
  return JSON.parse(repairedJSON);
}


async function generatePlot() {
  const tableOfContents = finalReturnData.firstReq.toc; // get the table of contents, just to obey DRY principle

  console.log(tableOfContents)
  const config = {
    temperature: 1.5,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 16384,
    responseMimeType: "application/json",
    responseSchema: schema.myPlotSchema
  };
  const plotChatSession = data.model.startChat({ history: data.chatHistory, safetySettings, generationConfig }); // The Model here is from the 'model' we pushed to the 'data' object after creaing the toc. Doing this so that I can simply create a new chat, if i need to use a neew schema. This way, I can simply just slap-in the needed history from previous chats, like I did here.
  data.plots = []; // for the plots to be generated

  for (let i = 0; i < finalReturnData.firstReq.chapters; i++) { 
    if (tableOfContents[data.current_chapter - 1]["sch-no"] !== 0) {
      await continuePlotGeneration(tableOfContents, plotChatSession, config);
      data.current_chapter++;
    } else if (tableOfContents[data.current_chapter - 1]["sch-no"] == 0) {
      // When there are no subchapters for that chapter. This is necessary because some chapters or headings of some books may not really require sub-chapters
      null // Do nothing and generate plots for the next chapter
    }
  }
}


async function continuePlotGeneration(tableOfContents, plotChatSession, config) {
  // const tableOfContents = finalReturnData.firstReq.toc; 
  const currentSubChapterArr = tableOfContents[data.current_chapter - 1][`sch-${data.current_chapter}`];

  const currentChapterPlot = [];

  for (const subchapter of currentSubChapterArr) { // runs a loop to generate plot for subchapters in the current chapter
    const plotPrompt = `Now, let us start the plot for chapter ${data.current_chapter} titled: ${tableOfContents[data.current_chapter - 1][`ch-${data.current_chapter}`]}, but just for the subchapter titled: ${subchapter}. This plot should guide you, the writer on the flow of the story when writing. 
    Create complex, relatable characters with motivations, flaws, and arcs that contribute to the story’s progression - that is, if this book is a fictional novel. 
    These plots should also build on each other. Your response shall be in this schema json: 
    ${schema.plot}`;

    try {
      const secondReqResponse = await sendDelayedMessage(plotChatSession, plotPrompt, config);
      currentChapterPlot.push(secondReqResponse);
    } catch (error) {
      console.error(`An error occurred in CURRENT plot generation for ${subchapter} : ${error}`);
      // Push null to maintain the array structure
      currentChapterPlot.push(null);
    }
  };

  data.plots[`chapter-${data.current_chapter}`] = []; // outside the loop to avoid beingn overridden
  finalReturnData.plots[`chapter-${data.current_chapter}`] = [];
  for (const index of currentChapterPlot) {
    data.plots[`chapter-${data.current_chapter}`].push(index.plot);
    console.log("Index.plot has a type of : " + typeof(index.plot));
    console.log("This is the index: "+ index)
    finalReturnData.plots[`chapter-${data.current_chapter}`].push(index.plot);

  }

}

function escapeJsonString(jsonStr) {
  const myJSONString = JSON.stringify(jsonStr);
  const escapedJSONString = myJSONString.replace(/\\n/g, "\\n")
    .replace(/\\'/g, "\\'")
    .replace(/\\"/g, '\\"')
    .replace(/\\&/g, "\\&")
    .replace(/\\r/g, "\\r")
    .replace(/\\t/g, "\\t")
    .replace(/\\b/g, "\\b")
    .replace(/\\f/g, "\\f");
  console.log("I am the escaped string:")
  console.log(escapedJSONString)
  return escapedJSONString
}

async function sendDelayedMessage(plotChatSession, plotPrompt, config) {

  async function promptModel(retry, tryAgainMsg) {
    try {
      console.log("I, the promptModel, is about to run");
      let result;
      if (retry) { // tell the model to repair its previous json response in this plotSession
        result = await plotChatSession.sendMessage(tryAgainMsg, { generationConfig: config });
      } else {
        result = await plotChatSession.sendMessage(plotPrompt, { generationConfig: config });
      }

      console.log(`This is the 'result' for plot generation ${result.response}`);

      let possibleParsedData;

      try {
        console.log("This is the result's value. it should be the plot generated"+ result.response.candidates[0].content.parts[0].text.trim());
        possibleParsedData = JSON.parse(result.response.candidates[0].content.parts[0].text.trim());

        // checks to see if model response json is valid. If yes, we have already gotten the json we asked the model to generate. So, no need trying to get that after returning this 'sendDelayedMessage' function. If not valid. retry the same plot till we get a valid json.
        
      } catch (error) {
        // checks to catch any syntax errors in the JSON, then tell model to retry
        console.log(error);
        possibleParsedData = await new Promise((resolve) => {
          setTimeout(async () => {
              const result = await promptModel(true ,`The previous json had an error: '${error}'. Repair it and return the corrected one.`);
              resolve(result);
          }, 5000);
      });
        
        
      }
      console.log("This is the possibleParsedData: " + possibleParsedData);
      console.log("type of possibelParseData: " + typeof(possibleParsedData));
      return possibleParsedData;


    } catch (error) {
      console.error("An error occured:" + error)
    }
  }


  async function delay(ms = 6000) {
    return await new Promise((resolve) => {
      setTimeout(async () => {
        console.log("The delay for 6 just ended!");
        const result = await promptModel();
        console.log(`This is result from delay function: ${result}`);
        resolve(result);
      }, ms);
    });
  };

  console.log("The delay for 6 secs is about to begin");
  let returnValue = await delay();
  return returnValue;
}



const PORT = process.env.PORT
const HOST = "127.0.0.1"
app.listen(PORT || 5000, HOST, () => {
  console.log(`Server is running on http://${HOST}/${PORT}`);
});
