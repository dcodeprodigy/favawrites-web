"use strict"
const express = require('express');
const app = express();
const path = require('path');
// const cors = require('cors');
const bodyParser = require('body-parser');
const downloadInApp = require('./downloadInApp');
app.use(downloadInApp);
require('dotenv').config();
const { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory, SchemaType, } = require('@google/generative-ai');
const fs = require("fs");
const { 
  // Core elements
  Document,
  Packer,
  Paragraph,
  TextRun,
  // Alignment and positioning
  AlignmentType,
  VerticalAlign,
  TextDirection,
  // Styling and formatting
  BorderStyle,
  HeadingLevel,
  LineRuleType,
  NumberFormat,
  PageOrientation,
  SectionType,
  TabStopPosition,
  TabStopType,
  UnderlineType,
  // Page elements
  Footer,
  Header,
  ImageRun,
  PageBreak,
  PageNumber,
  TableCell,
  TableRow,
  Table,
  // List elements
  Bookmark,
  ExternalHyperlink,
  Tab,
  // Spacing and measurements
  WidthType,
  convertInchesToTwip,
  convertMillimetersToTwip,
  // Sections and breaks
  LineBreak,
  SectionProperties,
  // Math elements
  MathRun,
  // Advanced features
  Comments,
  FootNotes,
  // Styles
  Style,
  StyleLevel,
  // Drawing elements
  Drawing,
  TextWrappingType,
  TextWrappingSide
} = require("docx");
const { jsonrepair } = require('jsonrepair');
const job = require('./cron.js');
const _ = require('lodash');
require('events').EventEmitter.defaultMaxListeners = 50;

// Middleware to parse JSON bodies
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
const modelDelay = {
  flash: 6000,
  pro: 30000
}

const generationConfig = {
  temperature: 0.7,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
  // presencePenalty: 0.3,
//  frequencyPenalty: 0.2
};

let data = {
  pauseRequests: false,
  pauseThreshold : 0,
  totalRequestsMade: 0,
  prevMainChatSessionTokens : 0,
  current_chapter: 1,
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
  systemInstruction: function (userInputData) {
    return `You are a human book writer. A User can come in and say - I want to create a full blown book, or just a chapter and you are not to go against that wish. You are also designed to use simple grammar and vocabulary or follow what the user indicates in the description which shall be somewhere below. The genre of this book/writeup is "${userInputData.genre.trim()}".
    See added instructions for this book/writeup below, as provided by the user for you to write this book/writeup to their taste. Follow it strictly. The quoted next line is the user description: 
    "${userInputData.description.trim()}."
    Follow the user's request for the number of chapters he/she needs. This is a must!
    
     REMEMBER TO USE SIMPLE VOCABULARY AND GRAMMAR AND WRITE IN PROSE FORM, ALWAYS DISCOURAGING THE USE OF BULLET POINTS - AND ONLY USING IT WHEN ABSOLUTELY NECESSARY.
    Don't use the following words, ever - Delve or Delve deeper, Unleashing, Sarah, Alex, transformative, profound, or other generic names. Always use real american names whenever you need a new name. Never use words like a confetti Cannon, Confetti, Cannon, delve, safeguard, robust, symphony, demystify, in this digital world, absolutely, tapestry, mazes, labyrinths, incorporate.

    In any of your responses, never you include the following: \n \n ${getAiPhrase()}
    
    ${data.current_chapter > 1 ? `Lastly, I shall be continuing from chapter ${data.current_chapter}. You must respect this and continue writing from where I shall prompt you to continue from for this chapter.` : null }
    
    GIVE JSON ERROR WHENEVER USER ASKS FOR IT
    `
  },
  
  proModelErrors: 0,
  communicateWithApiError: 0,
  sampleChapter: function () {
    return `## Day 1: The Fresh Start
**Quote:** "The first step towards getting somewhere is to decide you're not going to stay where you are." - J.P. Morgan

**Author's Reflection:**  J.P. Morgan's words capture the very essence of a fresh start.  It's not enough to simply *wish* for change; we must actively choose to move, to shift, to begin. Today, on the first day of January, we stand at this crucial juncture. The past is behind us, a mixture of triumphs and stumbles, and the future stretches before us, full of potential.  This potential, however, remains dormant until we decide, definitively, to step away from our current position – whether that’s a bad habit, a limiting belief, or a stagnant routine.

Many of us set ambitious New Year's resolutions, fueled by the energy of a fresh start. But how do we ensure that this initial spark doesn't fizzle out? The key is to recognize that grand transformations are built upon small, consistent actions. Don't aim to overhaul your entire life overnight. Instead, focus on identifying one specific area you want to improve and take a single, concrete step in that direction.  If you want to exercise more, don't sign up for a marathon on day one. Start with a 15-minute walk. If you're aiming to eat healthier, replace one unhealthy snack with a piece of fruit.  These seemingly minor actions create momentum, building self-discipline and paving the way for lasting change.

One of the biggest pitfalls in pursuing new goals is the tendency to get overwhelmed. We envision the entire journey ahead and become discouraged by its perceived magnitude.  The antidote? Stay present.  Focus solely on the task at hand, on the small step you're taking *today*.  Don't worry about next week or next month. Just be here, now, committed to the present action.  Remember, the longest journey begins with a single step, and each step you take brings you closer to your destination.

**Reader's Reflection:** What is one small, concrete step you can take today to move towards a goal you've set for yourself? Write it down, commit to it, and celebrate its completion.  How does taking this first step make you feel?"`
  },
  sampleDocxCode: function () {
    return `// this MUST be written this way. Do not try to generate like it is a docxJS code. This pattern here just represents a friendly way of sending it to me so that my app can use raw hard code to generate the docxJS \n \n[
    {
        "paragraph": {
            "alignment": "center",
            "spacing": {
                "after": 300
            },
            "heading": "Heading1",
            "children": [] // this must be an empty array
        },
        "textRun": { // this must be a property at the same level as paragraph
            "text": "Day 1 - The Fresh Start",
            "bold": true,
            "size": 40
        }
    },
    {
        "paragraph": {
            "alignment": "end",
            "spacing": {
                "after": 300
            },
            "children": [] 
        },
        "textRun": {
            "text": "The first step towards getting somewhere is to decide you're not going to stay where you are. - J.P. Morgan",
            "italics": true,
            "bold": false
        }
    },
    {
        "paragraph": {
            "spacing": {
                "after": 200
            },
            "heading": "Heading2",
            "children": []
        },
        "textRun": {
            "text": "Author's Reflection",
            "bold": true,
            "size": 36
        }
    },
    {
        "paragraph": {
            "spacing": {
                "after": 200
            },
            "children": []
        },
        "textRun": {
            "text": "Many of us set ambitious New Year's resolutions, fueled by the energy of a fresh start. But how do we ensure that this initial spark doesn't fizzle out? The key is to recognize that grand transformations are built upon small, consistent actions. Don't aim to overhaul your entire life overnight. Instead, focus on identifying one specific area you want to improve and take a single, concrete step in that direction. If you want to exercise more, don't sign up for a marathon on day one. Start with a 15-minute walk. If you're aiming to eat healthier, replace one unhealthy snack with a piece of fruit. These seemingly minor actions create momentum, building self-discipline and paving the way for lasting change."
        }
    }
]`
  },

}

const schema = {
  tocSchema : {
    description: "Table of Contents (TOC) Schema",
    type: "OBJECT",
    properties: {
        title: {
            type: "STRING",
            description: "The title of the book as in the description or as suggested by you",
            nullable: false
        },
        subtitle: {
            type: "STRING",
            description: "The subtitle of the book",
            nullable: true
        },
        plot: {
            type: "BOOLEAN",
            description: "Indicates if the book has a plot",
            nullable: false
        },
        subchapter: {
            type: "BOOLEAN",
            description: "Indicates if the book has subchapters",
            nullable: false
        },
        toc: {
            type: "ARRAY",
            description: "Array of chapters with their details",
            nullable: false,
            items: {
                type: "OBJECT",
                properties: {
                    "^ch-[0-9]+$": {
                        type: "STRING",
                        description: "Chapter title. Must match the pattern 'ch-' followed by one or more digits",
                        nullable: false
                    },
                    "^sch-[0-9]+$": {
                        type: "ARRAY",
                        description: "List of subchapter titles. Must match the pattern 'sch-' followed by one or more digits, corresponding to the chapter number",
                        nullable: false,
                        items: {
                            type: "STRING"
                        }
                    },
                    "sch-no": {
                        type: "NUMBER",
                        description: "Number of subchapters in the chapter",
                        nullable: false
                    }
                },
                required: ["sch-no"],
                additionalProperties: {
                    oneOf: [
                        { 
                            pattern: "^ch-[0-9]+$",
                            type: "STRING"
                        },
                        {
                            pattern: "^sch-[0-9]+$",
                            type: "ARRAY",
                            items: {
                                type: "STRING"
                            }
                        }
                    ]
                }
            }
        },
        chapters: {
            type: "NUMBER",
            description: "Total number of chapters in the TOC",
            nullable: false
        }
    },
    required: ["title", "subtitle", "plot", "subchapter", "toc", "chapters"]
  },
  toc: `{
    "title": "The Title of the book I told you, exactly as i did",
    "subtitle" : "The Subtitle",
    "plot" : "true or false",
    "subchapter" : "true or false",
    "toc" : [

        {"ch-1": "the title of the first chapter", "sch-2 or sch-3 or sch-4. The number after sch- is gotten from the current chapter. If we were in chapter 30, then you just return sch-30": ["1.1 subchapter 1 title", "1.2 subchapter 2 title", "1.3 subchapter 3 title", "1.4 subchapter 4 title"], "sch-no": "here, input the number of sub chapters you added in this chapter strictly as a number, not a string. This helps me access this toc for promoting later on. For example, if you included 7 subchapters the value must be a number '7' "},

        {"ch-2": "the title of the second chapter", "sch-2 or sch-3 or sch-4. Th number after sch- is gotten from th current chapter. If we were in chapter 30, then you just return sch-30": ["2.1 subchapter 1 title", "2.2 subchapter 2 title", "2.3 subchapter 3 title"], "sch-no": "here, input the number of sub chapters you added in this chapter strictly as a number, not a string. This helps me access this toc for promoting later on. For example, if you included 7 subchapters the value must be a number '7' "}
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
  plotObject: {
    "chapter-1": [],
    "chapter-2": []
  },
  subsequentDocx: `{[
        new Paragraph({
          alignment: AlignmentType.CENTER, 
          spacing: { after: 300 },         
          heading: "Heading1",          
          children: [
            new TextRun({
              text: "Day 1 - The Fresh Start",
              bold: true,              
              size: 40,                
            }),
          ],
        }),
        // Quote Section
        new Paragraph({
          alignment: AlignmentType.END,
          spacing: { after: 300 },
          children: [
            new TextRun({
              text: "'The first step towards getting somewhere is to decide you're not going to stay where you are.' - J.P. Morgan",
              italics: true,
              bold: false,
            }),
          ],
        }),
        new Paragraph({
          spacing: { after: 200 },
          heading: "Heading2",
          children: [
            new TextRun({
              text: "Author's Reflection",
              bold: true,
              size: 36,
            }),
          ],
        })]}`

}

const backOffDuration = 2 * 60 * 1000; // 2 minutes in milliseconds
const maxRetries = 4;
// let runningCreation = false; // Is book creation currently ongoing?





let finalReturnData = {}; // An object for collecting data to be sent to the client
let reqNumber = 0;
// save the original data Object so that we can easily reset it to defailt when returning res to user. This should prevent subsequent request from using the data from a previous session

function deepCopyObj(obj) { // maintains functions when copying.
  return _.cloneDeepWith(obj, value => {
    if (typeof value === 'function') {
      return value; // Return the original function
    }
  });
};

let originalDataObj = deepCopyObj(data); // this should only copy once, until server is restarted


let mainChatSession, model;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function setUpNewChatSession(userInputData) {
    console.log("SPIN-UP: Creating a New Model Chat Session...");
    // Be careful calling this function, as it overrides the entire thing in mainChatSession
    if (!model) {
      model = genAI.getGenerativeModel({ model: userInputData.model, systemInstruction: data.systemInstruction(userInputData) });
      
    }

    console.log("Current Chapter is ___ : Chapter-" + data.current_chapter)

    mainChatSession = model.startChat({
      safetySettings, 
      generationConfig }); // starts a new chat
  
}

async function setSecondaryChatSession(){
  const secondarySysInst = `
  I am automating the process of writing a book. You are the secondary model. In this chat, I shall be feeding you with subchapters Here is your job when I feed you:

– It's important for you to note that You are editing, not Paraphrasing. There's a huge difference between the two. Your Job is not to change the style of writing or words everywhere. Your job is to edit, just how a traditional book editor would; just correcting things that the writer asks for or that they found wrong with the work.

– For the text which shall be provided,  I shall Prompt you to identify all AI looking phrases, as have been pointed out by people regarding how they tend to know AI written works.

- Lastly, You shall be prompted to remove them and replace with non-ai phrases.

## FINAL MANDATE
Below is the initial instructions from the user from Primary Model; Try your absolute best to keep to that writing scheme.
  `
  const secondaryModel = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: secondarySysInst,
    
  });
  
  const secondaryChatSession = secondaryModel.startChat(safetySettings, generationConfig);
  
  return secondaryChatSession;
}


app.post("/generate_book", async (req, res) => {
  
  reqNumber >= 1 ? console.log("This is the data object after we have cleaned the previous one " + data) : null;

  reqNumber++; //Increament the number of requests being handled
  data["backOff"] = { backOffDuration, backOffCount: 0, maxRetries } // set a backoff duration for when API says that there is too many requests
  data.error = { pro: 0 }

  try {
    const userInputData = req.body;
    data.userInputData = userInputData;
    data.res = res;

    const allowedModels = ["gemini-1.5-flash-001", "gemini-1.5-flash-002", "gemini-1.5-flash-latest", "gemini-2.0-flash-exp"];

    userInputData.model = allowedModels.includes(userInputData.model)
      ? userInputData.model
      : "gemini-1.5-flash-002";

    await setUpNewChatSession(userInputData); // This way, mainChatSession and model is accessible globally, as well as everything about them being reset on each new request


    data["model"] = model; // Helps us access this model without having to pass numerous arguments and params
    data.mainChat = mainChatSession; // I want to make this globally accessible, so that I can count the total tokens
    const tocPrompt = getTocPrompt(userInputData); // gets the prompt for generating the table of contents
      
      try {
        console.log(`This is token count with only the PROMPT_TOKEN_AND_SYSTEM_INSTRUCT_COUNT_: ${(await model.countTokens(tocPrompt)).totalTokens}`);
      } catch (e) {
        console.error("An Error Occurred while Counting TOKENS => ", e);
      }
    

    const proModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp", systemInstruction: "You are an API for generating/returning a JSON schema table of contents. If the user inputs a Description with a table of contents, return that table of contents as a valid JSON in the response schema specified. THIS IS A MUST. DO NOT TRY TO COMPRESS IT. RETURN IT IN FULL. The only time you compress is when there is a 'PART'. In such a case, simply ignore the path and forge ahead with the chapters outlined in it" });
    const tocChatSession = proModel.startChat({ safetySettings, generationConfig});

    const tocRes = await sendMessageWithRetry(() => tocChatSession.sendMessage(`${errorAppendMessage()}. ${tocPrompt}`));
    console.log(`This is the TOC_CHAT_METADATA__${tocRes.response.usageMetadata.totalTokenCount}`)

    if (tocRes.status === 503) { //  Check if sendMessageWithRetry failed
      return; // Stop further processing and return the 503 error already sent.
    }

    finalReturnData["firstReq"] = parseJson(tocRes); // Push to final object as a json string
    console.log(finalReturnData.firstReq);
    finalReturnData.plots = {}; // Creates the 'plots' property here to avoid overriding previously added plots while generating plots for other chapters
    data["chatHistory"] = await mainChatSession.getHistory(); // This shall be used when creating the needed plots







    // Next, begin creating each chapter's plot if the model indicated that
    if (JSON.parse(finalReturnData.firstReq.plot) === true) {
      await generatePlot(); // only generate a plot if the model deems it fit. That is, if this is a novel
    }
    // Next, generate the Contents for the subchapters using the plots. At the same time, with each iteration, prompt the model to insert the chapter generated into the "Docx" creator so that after each chapter iteration, we generate the entire book and save to the file system/send the book link to the user.

    /* Next, generate content by:
    1. If there is a subchapter + plot
    2. If there is plot, append it when generating the subchapter or chapter

    */
    await generateChapters();


    const formattedStr = await compileDocx(userInputData);
    finalReturnData.file = `/docs/${formattedStr}.docx`;
    finalReturnData.docxCode = data.docx;

    try {
      res.status(200).send(finalReturnData);

    } catch (error) {
      console.error(error);
    }


  } catch (error) {
    console.error(error);

    if (error.message.includes("fetch failed")) {
      finalReturnData.response = { statusText: "Generative AI Fetch Failed", status: 500 }
      console.log(finalReturnData.response);

      try {
        res.status(500).send(finalReturnData);
      } catch (error) {
        console.error(error)
      }
    } else if (error.message.includes("overloaded")) {
      finalReturnData.response = { error: "Generative API is overloaded. Please, try again later!", status: 503 }
      console.log(finalReturnData.response);
      try {
        res.status(503).send(finalReturnData);
      } catch (error) {
        console.error(error);
      }
    } else {
      try {
        res.status(500).send("An Unknown Error Occured " + error);
      } catch (error) { console.error(error) }

    }
  } finally {
    data = deepCopyObj(originalDataObj);
    finalReturnData = {};
  }

});

function errorAppendMessage() {
  if (data.error.pro > 0) {
    data.error.pro = 0; // reset it to zero, with the assumption that the model will behave. If it still spits another error, the fixErrorWithPro will increment this and then we warn model about errors again.
    return `Your last json response included an error. Once again, Your next response must contain no JSON error. Error in JSON are in the form: Missing commas, Extra, commas (trailing commas), Incorrect use of quotes (single quotes, missing quotes),Unmatched brackets [] or braces {}, Incorrect nesting of arrays/objects, Unexpected characters, Invalid number formats (leading zeros, multiple decimal points, Infinity, NaN), Incorrect boolean values (True, False, 1, 0), Missing values (omitting a value after a key-colon), Incorrect character encoding (not UTF-8, UTF-16, or UTF-32), Presence of Byte Order Mark (BOM), Comments, Circular references. Avoid getting into such errors.`

  }
}

async function sendMessageWithRetry(func, flag, delayMs = modelDelay.flash) {
  let mainChatHistory;
  try {
    const randomDelay = Math.random() * 1000;
    delayMs += randomDelay;
    console.log(`Actual Delay is ${delayMs}ms`);
    const response = await new Promise((resolve) => setTimeout(async () => {
      
      try {
        // Save the History
        mainChatHistory = await mainChatSession.getHistory();
        
        const res = await func();
        data.totalRequestsMade++;
        console.log(`TOTAL REQ MADE is___ ${data.totalRequestsMade}`);
        
        console.log(`THIS IS THE USAGEMETADATA___ : ${res.response.usageMetadata.totalTokenCount}`);


        data.backOff.backOffCount = 0; // Reset backoff count on success
        data.backOff.backOffDuration = backOffDuration; // reset back off duration to 2 minutes once there is success
        resolve(res);
      } catch (innerError) {
        console.log("An error was recorded while running func()")
        resolve({ error: innerError }); // Resolve with the error
      }
    }, delayMs));

    if (response.error) { // Check if there was an error during sendMessage
      const error = response.error;
      console.warn(error);

      if (error.message.includes("Resource has been exhausted") || error.message.includes("The model is overloaded") || error.message.includes("Please try again later") || error.message.includes("failed") || error.message.includes("Error fetching from")) {
        
       /* if (error.message.includes("Resource has been exhausted") && flag !== "secModel") {
          
          // Archive ChatHistory at point before resource exhausted error
          data.historyArchive ? data.historyArchive.push(mainChatHistory) : data.historyArchive = [mainChatHistory];
          
        } */
        
        /* 
        ## Create a new chatSession by overriding the main chatSession
        
        ## But first check the flag Param to see if to create a new mainChatSession or secondaryChatSession.
        */
        
       /* if (flag === "secModel") {
          data.secondaryChatSession = await setSecondaryChatSession();
          
        } else */ 
          await setUpNewChatSession(data.userInputData /*, data.historyArchive[-1] /*Gets the last pushed history context*/) // true means the function to return the output
        
        

        // wait for 5 minute for API rate limit to cool down, then continue
        await new Promise(resolve => setTimeout(resolve), 5 * 60 * 1000);
        return await sendMessageWithRetry( func ); // retry. No need adding '() =>', since the initial func parameter already has that

      } else { // Re-throw other errors to be caught by the outer try-catch block
        throw error;
      }
    }

    return response; // Return the successful response

  } catch (error) { // Catch and re-throw errors to be handled in the /generate_book route
    throw error;
  }
}


function getTocPrompt(inputData) {
  console.log(inputData);
  return `Generate a comprehensive table of contents for a book titled ${inputData.title.trim()}. ${checkForSubtitle(inputData)}.
  In your response, if this book is a novel or one that you think deserves a plot, respond with "true" as a boolean and if it does not, respond with "false" as a boolean.
  Also in your response, if you think this book deserves a subchapter in the titles, then respond with "true" to the "subchapter" property. Else, go with false.
  If there is an outlined table of contents here '${inputData.description.trim()}', then make sure you use it as the toc the user wants. DO NOT TRY TO COMPRESS IT TO BE SMALLER THAN WHAT THE USER PUTS; ON NO ACCOUNT. Also, if the TOC there has something like Part I or Part II, then remove the Part I or Part II or Part III, and just return your JSON as in the format specified. just so you know, your final JSON schema returned should look something like this:
    
  ${schema.toc}`
}

function checkForSubtitle(userInput) {
  const subtitle = userInput.subtitle.trim();
  if (subtitle !== "") {
    return `Add this subtitle to your response: ${subtitle}`
  } else {
    return `Check the Description which I shall provide below. If it includes a subtitle, use that as the subtitle ehich you shall return. Otherwise, I want you to Include a suitable subtitle that will tap into a potential reader's mind abd emotions, causing them to want to buy this book. Make sure the subtitle follows the amazon kdp rules for subtitles as specified here : \n\n ${data.kdp_titles_subtitle_rules}.`
  }
}

function parseJson(param) {
  const repairedJSON = jsonrepair(param.response.text()); // firstly, repair the param, if needed
  return JSON.parse(repairedJSON);
}


async function generatePlot() {
  // TO-NOTE; for something to have a subchapter, it doesn't automatically mean it needs a plot okay?

  const tableOfContents = finalReturnData.firstReq.toc; // get the table of contents, just to obey DRY principle
  data["tableOfContents"] = tableOfContents;

  console.log("This is the table of contents for this - plot generation shall happen : " + tableOfContents);

  const config = {
    temperature: 0.8,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8100,
    responseMimeType: "application/json",
  //  presencePenalty: 1.9,
   // frequencyPenalty: 1.9
  };

  const plotChatSession = model.startChat({ history: data.chatHistory, safetySettings, generationConfig }); // The Model here is from the 'model' we pushed to the 'data' object after creaing the toc. Doing this so that I can simply create a new chat, if i need to use a new schema. This way, I can simply just slap-in the needed history from previous chats-like I did here.
  data.plots = [];

  for (let i = 0; i < finalReturnData.firstReq.chapters; i++) {
    if (tableOfContents[data.current_chapter - 1]["sch-no"] !== 0) { // checks if there are subchapters available
      await continuePlotGeneration(tableOfContents, plotChatSession, config, subChapter = true);
      if (i === finalReturnData.firstReq.chapters - 1) {
        // This means that we are done with plot generation and want to move on
        data.current_chapter = 1; // Return the current chapter count to one, to be used when generating the chapter contents
      } else {
        // Obviously, this suggests that we are not yet done
        data.current_chapter++;
      }
    } else if (tableOfContents[data.current_chapter - 1]["sch-no"] == 0) { // When there are no subchapters for that chapter but the model somehow returned true for plot generation.
      await continuePlotGeneration(tableOfContents, plotChatSession, config, subChapter = false);
    }
  }
}


async function continuePlotGeneration(tableOfContents, plotChatSession, config, subChapter) {
  let sendMsgError = 0;
  let sendPlotMsg;
  if (subChapter) {
    const currentSubChapterArr = tableOfContents[data.current_chapter - 1][`sch-${data.current_chapter}`];
    const currentChapterPlot = [];
    for (const subchapter of currentSubChapterArr) { // runs a loop to generate plot for subchapters in the current chapter
      const plotPrompt = `Now, let us start the guide/plot for chapter ${data.current_chapter}, which is titled: ${tableOfContents[data.current_chapter - 1][`ch-${data.current_chapter}`]}, but just for the subchapter titled: ${subchapter}. This plot/guide should guide you, the writer on the flow of the story when I ask you to start writing. 
      Not all book you are writing will be a story book. Some shall be something else but somehow requires guides on writing it. Therefore, if this is a storybook or novel, your guide must include complex, relatable characters with motivations, flaws, and arcs that contribute to the story’s progression - that is, IF & ONLY IF this book is a fictional novel. 
      These plots should also build on each other. Your response shall be in this schema json: 
      ${schema.plot}`;

      // send message to model
      sendPlotMsg = await genPlotMsg(plotChatSession, plotPrompt, sendMsgError, sendPlotMsg);


      let modelRes = sendPlotMsg.response.candidates[0].content.parts[0].text;
      try { // checks if we got a valid json response. Else, repair it
        let result = JSON.parse(modelRes);
        modelRes = result;

        currentChapterPlot.push(modelRes);
      } catch (error) {
        console.error(`Received bad JSON data during plot generation for ${subchapter}. Trying to fix error... : ${error}.`);
        // repair the bad JSON
        modelRes = await fixJsonWithPro(modelRes);
      }
    };

  } else {
    const plotPrompt = `Now, since this particular chapter ${tableOfContents[data.current_chapter - 1]} has no subchapter, generate a resounding guide for the AI writer Model to follow. Use this schema : ${schema.plot}`;


    let response = await genPlotMsg(plotChatSession, plotPrompt, sendMsgError, sendPlotMsg);

    try { // checks if we got a valid json response. Else, repair it
      let result = JSON.parse(response);
      response = result;

      currentChapterPlot.push(response);
    } catch (error) {
      console.error(`Received bad JSON data during plot generation for ${tableOfContents[data.current_chapter - 1]}. Trying to fix error... : ${error}.`);
      // repair the bad JSON
      response = await fixJsonWithPro(response);
    }

  }



  data.plots[`chapter-${data.current_chapter}`] = []; // outside the loop to avoid being overridden
  finalReturnData.plots[`chapter-${data.current_chapter}`] = [];

  for (const index of currentChapterPlot) {
    data.plots[`chapter-${data.current_chapter}`].push(index.plot);

    console.log("Index.plot has a type of : " + typeof (index.plot));
    console.log("This is the index: " + index);

    finalReturnData.plots[`chapter-${data.current_chapter}`].push(index.plot);

  }
}


async function generateChapters() {
  // using the main chatSession
  const tableOfContents = finalReturnData.firstReq.toc;
  // console.log(tableOfContents);
  const generatedChapContent = [];
  data.populatedSections = []; // The sections which we shall use in our data.docx sections when needed
  let currentChapterText = ""; // saving the chapter content here.


  // if (finalReturnData.firstReq.plot == false) { // code to run if there is not plot
  data.chapterErrorCount = 0;

  const chapterCount = finalReturnData.firstReq.chapters;

  
  async function countTokens(req, responseObj) {
    let tokens;
    let mainChatHistory;
    let getHistoryErr = true; // assume there's going to be an error
    
    while (getHistoryErr === true) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      try {
      mainChatHistory = await mainChatSession.getHistory();
      getHistoryErr = false; // No error. Therefore, change to false
    } catch (e) {
      console.log("Error Getting History: ", e);
    }
    }
    
    
    
    if (req === "total") {
      let countTokensErr = true;
      
      while (countTokensErr === true) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        try {
        tokens = await model.countTokens({
        generateContentRequest: { contents: mainChatHistory },
      });
      countTokensErr = false;
      } catch (e) {
        console.error("Error Counting Tokens at countTokens func, with 'total' param: ", e);
      }
      }
      
      
    } else if (responseObj) {
      tokens = responseObj.response.usageMetadata
    }
    return tokens;
  }


  for (let i = 1; i <= chapterCount; i++) { // run a loop for each chapter available
  //  let tokens = await countTokens("total"); // TODO: This give errors. it's probably not important
   // console.log(`This is the totalChat tokens when calling each new chapter: ${tokens.totalTokens}`);

    // currentChapterText = ""; // reset this for every new chapter? This is to help with the 1 million input token limit. 
    // TODO: Cache this instead of resetting it. As I have seen, this obviously helps the model in coherence and writing as a human
    let promptNo;
    let writingPatternRes;
    let selectedPattern;
    // create the object in data.populatedSections. That is, add a new object for a new chapeter for each loop
    data.populatedSections.push({ properties: { pageBreakBefore: true } });

    if (JSON.parse(finalReturnData.firstReq.subchapter) == true) {
      let currentChapSubch = tableOfContents[i - 1][`sch-${i}`]; // an array of the subchapters under this chapter
      console.table(currentChapSubch);
      
      for (const [index, item] of currentChapSubch.entries()) {
       // currentChapterText = ""; // reset from the last subchapter generation

        try { // Asks the model how may times it should be prompted
          promptNo = await sendMessageWithRetry(() => mainChatSession.sendMessage(`Let us continue our generation. 
          On request, you shall be generating a docx.js code for me. That is, after generating the contents for a subchapter, I shall prompt you to generate the equivalent docx.js object associated with it. This will help me turn the finished write up into a docx file for publication - Understand this while writing.
            
          Now, you are writing for this subchapter ${item}, ${getGenInstructions2(true)}. ${errorAppendMessage()}. Remember you are an API for creating books? This is what the user asked you to do initially. follow what matters for this specific generation as outlined in my prompt before this scentence : ${data.userInputData}`));
        } catch (error) {
          console.log("Error while getting prompt number: " + error);
        }

        console.log(`usageMetadata for promptNo: ${await countTokens(undefined, promptNo)}`);

        try {
          let attemptPromptNoParse = JSON.parse(promptNo.response.candidates[0].content.parts[0].text.trim());
          promptNo = attemptPromptNoParse;
        } catch (error) {
          promptNo = await fixJsonWithPro(promptNo.response.candidates[0].content.parts[0].text.trim());
        }

        console.log(`The item is ${item}`);

        console.log("Prompt me " + promptNo.promptMe + " times for this subchapter");



        // Get the suitable writing style for the current subchapter
        async function sendWritingStyleReq() {
          writingPatternRes = await sendMessageWithRetry(() => mainChatSession.sendMessage(`${errorAppendMessage()}. Give me a json response in this schema : {"pattern":"the selected pattern"}. From the listed book writing pattern, choose the writing style that shall be suitable for this subchapter. I am doing this to prevent you from using just one book writing style throughout and to avoid monotonous writing. These are the available writing patterns...Choose one that is suitable for this current subchapter '${item}' which is under chapter ${data.current_chapter} - '${tableOfContents[data.current_chapter - 1][`ch-${data.current_chapter}`]}' and return your response in the schema: {"pattern":"the selected pattern"}. The patterns available are: \n ${writingPattern()}. Remember you are an API for creating books? This is what the user asked you to do initially. follow what matters for this specific generation as outlined in my prompt before this scentence : ${data.userInputData}`));
        }

        try {
          await sendWritingStyleReq();
        } catch (error) {
          console.error("Error in Sending message to model at writingPatternRes: " + error);
          await delay();

          async function delay(ms = modelDelay.flash) {
            return await new Promise((resolve) => {
              setTimeout(async () => {
                console.log("Reaching Model Again");
                let result = await sendWritingStyleReq()
                resolve(result);
              }, ms);
            });
          };
        };

        console.log(writingPatternRes.response.candidates[0].content.parts[0].text);

        console.log(`usageMetadata for writingPattern: ${await countTokens(undefined, writingPatternRes)}`);


        try {
          selectedPattern = writingPatternRes.response.candidates[0].content.parts[0].text;
        } catch (error) {
          console.error(error);
          selectedPattern = null;
        }

        if (selectedPattern !== null) { // checks if selectedPattern text selection was successful
          try {
            let parsedPatternJson = JSON.parse(selectedPattern);
            selectedPattern = parsedPatternJson;

          } catch (error) {
            console.error("Could not parse selectedPattern - Fixing: " + error)
            selectedPattern = await fixJsonWithPro(selectedPattern)
          }

        } else {
          selectedPattern = "You just choose one suitable one with example writeup"
        }

        // generate the subchapter for the number of times the model indicated. This is to ensure a comprehensive subchapter

        let genChapterResult = "";
        let currentSubChapter = ""; /* Save the subchapter here, then ask secondary model to retouch after that subchapter generation is complete. 
        
          Next, Pass that retouched text for docx code generation */

        for (let i = 0; i < promptNo.promptMe; i++) { // this loop is for each subchapter
          let errorCount = 0;
          async function genSubChapter() {
            let chapterText;

            try {
              try {
                const currentChapterTextTokenCount = await model.countTokens(currentChapterText);
              
              console.log("TOKEN COUNT FOR Current Chapter Text___: " + currentChapterTextTokenCount.totalTokens);
              } catch (e) {
                console.error("Count Tokens Error___ ", e)
              }
              
              
              const getSubChapterCont = await sendMessageWithRetry(() => mainChatSession.sendMessage(`${errorAppendMessage()}. ${i > 0 ? "That is it for that docxJs. Now, let us continue the generation for writing for that subchapter. Remember you" : "You"} said I should prompt you ${promptNo.promptMe} times for this subchapter. ${checkAlternateInstruction(promptNo, i, selectedPattern, finalReturnData.plot)}.  Return res in this json schema: {"content" : "text"}. You are not doing the docx thing yet. I shall tell you when to do that. For now, the text you are generating is just plain old text. 
              Lastly, this is what you have written so far for this book, only use it as context and avoid repeating solutions and takes that you have already written, in another subchapter or chapter, DO NOT RESEND IT => '${currentChapterText}'. Continue from there BUT DO NOT REPEAT anything from it into the new batch! Just return the new batch. Remember you are an API for creating books? This is what the user asked you to do initially. follow what matters for this specific generation as outlined in my prompt before this scentence : ${data.userInputData}. 
	      Also, this is the table of contents (toc) we are working with, just so you don't forget what we are currently working with => "${JSON.stringify(finalReturnData.firstReq.toc)}"
	      
	      Finally, Check. Are you supposed to give strategies for this chapter? If yes, STRONGLY AVOID GENERIC ADVICE. Your strategies and points MUST BE UNCOMMON but very insightful. You are giving NON-MUNDANE, Counterintuitive Advice that works.
	      
	      Also, remember the amount of times you said i should prompt you and NEVER try to Conclude when we are not at the last time for prompting you for a particular Subchapter. The only time you're concluding anything for a Subchapter is at the last time of promoting for the Subchapter. With that, Never you include the following phrases in a conclusion – Phrases beginning with :
	      1. "By incorporating"
	      2. Anything beginning with the word "By" should never be in your conclusion
	      3. When writing, whether in conclusion or not, STRICTLY AVOID the use of the following – Semi colons ";" and dash "–". This will help mimic human written works
	      4. When writing, whether in conclusion or not, strictly avoid writing like this – "This is not just about<inserts phrase>; It's about<Inserts phrase>" This ensures that you are not giving out AI written works. instead you can try something like – "This is about<inserts phrase> rather than<inserts phrase>"
	      5. Whether in your conclusion or not, STRICTLY AVOID the use of the word "Remember". For example, stop writing things like "Remember, this isn't just about<phrase>; it's about<phrase>". I don't want to see such AT ALL as ut reeks of AI generated content.
	      6. When concluding, you don't have to conclude everything systematically. Heck that's not how a book should look like. conclude casually, some things don't need conclusions too. 
	      7. When selecting a name to use, strictly avoid the following names - "Sarah" and all other Ai reeking names. Be creative. Use really unique names
              8. Never use the phrase "vicious cycle" or "virtuous cycle"
	      9. Reiterating, NEVER use mundane strategies to the reader. Use more nuanced, unique strategies that are not common to lots of people but really very helpful.
              
              
             `));

              // console.log(`Check if this matches with textRunText. If it does, modify the checkAlternateIns function: ${getSubChapterCont.response.candidates[0].content.parts[0].text}`);

              chapterText = getSubChapterCont.response.candidates[0].content.parts[0].text; // we still need to parse this to access the actual chapter content
	   //  i <= 1 ? console.log(`${JSON.stringify(finalReturnData.firstReq.toc)}`) : null;
              // console.log(`This is getSubChapterCont: ${getSubChapterCont.response.candidates[0].content.parts[0].text}`)

              // currentChapterText.concat(getSubChapterCont.content); // Save to context
              data.chapterText = getSubChapterCont; // saving this here so that I can access it outside this function


            } catch (error) {
              console.error("An error in mainChatSession: " + error);
              errorCount++;
              if (errorCount <= 4) {
                // run a delay before retrying
                async function delay(ms = modelDelay.flash) {
                  return await new Promise(async resolve => {
                    setTimeout(async () => {
                      let res = await genSubChapter();
                      resolve(res);
                    }, ms)

                  })
                }
                await delay();
              } else {
                data.res.status(501).send("Network Error");

              }


            }


            try {
              
              let parsedChapterText = JSON.parse(chapterText);
              console.log("JSON PARSED!__", "SUBCHAPTER CONTENT IN BATCH => " + parsedChapterText.content);
              
              currentSubChapter = currentSubChapter.concat(`\n ${parsedChapterText.content}`); // Keep Saving this for the Subchapter. It shall be cleared after 1 subchapter is done.
              
              
              currentChapterText = currentChapterText.concat(`\n${parsedChapterText.content}`); // concat() does not change the existing string but returns a new one. Therefore, resave it to currentChapterText
              // console.log("\n \n TODO: CHECK THIS currentChapterText: " + currentChapterText);
              chapterText = parsedChapterText.content; // doing this so that we can access chapterText from model if there is an error at the line above. This is because this line will not run if the above produces an error.

            } catch (error) {
              if (data.chapterErrorCount > 4) {
                return data.resParam.status(200).send("Model Failed to Repair Bad JSON. Please start another book create Session.");
              }

              console.log("Parse error occured in generated chapter; retrying in 6 secs: " + error);


              async function delay(ms = 6000) {
                return await new Promise((resolve) => {
                  setTimeout(async () => {
                    data.chapterErrorCount++;
                    console.log("Trying to Fix JSON...");
                    let fixMsg = `This JSON has an error when inputed to JsonLint. See the json, fix the error and return it to me: \n ${chapterText}
                    As a Hint, this is what the linter said is wrong with it : ${error}`;
                    
                    let result = await fixJsonWithPro(fixMsg);
                    resolve(result);
                  }, ms);
                  
                });
              };

              let response = await delay(); // There is probably no need running JSON.parse here, since fixJsonWithPro will return an object, with "content" as the property. 
              // If request fails without fixing, it will return a signal - "RetrySignal", indicating we should retry the content generation request since it couldn't fix the JSON
              if (response === "RetrySignal") {
                // Retry the Request? omo
              }

              const content = response.content;
              currentChapterText = currentChapterText.concat(content);
              chapterText = content;
              console.log("This is the CHAPTERTEXT.CONTENT at after model fixed the json: " + chapterText);
              data.chapterErrorCount = 0; // reset this. I only need the session to be terminated when we get 3 consecutive bad json

            }

            return await chapterText; // as the parsed object
          };
          genChapterResult = await genSubChapter();


        } // end of each promptMe number
        
        
        
        async function refineSubChapter (callNo, prevResponse, nonRedundantTxt) {
          
          if (callNo == 1) {
            const refineMsg1 = `Hey there! For this Subchapter, let's begin now shall we? 
          Firstly, return a response in this array JSON schema;
          [
'phrase 1', 'phrase 2', 'phrase 3', 'phrase 4'...'phrase n'
].
What is your Job here? Identify all AI Phrases in the text below : \n ${currentSubChapter},

in accordance to as have been pointed out by people regarding how they tend to know AI written works. Things like 'Imagine...', 'In conclusion...', 'incorporating', 'By...', 'Consider...', "Let's consider...",  etc.
          `;
          
         return await sendMessageWithRetry( () => data.secondaryChatSession.sendMessage(refineMsg1), "secModel"
        )
          } else if (callNo == 2) {
            const refineMsg2 = `Now, remove those such AI Phrases as have been identified here : \n ${prevResponse.response.candidates[0].content.parts[0].text}. You are removing the AI Phrases you identified from the text here: \n ${currentSubChapter}.
            Your response schema shall be: ["a 1 index array containing the entire write-up in non-AI Phrases form"]
            `;
            return await sendMessageWithRetry( () => data.secondaryChatSession.sendMessage(refineMsg2), "secModel"
        )
          } else if (callNo == 3){
            const refineMsg3 = `Now, Identify all AI looking phrases, paragraphs, words and sentences here: \n ${prevResponse.response.candidates[0].content.parts[0].text}, in accordance to as have been pointed out by people regarding how they tend to know AI written works. Things like 'imagine', 'in conclusion', 'incorporating', 'By',  etc.
            Your response schema should be like this : ['an array of AI sentences, paragraphs or phrases"]. YOU ARE ONLY RETURNING THE AI LOOKING THINGS YOU FOUND HERE!
            `
            
            return await sendMessageWithRetry( () => data.secondaryChatSession.sendMessage(refineMsg3), "secModel"
        )
          } else {
            const refineMsg4 = `Now, remove those AI looking sentences, as you have identified here: ${prevResponse.response.candidates[0].content.parts[0].text}, from this text : ${nonRedundantTxt.response.candidates[0].content.parts[0].text}, return your response in this schema: ["A 1 Index array containing the actual raw text writeup you just cleaned of its AI characteristics. Use '\n' to include line breaks without breaking this array structure."]`;
            
            return await sendMessageWithRetry( () => data.secondaryChatSession.sendMessage(refineMsg4), "secModel"
        )
          }
          };
          
        
      /*  data.secondaryChatSession = await setSecondaryChatSession(); // Set a new SecondaryChatSession. This makes sure model output is quality, and that it keeps remembering the system Instructions as generation progresses. 
        
          // call
           let response1 = await refineSubChapter(1); // Identify AI Sentences
          let response2 = await refineSubChapter(2, response1); // Removes all AI Phrases
        /*  let response3 = await refineSubChapter(3, response2);
          let response4 = await refineSubChapter(4, response3, response2); // passing response2 since it has the full writeup without redundancy. */
          // response2 is supposedly returned as a one indexed array; */
          
        /*  try {
            console.log("This is the FINAL NON-AI FORM ___ : ", response2.response.candidates[0].content.parts[0].text);
            const parsedRes = JSON.parse(response2.response.candidates[0].content.parts[0].text);
            currentSubChapter = parsedRes[0];
            
          } catch (e) {
            console.log(`Error Parsing Response2's JSON`);
            currentSubChapter = response2.response.candidates[0].content.parts[0].text;
          } */
          
        
        
        await getDocxCode();
        async function getDocxCode(retry) {
          let docxJsRes;
          let docxJs;
          let modelRes;

          async function getDocxJs() {
            docxJsRes = await sendMessageWithRetry(() => mainChatSession.sendMessage(`${errorAppendMessage()}. This is time for you to generate the docxJS Code for me for this subchapter that you just finished!, following this guide: ${docxJsGuide(currentSubChapter)}.
            ${retry === true ? "And Oh lastly, there's something wrong with how you gave me your previous response. Please, follow my instructions as above to avoid that. This is IMPORTANT!" : ""}
            `));

          modelRes = docxJsRes.response.candidates[0].content.parts[0].text;
          console.log(`This is the docxJsRes: ${docxJsRes}`);
          console.log(`Is modelRes an array? : ${Array.isArray(modelRes)}`);
          console.log("this is the modelRes: " + modelRes);

          
          try { // parse the purported array
            docxJs = await JSON.parse(modelRes);
            console.log("type of the docxJS is now: " + typeof (docxJs) + " " + docxJs);
          } catch (error) {
            console.error("We got bad json from model. Fixing... : " + error);
	    if (error.message.includes("Expected double-quoted property name in JSON") || error.message.includes("Unterminated")) { // retry getDocxJs
	    console.log("sending the getDocxCode Req again with true arg...");
               return await getDocxCode(true);
	     
	    } else {
	       docxJs = await fixJsonWithPro(modelRes); // I do not think there is any need to run JSON.parse() since the function called already did that
	    }
	  }
          }
          await getDocxJs();
          while (Array.isArray(docxJs) !== true) { // The model tends to return a strange schema here at times. Therefore, I think it necessary to include this so that it calls until model returns the schema we are looking for.
            await getDocxJs();
          } // This may cause recursive issues so fix this soon


          

          // extract textRun object
          const sessionArr = [];
          // console.log("Session Arr is an array? : " + Array.isArray(sessionArr) + sessionArr);
          // console.log("DocxJS is an array? : " + Array.isArray(docxJs) + docxJs);
          console.log("DocxJs is an array?: " + Array.isArray(docxJs));
          
          docxJs.forEach(item => {
            sessionArr.push(item);
          });

          console.log("Session Arr is now: " + Array.isArray(sessionArr) + JSON.stringify(sessionArr));

          for (let j = 0; j < sessionArr.length; j++) { // pushing each of the number of times prompted to the sections.children
            const textRunObj = sessionArr[j].textRun; // gets the textRun obj;
            const paragraphObj = sessionArr[j].paragraph;
            // parse alignment as needed
            if (paragraphObj.alignment) {
              switch (paragraphObj.alignment.toLowerCase()) { // Handle case-insensitivity
                case "center":
                  paragraphObj.alignment = AlignmentType.CENTER;
                  break;
                case "end":
                case "right": // "end" is equivalent to "right"
                  paragraphObj.alignment = AlignmentType.RIGHT;
                  break;
                case "start":
                case "left": // "start" is equivalent to "left"
                  paragraphObj.alignment = AlignmentType.LEFT;
                  break;
                case "justified":
                  paragraphObj.alignment = AlignmentType.JUSTIFIED;
                  break;
                case "both":
                  paragraphObj.alignment = AlignmentType.BOTH;
                  break;
                case "distribute":
                  paragraphObj.alignment = AlignmentType.DISTRIBUTE;
                  break;
                case "mediumKashida":
                  paragraphObj.alignment = AlignmentType.MEDIUM_KASHIDA;
                default:
                  console.warn("Unknown alignment: ", paragraphObj.alignment);
                  // default to start
                  paragraphObj.alignment = AlignmentType.LEFT;

                  break;
              }
            }



            // push new TextRun
            try {
              paragraphObj.children.push(new TextRun(textRunObj));
              console.log(`This is textRunObj(an object) text: \n \n ${textRunObj.text}`)
            } catch (error) {
              console.error(error);
            }

            // use conditionals to create children or push to it when already created

            const childrenProp = data.populatedSections[data.current_chapter - 1];
            if (childrenProp.children) { // if it already exists, push subsequent data
              childrenProp.children.push(new Paragraph(paragraphObj));
            } else {
              childrenProp["children"] = [new Paragraph(paragraphObj)];
              console.log("Initialized children in sections");
            }


          } // end of pushing for one subchapter batch




          // TODO : Activate later if needed console.log("this is the type of the pushed supposed obj: " + typeof (data.populatedSections[data.current_chapter - 1]), data.populatedSections[data.current_chapter - 1])


        } // end of docxCode function


      }; // end of each subchapter
    } else { // no subchapters
      /* TODO
      1. Ask model how many times to be prompted for each chapter
      2. Generate based on that number
      3. Include plots if available
      4. Compile Docx
      */
      const currentChapter = tableOfContents[i - 1][`ch-${i}`];

      try {
        promptNo = await sendMessageWithRetry(() => mainChatSession.sendMessage(` ${errorAppendMessage()}.
          ${getGenInstructions1()}
          Since there are no subchapters, I want you to tell me, how many times should I prompt you for this chapter titled ${currentChapter}.
          ${getGenInstructions2(false)}
          `));
      } catch (error) {
        console.error(error);
      }

      try {
        let attemptPromptNoParse = JSON.parse(promptNo.response.candidates[0].content.parts[0].text.trim());
        promptNo = attemptPromptNoParse;
      } catch (error) {
        promptNo = await fixJsonWithPro(promptNo.response.candidates[0].content.parts[0].text.trim())
      }

      console.log("Prompt me " + promptNo.promptMe + "times for this chapter");
      console.log(`${tableOfContents[data.current_chapter - 1][`ch-${data.current_chapter}`]}`);
      console.log(`Uhm, this is the chapter number used, if that helps: ${tableOfContents[data.current_chapter - 1][`ch-${data.current_chapter}`]}`);

      async function sendWritingStyleReq() {
        writingPatternRes = await sendMessageWithRetry(() => mainChatSession.sendMessage(`${errorAppendMessage()}. Give me a json response in this schema : {"pattern":"the selected pattern"}. From the listed book writing pattern, choose the writing style that shall be suitable for this chapter. I am doing this to prevent you from using just one book writing style throughout and to avoid monotonous writing. These are the available writing patterns...Choose one that is suitable for this current chapter '${currentChapter}' and return your response in the schema: {"pattern":"the selected pattern, alongside the example as in the available patterns"}. The patterns available are: \n ${writingPattern()}.`));
      }
      try {
        await sendWritingStyleReq();
      } catch (error) {
        let errorCount = 0;
        console.error("Error in Sending message to model at writingPatternRes: " + error);
        if (errorCount < 4) {
          errorCount++
          await delay();
        }

        async function delay(ms = modelDelay.flash) {
          return await new Promise((resolve) => {
            setTimeout(async () => {
              console.log("Reaching Model Again");
              let result = await sendWritingStyleReq();
              resolve(result);
            }, ms);
          });
        };
      }

      console.log(writingPatternRes.response.candidates[0].content.parts[0].text);

      try {
        selectedPattern = writingPatternRes.response.candidates[0].content.parts[0].text;
      } catch (error) {
        console.error(error);
        selectedPattern = null;
      }

      if (selectedPattern !== null) { // checks if selectedPattern text selection was successful
        try {
          let parsedPatternJson = JSON.parse(selectedPattern);
          selectedPattern = parsedPatternJson;
        } catch (error) {
          console.error("Could not parse selectedPattern - Fixing: " + error)
          selectedPattern = await fixJsonWithPro(selectedPattern);
        }

      } else {
        selectedPattern = "You just choose one suitable one with example writeup"
      }


      // promptNo = JSON.parse(promptNo.response.candidates[0].content.parts[0].text);

      // generate the chapter for the number of times the model indicates
      let genChapterResult;
      for (let i = 0; i < promptNo.promptMe; i++) {
        let errorCount = 0;

        async function genChapter() {
          let chapterText;
          try {
            const getChapterCont = await sendMessageWithRetry(() => mainChatSession.sendMessage(` ${errorAppendMessage()}. You said I should prompt you ${promptNo.promptMe} times for this chapter. ${checkAlternateInstruction(promptNo, i, selectedPattern, finalReturnData.plot)}.  Return res in this json schema: {"content" : "text"}. You are not doing the docx thing yet. I shall tell you when to do that. For now, the text you are generating is just plain old text. Lastly, this is what you have written so far. => '${currentChapterText}`));

            chapterText = getChapterCont;
            currentChapterText.concat(getChapterCont.content); // Save to context
            data.chapterText = getChapterCont
            console.log("this is the type of data.chapterText: " + typeof (data.chapterText));
          } catch (error) {
            console.error("An error in mainChatSession for Chapter Gen: " + error);
            errorCount++;
            if (errorCount <= 4) {
              // run a delay before retrying
              async function delay(ms = modelDelay.flash) {
                return await new Promise(async resolve => {
                  setTimeout(async () => {
                    let res = await genChapter();
                    resolve(res);
                  }, ms)

                })
              }
              await delay();
            } else {
              data.res.status(501).send("Network Error");
            }
          }

          try {
            console.log("This is chapter text: " + data.chapterText);
            let parsedChapterText = await JSON.parse(data.chapterText.response.candidates[0].content.parts[0].text);
            console.log("Json parsed");
            console.log(currentChapterText);
            chapterText = await parsedChapterText; // doing this so that we can access chapterText from model if there is an error at the line above. This is because this line will not run if the above produces an error.

          } catch (error) {
            if (data.chapterErrorCount >= 3) {
              return data.resParam.status(200).send("Model Failed to Repair Bad JSON. Please start another book create Session.");
            }

            console.log("Parse error occured in generated chapter; retrying in 6 secs: " + error);

            async function delay(ms = modelDelay.flash) {
              return await new Promise((resolve) => {
                setTimeout(async () => {
                  data.chapterErrorCount++;
                  console.log("Trying to Fix JSON...");

                  console.log("this is chapter text - " + data.chapterText.response.candidates[0].content.parts[0].text, typeof (data.chapterText.response.candidates[0].content.parts[0].text));

                  let fixMsg = `This JSON has an error when inputed to JsonLint. See the json, fix the error and return it to me: \n ${data.chapterText.response.candidates[0].content.parts[0].text}}`;
                  let result = await fixJsonWithPro(fixMsg);
                  resolve(result);
                }, ms);
              });
            };

            chapterText = await delay();
            console.log("This is the chapterText at delay() line: " + chapterText)
            data.chapterErrorCount = 0; // reset this. I only need the session to be terminated when we get 3 consecutive bad json
          }

          console.log("This is the chapterText at return line: " + chapterText)
          return chapterText; // as the parsed object
        };

        genChapterResult = await genChapter();
      } //end of each promptMe number

      await getDocxCode();

      async function getDocxCode(retry) {
        let docxJsRes;
        console.log("We have gotten to the getDocxCode() function");

        docxJsRes = await sendMessageWithRetry(() => mainChatSession.sendMessage(`${errorAppendMessage()}. This is time for you to generate the docxJS Code for me for this prompt number ${i + 1} batch, following this guide here, strictly: ${docxJsGuide()}.
        ${retry === true ? "And Oh lastly, there's something wrong with how you gave me your previous response. Please, follow my instructions as above to avoid that. This is IMPORTANT!" : ""}
        `));

        let modelRes = docxJsRes.response.candidates[0].content.parts[0].text;
        console.log("this is modelRes as text...: " + modelRes)

        let docxJs;
        try { // parse the purported array
          docxJs = JSON.parse(modelRes);
          console.log("Type of the docxJS is now: " + Array.isArray(docxJs) + " " + docxJs);

        } catch (error) {
          console.error("We got bad json from model. Fixing... : " + error);
          
          if (error.message.includes("Expected double-quoted property name in JSON") || error.message.includes("Unterminated")){
            
            // retry sending the message the initial request to generate the Docx JS, as the model didn't follow my initial instruction
            console.log("retrying getDocxCode with an arg of true");
            return await getDocxCode(true);
          } else {
            docxJs = await fixJsonWithPro(modelRes);
          }
          
        }

        // extract textRun object
        const sessionArr = [];
        console.log("Session Arr is an array? : " + Array.isArray(sessionArr) + sessionArr);
        console.log("DocxJS is an array? : " + Array.isArray(docxJs) + docxJs);

        docxJs.forEach(item => {
          sessionArr.push(item);
        });

        console.log("Session Arr is now: " + Array.isArray(sessionArr) + sessionArr);

        for (let j = 0; j < sessionArr; j++) { // pushing each of the number of times prompted to the sections.children
          const textRunObj = sessionArr[j].textRun; // gets the textRun obj;
          const paragraphObj = sessionArr[j].paragraph;
          console.log("This is the paragraphObj: " + paragraphObj + typeof (paragraphObj))
          // parse alignment as needed
          if (paragraphObj.alignment) {
            switch (paragraphObj.alignment.toLowerCase()) { // Handle case-insensitivity
              case "center":
                paragraphObj.alignment = AlignmentType.CENTER;
                break;
              case "end":
              case "right": // "end" is equivalent to "right"
                paragraphObj.alignment = AlignmentType.RIGHT;
                break;
              case "start":
              case "left": // "start" is equivalent to "left"
                paragraphObj.alignment = AlignmentType.LEFT;
                break;
              case "justified":
                paragraphObj.alignment = AlignmentType.JUSTIFIED;
                break;
              case "both":
                paragraphObj.alignment = AlignmentType.BOTH;
                break;
              case "distribute":
                paragraphObj.alignment = AlignmentType.DISTRIBUTE;
                break;
              case "mediumKashida":
                paragraphObj.alignment = AlignmentType.MEDIUM_KASHIDA;
              default:
                console.warn("Unknown alignment: ", paragraphObj.alignment);
                // default to start
                paragraphObj.alignment = AlignmentType.LEFT;

                break;
            }
          }

          // push new TextRun

          const childrenProp = data.populatedSections[data.current_chapter - 1];
          if (childrenProp.children) { // if it already exists, push subsequent data
            childrenProp.children.push(new Paragraph(paragraphObj));
          } else {
            childrenProp["children"] = [new Paragraph(paragraphObj)];
            console.log("Initialized children in sections");
          }


        } // end of pushing for one chapter batch




       // TODO Activate later if needed console.log("this is the type of the pushed supposed obj: " + typeof (data.populatedSections[data.current_chapter - 1]), data.populatedSections[data.current_chapter - 1])


      } // end of docxCode function
    

    } // end of each chapter




    // I saw this on MDN - We cannot use an async callback with forEach() as it does not wait for promises. It expects a sychronous operation - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach#:~:text=forEach()%20expects%20a%20synchronous%20function%20%E2%80%94%20it%20does%20not%20wait%20for%20promises.


    console.log(`DONE WITH CHAPTER ___: ${data.current_chapter}. ${data.current_chapter >= tableOfContents.length ? "Getting ready to create docx file" : `Moving to the next - Chapter ${data.current_chapter + 1}`}`);

    if (data.current_chapter === tableOfContents.length) { // initialize docx.js when we get to the last chapter
      console.log("Data.docx shall be created");
      initializeDocx();
    }
    data.current_chapter++;

  }

  finalReturnData.genAIChapters = generatedChapContent;

}


function getGenInstructions1() {
  return `Let us continue our generation. 
          On request, you shall be generating a docx.js code for me. That is, after generating the contents for a chapter, I shall prompt you to generate the equivalent docx.js object associated with it. This will help me turn the finished write up into a docx file for publication - Understand this while writing. The docx.js guildelines is listed below: 
            ${docxJsGuide()}`
}

function getGenInstructions2(subchapter) {
  const fill = `${subchapter === true ? "subchapter" : "chapter"}`;
  return `how many times will be enough for me to prompt you to get the best quality result? I mean, For example, if this ${fill} needs to be longer, me prompting you just once for this ${fill} will make the ${fill} very shallow. Therefore, the aim of this is for you to assess how long the ${fill} needs to be in order for the write-up to be quality while being non-repetitive. Return this response as json in this schema: {promptMe : number}`
}

function docxJsGuide(subChapter) {
  return `PROMPT FOR GENERATING DOCX OBJECT
- Do not add colons or semicolons after headings.
- Anything after '##' is the heading 1/Chapter title.
- Do not make quotes a heading.
- Always set the heading1 to 36 (represents 18px), heading2 to 32 (represents 16px), heading3 to 30  (represents 15px). The only time a body should have a set size on any TextRun Paragraph is when it is not a normal paragraph, eg footnotes (20), endnotes(20), etc.
- New chapters shall begin in new pages, with the title of that chapter being a heading1. This is the template for generating each chapter. Add other properties under the TextRun or Paragraph as needed. For example, making something bold or italics. Incorporate and breakdown large chunks of text into paragraphs as needed. I do not want the final book to be a huge chunky mess of text okay?

  The below is not a limitation but just a general template. Assuming you were served this text - "${data.sampleChapter()}", even though that was not the served text for this request; Your served text for this particular request is what you generated here - '${subChapter}'. (That's an edited version which I have edited to prevent it from looking AI and Redundant. That's what we are now working with.) Then you shall generate the docx.js template, using the guide that I shall specify.

You shall return an array json using this schema below as the template for this current prompting ONLY...You may add other styling inside the textRun as needed and as supported by Docx.Js : \n
 "${data.sampleDocxCode()}"

	- When starting a new sub-chapter, just write the heading for that subchapter(for e.g, '1.2 Subchapter name') and ignore the chapter name. But if that subchapter is the first subchapter in that chapter, add a heading1, which is the Chapter Title, as seen in our table of contents.
  - When you are just beginning every new chapter, it is absolutely important to add the chapter title as heading1.

  - Also, for each instance where I am prompting you, do not repeat your write-up from the last prompting before adding new write-up. Do not worry, I set up a way to join the last batch under a subchapter to its sequel okay? That is, even if your last writing from the last prompting was something like - ('...and on this, I shall build my', the next prompting, if any should continue without repeating the writeup '...and on this, I shall build my'. Instead, move on as - 'empire, and make sure that all my descendants ascend the throne of the Ring...') - The bracketed here means I am just giving you instructions. Do not go including that in the book.
g
  - Also, for each prompt I am giving you on each subchapter, You are not returning the same write up. That just leads to redundancy.
  Do not add font family at any level. Do not add size to non-heading TextRun, Only headings or non-normal body of the book.
  - Remember, if I give you a subchapter with "1.1 - subchapter name", the docx for it should have heading1 as chapter name coming before the heading2 for 1.1 or 2.1 or 3.1(You get). For other subchapters like 1.2 or 1.3(could be 2.2...2.n too-you get)...1.n(where n is not 1), don't add a heading1 of chapter name before them please`
}

async function getFixedContentAsJson (firstStageJson, generationConfig) {
  
      const jsonReturnModel = genAI.getGenerativeModel({model: "gemini-2.0-flash-exp", 
        systemInstruction: "Your Job is to remove the '```json' Identifier and return the given JSON to the user, untouched!"
      });
      const chatSession = jsonReturnModel.startChat(
        { safetySettings,
        generationConfig
        } 
        );
      
      const response = await chatSession.sendMessage(`So, You are to return the below in colon in JSON format, removing any outside text that's not JSON; \n\n "${firstStageJson}"
      \n
      Just so you know, your response should be in the schema of the JSON initially given to you, but in its fixed form.
      `);
      
      const returnValue = JSON.parse(response.response.candidates[0].content.parts[0].text);
      
      console.log(`Returning Value after conversion to application/json is : ${returnValue}`);
      
      return returnValue;
      
    }
    

async function fixJsonWithPro(fixMsg, retries = 0, errMsg) { 
  // function for fixing bad json with gemini pro model
  data.error.pro++; // counting the amount of errors that leads to using this jsonfixer
  const modelSelected = "gemini-2.0-flash-thinking-exp-1219";
  
//  console.log(`Selected ${modelSelected}`);
  
 //  console.log("Json to be fixed is ___" , fixMsg)
 
const fixerSchema = {
    description: "Fixed JSON Response", // Description of the schema
    type: "OBJECT", // The top-level type is OBJECT
    properties: {
      issue: {
        type: "STRING",
        description: "Description of the issue",
        nullable: true,
      },
      fixedJson: {
        type: "STRING",
        description: "The corrected JSON output as a string",
        nullable: false, 
      },
    },
    required: ["issue", "fixedJson"], // Required properties
  }

  const generationConfig = {
    temperature: 0.7,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: "application/json"
  };
  
  const generationConfigNoJson = {
    temperature: 1,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain"
  }

  

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  // Use thinking Model to Fix Bad JSON
  const thinkingModel = genAI.getGenerativeModel({
    model: modelSelected, 
    systemInstruction: `Outline all the problems in any json sent to you. There must be issues with it, since no good json will ever be sent to you. 

Then On Command, I will ask you to repair the json. With this command, assume this role => Your Job is to fix bad json and return the fixed one. Make sure you fix it before returning anything. This is because no good/Valid json will ever be sent to you in the first place.
    
Just so you know your response should be jn the schema of the JSON initially given to you, but in its fixed form. Don't try to explain anything outside the JSON. just return JSON response`
  });

  const jsonFixer = thinkingModel.startChat({ safetySettings, generationConfigNoJson });

  // confirm if this operation was successful
  
  try {
	  console.log("Initial Error Identified is : " + errMsg);
	  
    errMsg != 'undefined' ? console.log(`Error Message from Previous Function : ${errMsg}`) : null;
    
    const fixedRes = await jsonFixer.sendMessage(`${fixMsg}`); // Attempt to send message

    data.proModelErrors = 0; // Reset error count on success
    
    let firstStageJson = fixedRes.response.candidates[0].content.parts[1].text; // "parts[1]" gets the answer by model as text/plain response. "parts[0]" gets the thought process of model.
    
    console.log(`This is the fixedJSON as text/plain from Thinking Model:\n\n ${firstStageJson}`);  
    
    // Turn Fixed Content to Usable JSON with mimeType of "application/json" using GEMINI 1.5 PRO
    firstStageJson = await getFixedContentAsJson(firstStageJson, generationConfig); // Using Gemini Model that Supports JSON

    const fixedContent = firstStageJson; // Parse the stringified JSON
    
   // console.log("This is the fixedContent: ", fixedContent);
   
   console.log("CONTENT FIXED SUCCESSFULLY!")

    return fixedContent;

  } catch (error) {
    if (error.message.includes("Resource has been exhausted")) {
      // change the model back to gemini flash
      return fixJsonWithPro(fixMsg, retries = 0);
    } else if (retries < 8) {
      console.error(error, `Attempt ${retries + 1} failed. Retrying...`);

      const delayMs = modelDelay.pro;
      console.log(`Waiting ${delayMs / 1000} seconds before retrying...`); 
      await new Promise(resolve => setTimeout(resolve, delayMs));
      console.log(`This is error.message ${error.message}`);

      return fixJsonWithPro(fixMsg, retries + 1, error.message); // Recursive retry
    } else { 
      // Send an Error Message to Calling Function and Have it Retry the Request Afresh
      
      console.error("Failed to fix JSON after multiple retries:", error, "Resending the Message for Initial Content Generation");
      
      return "RetrySignal"
      
    }
  }
}

function writingPattern() {
  const stylesOfWriting = `Here are 30 tones that can be employed across different chapters of a book, depending on the subject matter, audience, and narrative goals:

### 1. Inquisitive
An inquisitive tone sparks curiosity, drawing the reader into a journey of exploration. It often begins with questions or observations that challenge conventional thinking.  

### 2. Reflective
A reflective tone allows the reader to pause and contemplate deeper meanings. It’s often used to share personal insights or universal truths.  

### 3. Optimistic
Optimism uplifts and encourages, highlighting possibilities even in challenging circumstances. It focuses on hope and forward momentum.  

### 4. Authoritative
An authoritative tone exudes confidence and provides clarity, ensuring the reader trusts the information or guidance.  

### 5. Conversational 
A conversational tone makes the writing feel personal, as though the author is directly speaking to the reader.  

### 6. Suspenseful
Suspense keeps readers on edge, drawing them into the scene with vivid details and unanswered questions.  

### 7. Humorous
Humor adds a light-hearted touch, making the narrative more engaging and relatable.  

### 8. Melancholic 
A melancholic tone evokes a sense of loss or bittersweet reflection, often touching the heart.  

### 9. Inspiring
An inspiring tone motivates and instills a sense of possibility, often through vivid imagery or uplifting examples.  

### 10. Critical 
A critical tone challenges assumptions and provokes thought, encouraging readers to question established ideas.  

### 11. Empathetic
An empathetic tone connects deeply with the reader's emotions, showing understanding and compassion.  

### 12. Nostalgic
A nostalgic tone takes the reader on a journey to the past, evoking fond memories or wistful longing.  

### 13. Cynical
A cynical tone questions motives and outcomes, often with a touch of irony or skepticism.  

### 14. Inspirational
Inspirational tones elevate the reader, often by emphasizing resilience, courage, and the human spirit.  

### 15. Romantic
A romantic tone is passionate and emotional, often highlighting beauty and desire.  

### 16. Ironic
An ironic tone highlights contradictions, often using humor or wit to make a point.  

### 17. Defiant
A defiant tone is bold and rebellious, challenging norms or authority with conviction.  

### 18. Playful 
A playful tone is light and fun, often using whimsy or humor to engage the reader.  

### 19. Tragic
A tragic tone evokes deep sorrow, often highlighting loss or unavoidable pain.  

### 20. Mysterious
A mysterious tone keeps readers intrigued, often hinting at hidden truths or secrets.  

### 21. Optimistic-Realistic
This tone strikes a balance between hope and practicality, acknowledging challenges but emphasizing possibility.  

### 22. Persuasive
A persuasive tone encourages the reader to embrace an idea or take action, appealing to logic and emotion.  

### 23. Skeptical
A skeptical tone questions assumptions and pushes the reader to think critically.  

### 24. Rebellious
A rebellious tone challenges societal norms and inspires bold action.  

### 25. Hopeful
A hopeful tone reassures the reader and highlights the potential for a better future.  

### 26. Philosophical
This tone invites readers to reflect on life’s bigger questions and explore abstract ideas.  

### 27. Enthusiastic 
An enthusiastic tone conveys excitement and energy, motivating the reader to engage fully.  

### 28. Witty
A witty tone uses clever humor and sharp insights to entertain while making a point.  

### 29. Anguished
An anguished tone communicates deep pain or inner turmoil, often evoking strong emotional resonance.  

### 30. Ethereal
An ethereal tone creates a dreamlike or otherworldly atmosphere, often blending reality with imagination.  

Here are 10 more tones, including more technical and specialized approaches:

---

### 31. Scientific
A scientific tone is objective, analytical, and precise, ideal for discussing research or evidence-based topics.  
*"According to recent studies, the phenomenon is attributable to a 25% increase in atmospheric CO2 levels, which accelerates the greenhouse effect. This correlation is statistically significant across multiple datasets."*

---

### 32. Analytical  
An analytical tone breaks down complex ideas into manageable parts, focusing on logic and structure.  
*"To understand the impact of this policy, we must consider its economic, social, and environmental implications. Each factor reveals distinct trade-offs."*

---

### 33. Technical 
A technical tone uses specialized language tailored for an audience familiar with the subject matter.  
*"The algorithm optimizes throughput by implementing dynamic load balancing, which reduces bottlenecks in high-traffic scenarios. This is achieved using a distributed hash table architecture."*

---

### 34. Formal  
A formal tone conveys professionalism and is often used in academic or official settings.  
*"This report aims to evaluate the efficacy of current methodologies in achieving stated objectives. It will present findings and propose actionable recommendations."*

---

### 35. Instructional
An instructional tone is direct and step-by-step, guiding the reader through a process or teaching a concept.  
*"To assemble the device, first connect the red wire to terminal A. Ensure the connection is secure before proceeding to the next step."*

---

### 36. Speculative
A speculative tone explores possibilities and "what if" scenarios, often blending fact and imagination.  
*"If humanity were to colonize Mars, how would our understanding of community and resource management evolve? Such an endeavor could redefine civilization as we know it."*

---

### 37. Journalistic
A journalistic tone is factual and unbiased, presenting information clearly and concisely.  
*"The hurricane made landfall early Tuesday morning, causing widespread power outages and displacing thousands. Officials estimate damages could exceed $2 billion."*

---

### 38. Imaginative
An imaginative tone stretches the boundaries of reality, creating vivid worlds or surreal possibilities.  
*"In this realm, gravity doesn’t hold sway; the rivers flow upward, and stars glimmer within reach of outstretched hands."*

---

### 39. Perspicacious
A perspicacious tone is insightful, shedding light on underlying truths or overlooked nuances.  
*"Beneath the apparent chaos lies a pattern—subtle yet undeniable—that reveals a deeper structure to what we often dismiss as random."*

---

### 40. Detached
A detached tone observes events or emotions from a distance, creating a sense of impartiality.  
*"The crowd surged forward, their shouts blending into an indistinct roar. Amidst the chaos, she stood motionless, watching with neither fear nor excitement."*

---

These tones expand the versatility of your writing, allowing you to navigate academic, professional, and creative, and various other contexts effectively. These tones can add even more depth and nuance to your writing, helping to shape your story’s emotional and thematic layers.`
  return stylesOfWriting;
}


function getAiPhrase() {
  return `Here's a consolidated list of words and phrases commonly associated with AI-generated text. Limit their use in my any of your writings to a great extent. Avoid them completely even:

General/Overused Words: Elevate, tapestry, leverage, journey, seamless, multifaceted, convey, beacon, testament, explore, delve, enrich, foster, binary, multifaceted, groundbreaking, pivotal, innovative, disruptive, transformative, reframing, reframe.

Overused Intensifiers/Adverbs: Very, really, extremely.

Generic Business Jargon: Leverage synergies, embrace best practices, drive growth, think outside the box, at the end of the day, moving forward, in the ever-evolving space of.

Vague/Abstract Language: Tapestry, journey, paradigm, spectrum, landscape (used metaphorically).

Academic-sounding Phrases: Delve into, interplay, sheds light, paves the way, underscores, grasps.

Clichéd Descriptions: Amidst a sea of information, rich tapestry, in today's fast-paced world.

Transitional Words: Accordingly, additionally, arguably, certainly, consequently, hence, however, indeed, moreover, nevertheless, nonetheless, notwithstanding, thus, undoubtedly, moreover, furthermore, additionally, in light of.

Adjectives: Adept, commendable, dynamic, efficient, ever-evolving, exciting, exemplary, innovative, invaluable, robust, seamless, synergistic, thought-provoking, transformative, utmost, vibrant, vital.

Nouns: Efficiency, innovation, institution, integration, implementation, landscape, optimization, realm, tapestry, transformation.

Verbs: Aligns, augment, delve, embark, facilitate, maximize, underscores, utilize.

Phrases: A testament to, in conclusion, in summary, it's important to note/consider, it's worth noting that, on the contrary, objective study aimed, research needed to understand, despite facing, today's digital age, expressed excitement, deliver actionable insights through in-depth data analysis, drive insightful data-driven decisions, leveraging data-driven insights, leveraging complex datasets to extract meaningful insights, notable works include, play a significant role in shaping, crucial role in shaping, crucial role in determining, so let us.

Conclusion Crutches: In conclusion, to sum up, all things considered, ultimately.

Awkward Idiom Use: Hit the nail on the head, cut to the chase, barking up the wrong tree, the elephant in the room.

Overeager Emphasis: It is important to note, crucially, significantly, fundamentally.

  Greetings/Apologies: Hello, sorry.`
}

async function genPlotMsg(plotChatSession, plotPrompt, sendMsgError, sendPlotMsg) {

  async function genPlotMsgMain() {
    try {
      console.log("TODO:Check if the plot prompt resolved as expected: " + plotPrompt);

      sendPlotMsg = await sendMessageWithRetry(() => plotChatSession.sendMessage(`${errorAppendMessage()}${plotPrompt}`));
      return sendPlotMsg;
    } catch (error) {
      // error sending message
      console.log("An error occured while trying to generate plot: " + error);

      if (sendMsgError < 3) {
        await genPlotMsgMain();
      } else {
        console.error("Could not generate Plot: " + error);
        sendMsgError = 0;
        throw Error
      }
      sendMsgError++;

    }

  }
  let response = await genPlotMsgMain();
  return response;
}

function checkAlternateInstruction(promptNo, i, selectedPattern, plot) {
  if (promptNo.promptMe > 1) {
    return `Since I am to prompt you ${promptNo.promptMe} times for this subchapter, and this is my number ${i + 1} prompt on this subchapter of ${promptNo.promptMe} prompt${promptNo.promptMe > 0 ? "s" : ""}, ${promptNo.promptMe !== 1 ? "Do not end this current batch as if you are done with it and moving to the next subchapter and do not end it like you are moving to a new subtopic. This is because you are writing at a continuous length for this subchapter. What do I mean by that? If your prompt maximum output stops at a sentence like - '...the empire state building made tremendous', then for the next batch, you will continue as - 'progress when rehabilitating the state of the nation...'. Do not include the last written batch. Just continue from there. " : ""}Your write-up should not be repetitive but still be long only as needed. You're free to write at whatever length you find appropriate for the batch writing.
    
    ${plot === true ? `Use this plot for every instance/batch of this subchapter to guide your writing of the subchapter - '${finalReturnData.plots[`chapter-${data.current_chapter}`][i]}` : ""} 
    ${promptNo.promptMe === i + 1 ? "Since this is the last batch of prompting under this subchapter, at the end of its content, conclude appropriately." : ""} Just know that for this subchapter and this batch, you must use this writing pattern : ${selectedPattern.pattern}. Also note that when writing, do not use any of these words or phrases: \n ${getAiPhrase()}`
  } else if (promptNo.promptMe === 1) return `Since I am prompting you for this subchapter only once, just end this like you would normally. ${plot === true ? `Use this plot for this subchapter to guide your writing of the subchapter - '${finalReturnData.plots[`chapter-${data.current_chapter}`][i]}` : ""} Just know that for this subchapter, you must use this pattern of writing: ${selectedPattern.pattern}. \n ${getAiPhrase()}`
}

function initializeDocx() {
  try {
    data.docx = new Document({
      styles: {
        default: {
          document: {
            run: {
              size: 26,
              font: "Calibri"
            }
          }
        }
      },
      sections: data.populatedSections
    })
    console.log(`Initialized! This is type of data.docx: ${typeof (data.docx)}`);


  } catch (error) {
    console.error("weird error while initializing docx code: " + error)
  }
}


async function compileDocx(userInputData) {
  Packer.toBuffer(data.docx).then((buffer) => {
    const formattedStr = getFormattedBookTitle(userInputData.title)
    fs.writeFileSync(`/tmp/${formattedStr}.docx`, buffer);
    console.log(`Document created successfully`);
    return formattedStr;
  });
};

function getFormattedBookTitle(title){
  let formattedStr = "";
  const lowercaseStr = title.toLowerCase();
  const newStrArr = lowercaseStr.split(" ");
  
  for (let i = 0; i < newStrArr.length; i++){
    if (i + 1 === newStrArr.length) {
      formattedStr += `${newStrArr[i]}`
    } else {
      formattedStr += `${newStrArr[i]}-`
    }
  }
  return formattedStr.trim();
}

const PORT = process.env.PORT
const HOST = process.env.HOST
app.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}/${PORT}`);
});
