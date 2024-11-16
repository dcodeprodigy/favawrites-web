"use strict"
const express = require('express');
const app = express();
const path = require('path');
// const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } = require('@google/generative-ai');
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
  Math,
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
  temperature: 0.7,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};

let data = {
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
    return `You are an API, designed to sound like a human book writer. You are also designed to use simple grammar and vocabulary, no matter what. Your tone must be "${userInputData.bookTone.trim()}". The genre of this book is "${userInputData.genre.trim()}" and the audience is "${userInputData.audience.trim()}".
    See added instructions for this book below, as provided by the user for you to write this book to their taste. Follow it strictly!: 
    "${userInputData.description.trim()}."
    
    Also, you must follow this behaviour when writing(Non-user Description):
    As a human book writer, you will be creating full-fledged books that reflect a writing style indistinguishable from human authorship by using simple english, no big words or grammar at all. Focus on prose style of writing, discouraging the use of bullet points as much as possible.

    # Steps

    1. Understand the Genre and Audience: The genre and target audience for the book has already been written above to you. Understand them and tailor your writing style, vocabulary, and themes appropriately.
    2. Plot Development: On request, develop a detailed plot outline for each chapter at a time, ensuring it has a captivating beginning, engaging middle, and satisfying conclusion.
    3. Character Creation: Create complex, relatable characters with motivations, flaws, and arcs that contribute to the story’s progression. This should be under the same string as the plot [For story books ONLY]
    4. Narrative Voice and Style: Choose a consistent narrative voice and style that feels authentically human, with attention to natural language patterns and expressions.
    5. Writing: Compose the text, focusing on authenticity, creativity, and richness of language to enhance human-like qualities - this means your writing should not use predictable words that sounds like a Large Language Model, which was just trained to spit out patterns was used.

    # Examples

    * [Example 1 Start]*: If writing a mystery novel, create an intriguing hook in the first chapter, such as a mysterious incident or a puzzle. These chapters must be detailed and long, just like a conventional novel chapter.
    * [Example 1 Additional Detail]*: Develop clues and red herrings throughout the chapters, leading to a surprising yet satisfying resolution.
    * [Continuation of Example 1]*: Ensure character interactions and dialogue are nuanced and reflective of real human experiences, contributing to the mystery's unfolding - in cases of novels or fiction works.
    * [Example 1 End]*

    (Each book example should be a comprehensive and unique storyline, marked by creativity, and should reflect the length and complexity of a real novel.).
    
    THE USER PROVIDED DESCRIPTION IS THE MAIN INSTRUCTIONS FOR WRITING AS IT IS WHAT THIS PARTICULAR USER WANTS. ALSO REMEMBER TO USE SIMPLE VOCABULARY AND GRAMMAR AND WRITE IN PROSE FORM, ALWAYS DISCOURAGING THE USE OF BULLET POINTS.
    Don't use the following words, ever - Delve or Delve deeper, Unleashing, Sarah, Alex or other generic names. Always use real american names whenever you need a new name. Never use words like a confetti Cannon, Confetti, Cannon, delve, safeguard, robust, symphony, demystify, in this digital world, absolutely, tapestry, mazes, labyrinths, incorporate.

    In any of your responses, never you include the following: \n \n ${getAiPhrase()}
    `
  },
  current_chapter: 1,
  proModelErrors: 0,
  sampleChapter: function () {
    return `## Day 1: The Fresh Start
**Quote:** "The first step towards getting somewhere is to decide you're not going to stay where you are." - J.P. Morgan

**Author's Reflection:**  J.P. Morgan's words capture the very essence of a fresh start.  It's not enough to simply *wish* for change; we must actively choose to move, to shift, to begin. Today, on the first day of January, we stand at this crucial juncture. The past is behind us, a mixture of triumphs and stumbles, and the future stretches before us, full of potential.  This potential, however, remains dormant until we decide, definitively, to step away from our current position – whether that’s a bad habit, a limiting belief, or a stagnant routine.

Many of us set ambitious New Year's resolutions, fueled by the energy of a fresh start. But how do we ensure that this initial spark doesn't fizzle out? The key is to recognize that grand transformations are built upon small, consistent actions. Don't aim to overhaul your entire life overnight. Instead, focus on identifying one specific area you want to improve and take a single, concrete step in that direction.  If you want to exercise more, don't sign up for a marathon on day one. Start with a 15-minute walk. If you're aiming to eat healthier, replace one unhealthy snack with a piece of fruit.  These seemingly minor actions create momentum, building self-discipline and paving the way for lasting change.

One of the biggest pitfalls in pursuing new goals is the tendency to get overwhelmed. We envision the entire journey ahead and become discouraged by its perceived magnitude.  The antidote? Stay present.  Focus solely on the task at hand, on the small step you're taking *today*.  Don't worry about next week or next month. Just be here, now, committed to the present action.  Remember, the longest journey begins with a single step, and each step you take brings you closer to your destination.

**Reader's Reflection:** What is one small, concrete step you can take today to move towards a goal you've set for yourself? Write it down, commit to it, and celebrate its completion.  How does taking this first step make you feel?"`
  },
  sampleDocxCode: function () {
    return `[
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
  toc: `{
    "title": "The Title of the book I told you, exactly as i did",
    "subtitle" : "Generate a suitable subtitle to the title and place it here.",
    "plot" : "true or false",
    "subchapter" : "true or false",
    "toc" : [

        {"ch-1": "the title of the first chapter", "sch-2 or sch-3 or sch-4. Th number after sch- is gotten from th current chapter. If we were in chapter 30, then you just return sch-30": ["1.1 subchapter 1 title", "1.2 subchapter 2 title", "1.3 subchapter 3 title", "1.4 subchapter 4 title"], "sch-no": "here, input the number of sub chapters you added in this chapter strictly as a number, not a string. This helps me access this toc for promoting later on. For example, if you included 7 subchapters the value must be a number '7' "},

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




const finalReturnData = {}; // An object for collecting data to be sent to the client

// save the original data Object so that we can easily reset it to defailt when returning res to user. This should prevent subsequent request from using the data from a previous session
let originalDataObj;
function saveOriginalData() {
  originalDataObj = data;
}
saveOriginalData();

app.post("/generate_book", async (req, res) => {
  // const originalDataObj = data;

  try {
    const userInputData = req.body;
    data.resParam = res;
    // const systemInstruction = data.systemInstruction(userInputData);

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001", systemInstruction: data.systemInstruction(userInputData) });
    data["model"] = model; // Helps us access this model without having to pass numerous arguments and params
    const mainChatSession = model.startChat({ safetySettings, generationConfig });
    const tocPrompt = getTocPrompt(userInputData);
    const tocRes = await mainChatSession.sendMessage(tocPrompt);
    console.log("This is the model response as an object: \n" + parseJson(tocRes));
    finalReturnData["firstReq"] = parseJson(tocRes);; // Push to final object as an object not a json string
    finalReturnData.plots = {}; // Creates the 'plots' property here to avoid overriding previously added prompts in the loop for generating plots
    data["chatHistory"] = await mainChatSession.getHistory();


    // Next, begin creating each chapter's plot
    console.log(typeof (JSON.parse(finalReturnData.firstReq.plot)));
    data.plot
    if (JSON.parse(finalReturnData.firstReq.plot) === true) {
      await generatePlot(); // only generate a plot if the model deems it fit. That is, if this is a novel
    }
    // next, generate the write-up for the subchapters using the plots. At the same time, with each iteration, prompt the model to insert the chapter generated into the "Docx" creator so that after each chapter iteration, we generate the entire book and save to the file system/send the book link to the user.
    await generateChapters(mainChatSession);

    await compileDocx(userInputData);
    finalReturnData.file = `/docs/${userInputData.title}.docx`;
    finalReturnData.docxCode = data.docx;
    res.send(finalReturnData);

    // Next, using the plots to guide the AI to generate chapters

  } catch (error) {
    console.error("This is the data.docx: "+ data.docx)
    console.log("This is the data.populatedSections: " + data.populatedSections)

    if (!data.postErr) {
      data.postErr = []
    }
    data.postErr.push(error);
    console.log(data.postErr)
    res.status(200).send(data);
  } finally {
    data = originalDataObj
  }

});

function getTocPrompt(inputData) {
  console.log(inputData);
  return `Generate a comprehensive table of contents for a book titled ${inputData.title.trim()}. ${checkForSubtitle(inputData)}.
  In your response, if this book is a novel or one that you think deserves a plot, respond with "true" as a boolean and if it does not, respond with "false" as a boolean.
  Also in your response, if you think this book deserves a subchapter in the titles, then respond with "true" to the "subchapter" property. Else, go with false.
    
    Finally, Return your response in this schema: ${schema.toc}`
}

function checkForSubtitle(userInput) {
  const subtitle = userInput.subtitle.trim();
  if (subtitle !== "") {
    return `Add this subtitle to your response: ${subtitle}`
  } else {
    return `In your response, include a suitable subtitle that will cause anyone who sees this in an amazon kdp book listing to want to click on it. Use simple grammar and vocabulary. Make sure the subtitle follows the amazon kdp rules for subtitles as specified here : \n\n ${data.kdp_titles_subtitle_rules}.`
  }
}

function parseJson(param) {
  const repairedJSON = jsonrepair(param.response.text()); // firstly, repair the param, if needed
  return JSON.parse(repairedJSON);
}


async function generatePlot() {

  const tableOfContents = finalReturnData.firstReq.toc; // get the table of contents, just to obey DRY principle
  data["tableOfContents"] = tableOfContents;

  console.log(tableOfContents);
  const config = {
    temperature: 0.8,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8100,
    responseMimeType: "application/json",
    responseSchema: schema.myPlotSchema
  };
  const plotChatSession = data.model.startChat({ history: data.chatHistory, safetySettings, generationConfig }); // The Model here is from the 'model' we pushed to the 'data' object after creaing the toc. Doing this so that I can simply create a new chat, if i need to use a neew schema. This way, I can simply just slap-in the needed history from previous chats, like I did here.
  data.plots = []; // for the plots to be generated, if any

  for (let i = 0; i < finalReturnData.firstReq.chapters; i++) {
    if (tableOfContents[data.current_chapter - 1]["sch-no"] !== 0) { // checks if there are subchapters available
      await continuePlotGeneration(tableOfContents, plotChatSession, config);
      if (i === finalReturnData.firstReq.chapters - 1) {
        data.current_chapter = 1; // Return the current chapter count to one, to be used when generating the contents
      } else {
        data.current_chapter++;
      }
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
    console.log("Index.plot has a type of : " + typeof (index.plot));
    console.log("This is the index: " + index)
    finalReturnData.plots[`chapter-${data.current_chapter}`].push(index.plot);

  }

}


async function sendDelayedMessage(plotChatSession, plotPrompt, config) {

  async function promptModel(retry, tryAgainMsg) {
    try {
      let result;
      if (retry) { // tell the model to repair its previous json response in this plotSession
        result = await plotChatSession.sendMessage(tryAgainMsg, { generationConfig: config });
      } else {
        result = await plotChatSession.sendMessage(plotPrompt, { generationConfig: config });
      }

      console.log(`This is the 'result' for plot generation ${result.response}`);

      let possibleParsedData;

      try {
        console.log("This is the result's value. it should be the plot generated" + result.response.candidates[0].content.parts[0].text.trim());
        possibleParsedData = JSON.parse(result.response.candidates[0].content.parts[0].text.trim());

        // checks to see if model response json is valid. If yes, we have already gotten the json we asked the model to generate. So, no need trying to get that after returning this 'sendDelayedMessage' function. If not valid. retry the same plot till we get a valid json.

      } catch (error) {
        // checks to catch any syntax errors in the JSON, then tell model to retry
        console.log(error);
        possibleParsedData = await new Promise((resolve) => {
          setTimeout(async () => {
            const result = await promptModel(true, `The previous json had an error: '${error}'. Repair it and return the corrected one.`);
            resolve(result);
          }, 5000);
        });


      }
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


async function generateChapters(mainChatSession) {
  // using the main chatSession
  const tableOfContents = finalReturnData.firstReq.toc;
  const generatedChapContent = [];
  data.populatedSections = [];
  console.log("Created data.populatedSections")

  if (!data.plots) { // code to run if there is not plot
    data.chapterErrorCount = 0;

    // run a loop for each chapter available
    for (let i = 1; i <= tableOfContents.length; i++) {

      // create the object in data.populatedSections. That is, add a new object for a new chapeter for each loop
      data.populatedSections.push({ properties: { pageBreakBefore: true } });

      let promptNo = await mainChatSession.sendMessage(`Let us continue our generation. 
        On request, you shall be generating a docx.js code for me. That is, after generating the contents for a chapter, I shall prompt you to generate the equivalent docx.js object associated with it. This will help me turn the finished write up into a docx file for publication - Understand this. The docx.js guildelines is listed below: 
        ${docxJsGuide()}.
        Now you are writing for this chapter, ${tableOfContents[data.current_chapter - 1][`ch-${data.current_chapter}`]}, how many times will be enough for me to prompt you to get the best quality result? I mean, For example, if this chapter needs to be longer, me prompting you just once for this chapter will make the chapter very shallow. Therefore, the aim if this is for you to assess how long the chapter needs to be in order for the write-up to be quality. Return this response as json in this schema: {promptMe : number}`);

      console.log("Prompt me " + promptNo.response.candidates[0].content.parts[0].text + "times for this chapter");
      console.log(`${tableOfContents[data.current_chapter - 1][`ch-${data.current_chapter}`]}`);
      console.log(`Uhm, this is the chapter number used, if that helps: ${tableOfContents[data.current_chapter - 1][`ch-${data.current_chapter}`]}`);

      let writingPatternRes;
      try {
        async function sendWritingStyleReq () {
          writingPatternRes = await mainChatSession.sendMessage(`Give me a json response in this schema : {"pattern":"the selected pattern"}. From the listed book writing pattern, choose the writing style tha shall be suitable for this chapter. I am doing this to prevent you from using just one book writing tyle throughout and to avoid monotonous writing. These are the available writing patterns...Choose one that is suitable for this current chapter ${tableOfContents[data.current_chapter - 1][`ch-${data.current_chapter}`]} and return your response in the schema: {"pattern":"the selected pattern, alongside the examples as in the available patterns"}. The patterns available are: \n ${writingPattern()}.`);
        }
        await sendWritingStyleReq();
      } catch (error) {
        console.error("Error in Sending message to model at writingPatternRes: " + error);
        await delay()

        async function delay(ms = 6000) {
          return await new Promise((resolve) => {
            setTimeout(async () => {
              console.log("Reaching Model Again");
              let result = await sendWritingStyleReq()
              resolve(result);
            }, ms);
          });
        };
      }

      console.log(writingPatternRes.response.candidates[0].content.parts[0].text);
      let selectedPattern = writingPatternRes.response.candidates[0].content.parts[0].text;
      if (selectedPattern){
        try {
          let fixedJsonPattern = JSON.parse(selectedPattern);
          selectedPattern = fixedJsonPattern;
          
        } catch (error) {
          console.error("Could not parse selectedPattern - Fixing: " + error)
          selectedPattern = fixJsonWithPro(selectedPattern)
        }

      } else {
        selectedPattern = "You just choose one suitable one with example writeup"
      }


      // generate the chapter for the number of times the model indicated
      promptNo = JSON.parse(promptNo.response.candidates[0].content.parts[0].text);

      for (let i = 0; i < promptNo.promptMe; i++) {
        // let genChapter;
        async function genChapter(retry, tryAgainMsg) {
          let chapterText;

          function checkAlternateInstruction() {
            if (promptNo.promptMe > 1) {
              return `Since I am to prompt you ${promptNo.promptMe} times, do not end this current batch as if you are done with it and moving to the next chapter - This instruction is very important. This is my number ${i + 1} prompt on this chapter of ${promptNo.promptMe}. ${promptNo.promptMe === i + 1 ? "Since this is the last batch of prompting under this chapter, at the end of its content, conclude appropriately." : ""} Just know that for this chapter and this batch, you must use this writing pattern : ${selectedPattern.pattern}`
            } else if (promptNo.promptMe === 1) return `Since I am prompting you for this chapter only once, just end this like you would normally. Just know that for this chapter, you must use this pattern of writing: ${selectedPattern.pattern}`
          }

          try {
            const getChapterCont = await mainChatSession.sendMessage(`You said i should prompt you ${promptNo.promptMe} times. ${checkAlternateInstruction()}.  Return res in this json schema: {"content" : "text"}. You are not doing the docx thing yet. I shall tell you when to do that. For now, the text you are generating is just plain old text. `);

            chapterText = getChapterCont;
            data.chapterText = getChapterCont;

            console.log("this is the type of data.chapterText: " + typeof (data.chapterText))

          } catch (error) {
            console.error("An error in mainChatSession: " + error);
            genChapter();
          }

          try {
            console.log("This is chapter text: " + data.chapterText);
            let parsedChapterText = await JSON.parse(data.chapterText.response.candidates[0].content.parts[0].text);
            console.log("Json parsed");
            chapterText = await parsedChapterText; // doing this so that we can access chapter text from model if there is an error at the line above. This is because this line will not run if the above produces an error.

          } catch (error) {
            if (data.chapterErrorCount >= 3) {
              return data.resParam.status(200).send("Model Failed to Repair Bad JSON. Please start another book create Session.");
            }

            console.log("Parse error occured in generated chapter; retrying in 6 secs: " + error);

            async function delay(ms = 6000) {
              return await new Promise((resolve) => {
                setTimeout(async () => {
                  data.chapterErrorCount++;
                  console.log("Trying to Fix JSON...");
                  // let result = await genChapter(true, `This JSON has an error when inputed to JsonLint. See the json, fix the error and return it to me: \n `);

                  console.log("this is chapter text - " + data.chapterText.response.candidates[0].content.parts[0].text, typeof (data.chapterText.response.candidates[0].content.parts[0].text));

                  let fixMsg = `This JSON has an error when inputed to JsonLint. See the json, fix the error and return it to me: \n ${data.chapterText.response.candidates[0].content.parts[0].text}}`;
                  data.fixJsonMsg = fixMsg;
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
        const genChapterResult = await genChapter();
        await getDocxCode();

        async function getDocxCode() {
          let docxJsRes; 

          docxJsRes = await mainChatSession.sendMessage(`This is time for you to generate the docxJS Code for me for this prompt number ${i + 1} batch, following this guide: ${docxJsGuide()}`);

          let modelRes = docxJsRes.response.candidates[0].content.parts[0].text;
          // console.log("this is model res: " + modelRes)

          let docxJs;
          try { // parse the purported array
            docxJs = JSON.parse(modelRes);
            console.log("type of the docxJS is now: " + typeof (docxJs) + " " + docxJs);

          } catch (error) {
            console.error("We got bad json from model. Fixing... : " + error);
            docxJs = await fixJsonWithPro(modelRes);
          }

          // extract textRun object
          const sessionArr = [];
          console.log("Session Arr is an array? : "+ Array.isArray(sessionArr) + sessionArr);
          console.log("DocxJS is an array? : "+ Array.isArray(docxJs) + docxJs)
          docxJs.forEach(item => {
            sessionArr.push(item)
          })
          console.log("Session Arr is now: "+ Array.isArray(sessionArr) + sessionArr)
          sessionArr.forEach(item => {
            const textRunObj = item.textRun; // gets the textRun obj;
            const paragraphObj = item.paragraph;
            console.log("This is the paragraphObj: " + paragraphObj + typeof(paragraphObj))
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
                case  "mediumKashida":
                  paragraphObj.alignment = AlignmentType.MEDIUM_KASHIDA;
                default:
                  console.warn("Unknown alignment: ", paragraphObj.alignment);
                  // default to start
                  paragraphObj.alignment = AlignmentType.LEFT;
                  
                  break;
              }
            }

            // push new TextRun
            paragraphObj.children.push(new TextRun(textRunObj));
            // use conditionals to create children or push to it when already created
            if (i === 0) { // create the children array
              data.populatedSections[data.current_chapter - 1].children = [new Paragraph(paragraphObj)]

            } else data.populatedSections[data.current_chapter - 1].children.push(new Paragraph(paragraphObj))

          })


            console.log("this is the type of the pushed supposed obj: " + typeof(data.populatedSections[data.current_chapter - 1]), data.populatedSections[data.current_chapter - 1])
          

        }


        console.log("started delay for chapter pushing");

        await delayChapPush(generatedChapContent, genChapterResult, i);
      }

      if (data.current_chapter === tableOfContents.length) { // initialize docx.js when we get to the last chapter
        console.log("Data.docx shall be created");
        initializeDocx();
      }
      console.log(`Done with chapter ${data.current_chapter}. ${data.current_chapter >= tableOfContents.length ? "Getting ready to create docx file" : "Moving to the next chapter"}`)
      data.current_chapter++;
    }
  }
  finalReturnData.genAIChapters = generatedChapContent;
}



function docxJsGuide() {
  return `PROMPT FOR GENERATING DOCX OBJECT
- Do not add colons or semicolons after headings.
- Anything after '##' is the heading 1/Chapter title.
- Do not make quotes a heading.
- Always set the heading1 to 40 (represents 20px), heading2 to 36 (represents 18px), heading3 to 32  (represents 16px), heading4 to 28 (represents 14px). The only time a body should have a set size on any TextRun Paragraph is when it is not a normal paragraph, eg footnotes (20), endnotes(20), etc.
- New chapters shall begin in new pages. This is the template for generating each chapter. Add other properties under the TextRun or Paragraph as needed - this is the available docx.js method from my code. Do not go outside it so things won't break. Utilize it as much as possible too : "const {
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
  Math,
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
} = require("docx");"

  The below is is not a limitation but just a general template. Assuming you were served this text to generate the docx.js template:
"${data.sampleChapter()}".
You shall return an array json using this schema below as the template for this current prompting ONLY...You may add other styling inside the textRun as needed and as supported by Docx.Js : \n
 "${data.sampleDocxCode()}"

	
Do not add font family at any level. Do not add size to non-heading TextRun, Only headings or non-normal body of the book`
}

async function fixJsonWithPro(fixMsg) { // function for fixing bad json with gemini pro model
  if (data.proModelErrors >= 5) {
    data.res.status(501).send("Model Failed to fix Json after numerous retries. Try again later");
    return "Model Failed to fix Json after numerous retries. Try again later, please."
  }
  const generationConfig = {
    temperature: 0.5,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: "application/json",
  };
  const fixerSchema = `{"fixedJson" : "The fixed JSON"}`;
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const proModel = genAI.getGenerativeModel({ model: "gemini-1.5-pro", systemInstruction: `Your Job is to fix bad json and return the fixed one. Make sure you fix it before returning anything. This is because no good/Valid json will be sent to you in the first place. Your response schema must be in this schema ${fixerSchema}` });

  const jsonFixer = proModel.startChat({ safetySettings, generationConfig });

  // confirm if this operation was successful
  try {
    let fixedRes;
    async function delay(ms = 30000) {
      return await new Promise((resolve) => {
        setTimeout(async () => {
          console.log("30s delay ended");
          fixedRes = await jsonFixer.sendMessage(fixMsg);
          resolve(fixedRes)
        }, ms); // delay for 30 seconds due to proModel Limitations

      })


    }
    await delay();
    console.log(fixedRes.response.candidates[0].content.parts[0].text);
    const firstStageJson = JSON.parse(fixedRes.response.candidates[0].content.parts[0].text);
    const secondStageJson = JSON.parse(firstStageJson.fixedJson);

    console.log(`Pro Model Fixed our Json. The Json is now : ${secondStageJson}`);
    // reset error count before returning successful fix
    data.proModelErrors = 0;
    return secondStageJson;
  } catch (error) {
    data.proModelErrors++;
    console.log("Pro Model failed to fix our Json, trying again...");
    return await fixJsonWithPro(fixMsg);
  }
}

function writingPattern(){
  const stylesOfWriting = `Here are 30 tones that can be employed across different chapters of a book, depending on the subject matter, audience, and narrative goals:

### 1. **Inquisitive**  
An inquisitive tone sparks curiosity, drawing the reader into a journey of exploration. It often begins with questions or observations that challenge conventional thinking.  
*"Have you ever wondered why some people thrive under pressure while others crumble? Is it luck, strategy, or something more profound? Let’s uncover what lies beneath the surface."*

### 2. **Reflective**  
A reflective tone allows the reader to pause and contemplate deeper meanings. It’s often used to share personal insights or universal truths.  
*"Looking back on those days, I see more clearly now. Every failure wasn’t just a setback but a lesson, shaping who I was becoming. Sometimes, the hardest paths lead to the most fulfilling destinations."*

### 3. **Optimistic**  
Optimism uplifts and encourages, highlighting possibilities even in challenging circumstances. It focuses on hope and forward momentum.  
*"The road ahead may be uncertain, but every step brings us closer to something extraordinary. With persistence and faith, even the smallest actions can create monumental change."*

### 4. **Authoritative**  
An authoritative tone exudes confidence and provides clarity, ensuring the reader trusts the information or guidance.  
*"Here’s the truth: success doesn’t come by chance. It’s the result of consistent habits, deliberate action, and the ability to learn from failure. These principles aren’t optional; they’re foundational."*

### 5. **Conversational**  
A conversational tone makes the writing feel personal, as though the author is directly speaking to the reader.  
*"Let’s be honest—we’ve all been there. That moment when you’re staring at the ceiling, wondering where it all went wrong. Don’t worry; it’s not the end. It’s just the beginning of something better."*

### 6. **Suspenseful**  
Suspense keeps readers on edge, drawing them into the scene with vivid details and unanswered questions.  
*"The footsteps grew louder, echoing in the empty hall. Her breath quickened, but she didn’t dare turn around. Something was there—watching, waiting."*

### 7. **Humorous**  
Humor adds a light-hearted touch, making the narrative more engaging and relatable.  
*"I tried to follow the yoga instructor’s advice to 'breathe deeply,' but all I could think about was not face-planting into my mat. Apparently, inner peace isn’t my strong suit."*

### 8. **Melancholic**  
A melancholic tone evokes a sense of loss or bittersweet reflection, often touching the heart.  
*"The letter sat unopened on the table, its edges worn from months of hesitation. What could have been was now just a memory, lingering like a shadow."*

### 9. **Inspiring**  
An inspiring tone motivates and instills a sense of possibility, often through vivid imagery or uplifting examples.  
*"When the storm finally passed, the sun emerged, bathing the world in a golden glow. It was a reminder that even after the darkest nights, there’s always a new dawn."*

### 10. **Critical**  
A critical tone challenges assumptions and provokes thought, encouraging readers to question established ideas.  
*"It’s easy to accept trends at face value, but have we stopped to consider their consequences? Beneath the shiny exterior lies a complex web of challenges we can’t afford to ignore."*

### 11. **Empathetic**  
An empathetic tone connects deeply with the reader's emotions, showing understanding and compassion.  
*"I know it feels overwhelming right now, like the weight of the world is on your shoulders. But even in your darkest moments, you’re not alone. You’re stronger than you believe."*

### 12. **Nostalgic**  
A nostalgic tone takes the reader on a journey to the past, evoking fond memories or wistful longing.  
*"The scent of rain on dry soil brought me back to childhood summers, running barefoot under stormy skies. Those days felt endless, each moment brimming with possibility."*

### 13. **Cynical**  
A cynical tone questions motives and outcomes, often with a touch of irony or skepticism.  
*"Sure, they promised change, but doesn’t it always end the same? Big words, bold promises, and we’re left cleaning up the mess."*

### 14. **Inspirational**  
Inspirational tones elevate the reader, often by emphasizing resilience, courage, and the human spirit.  
*"The odds were impossible, the obstacles unrelenting, but they didn’t stop. Each step forward was a victory, proving that limits are just illusions."*

### 15. **Romantic**  
A romantic tone is passionate and emotional, often highlighting beauty and desire.  
*"Her laughter danced through the air like music, weaving a spell he couldn’t resist. In that moment, everything else faded away—there was only her."*

### 16. **Ironic**  
An ironic tone highlights contradictions, often using humor or wit to make a point.  
*"He spent years climbing the corporate ladder, only to discover it was leaning against the wrong wall."*

### 17. **Defiant**  
A defiant tone is bold and rebellious, challenging norms or authority with conviction.  
*"They told me to stay quiet, to follow the rules. But rules were made to be broken, and silence isn’t my strength."*

### 18. **Playful**  
A playful tone is light and fun, often using whimsy or humor to engage the reader.  
*"If cats could talk, they’d probably demand royalties for every viral video. Honestly, they’re the real influencers."*

### 19. **Tragic**  
A tragic tone evokes deep sorrow, often highlighting loss or unavoidable pain.  
*"He stood by the graveside, the words he’d left unsaid echoing louder than any eulogy. It was too late now—too late to fix what was broken."*

### 20. **Mysterious**  
A mysterious tone keeps readers intrigued, often hinting at hidden truths or secrets.  
*"The old key sat in her palm, its intricate design whispering of secrets long buried. What door did it open—and what lay beyond?"*

Sure, here are 10 additional tones you can use for variety in a book:

### 21. **Optimistic-Realistic**  
This tone strikes a balance between hope and practicality, acknowledging challenges but emphasizing possibility.  
*"The journey will be hard—no shortcuts, no guarantees. But with each small win, you’ll see it’s worth every step."*

### 22. **Persuasive**  
A persuasive tone encourages the reader to embrace an idea or take action, appealing to logic and emotion.  
*"You can keep waiting for the right time, but here’s the truth: the right time is now. Every moment you delay is an opportunity missed."*

### 23. **Skeptical**  
A skeptical tone questions assumptions and pushes the reader to think critically.  
*"They say money buys happiness, but does it? Or does it just buy distractions that mask what’s really missing?"*

### 24. **Rebellious**  
A rebellious tone challenges societal norms and inspires bold action.  
*"Who decided we have to follow their rules? Maybe it’s time we write our own story, on our own terms."*

### 25. **Hopeful**  
A hopeful tone reassures the reader and highlights the potential for a better future.  
*"Even when the world feels broken, there’s always a chance to rebuild. Tomorrow holds more promise than you think."*

### 26. **Philosophical**  
This tone invites readers to reflect on life’s bigger questions and explore abstract ideas.  
*"What if time isn’t something we lose, but something we create? Perhaps the problem isn’t running out of it but not understanding it."*

### 27. **Enthusiastic**  
An enthusiastic tone conveys excitement and energy, motivating the reader to engage fully.  
*"This is it—the moment you’ve been waiting for! Everything you’ve done has led to this, and the best is yet to come."*

### 28. **Witty**  
A witty tone uses clever humor and sharp insights to entertain while making a point.  
*"They say patience is a virtue, but whoever said that clearly never stood in line for coffee during rush hour."*

### 29. **Anguished**  
An anguished tone communicates deep pain or inner turmoil, often evoking strong emotional resonance.  
*"The words stuck in her throat, each one a blade she couldn’t bear to release. How do you say goodbye when you don’t want to let go?"*

### 30. **Ethereal**  
An ethereal tone creates a dreamlike or otherworldly atmosphere, often blending reality with imagination.  
*"The light filtered through the mist, painting the world in shades of gold and silver. Time seemed to stand still, as if the universe held its breath."*

These tones can add even more depth and nuance to your writing, helping to shape your story’s emotional and thematic layers.`
  return stylesOfWriting;
}

function makeValidJS(str) {
  try {
    const validJs = eval(str); // makes the string an executable array
    return validJs;

  } catch (error) {
    console.error("Failed to Make code executable: " + error);
    return null;
  }
}

async function delayChapPush(generatedChapContent, genChapterResult, i, ms = 6000) { // pushing generated chapter to final return data
  return await new Promise((resolve) => {
    setTimeout(async () => {
      console.log("ended delay");
      if (!generatedChapContent[`chapter${data.current_chapter}`]) {
        resolve(generatedChapContent.push({ [`chapter${data.current_chapter}`]: genChapterResult.content }));
        // console.log(genChapterResult.content);
      } else {
        resolve(generatedChapContent[data.current_chapter - 1][`chapter${data.current_chapter}`].concat(`\n \n ${genChapterResult.content}`));
        console.log(generatedChapContent[data.current_chapter - 1][`chapter${data.current_chapter}`]);
      }
      console.log(`pushed batch ${i+1} of chapter ${data.current_chapter} to finalReturnData `);
    }, ms);
  });
};

function getAiPhrase() {
  return `Here's a consolidated list of words and phrases commonly associated with AI-generated text. Limit their use in my any of your writings to a great extent. Avoid them completely even:

General/Overused Words: Elevate, tapestry, leverage, journey, seamless, multifaceted, convey, beacon, testament, explore, delve, enrich, foster, binary, multifaceted, groundbreaking, pivotal, innovative, disruptive, transformative.

Overused Intensifiers/Adverbs: Very, really, extremely.

Generic Business Jargon: Leverage synergies, embrace best practices, drive growth, think outside the box, at the end of the day, moving forward, in the ever-evolving space of.

Vague/Abstract Language: Tapestry, journey, paradigm, spectrum, landscape (used metaphorically).

Academic-sounding Phrases: Delve into, interplay, sheds light, paves the way, underscores, grasps.

Clichéd Descriptions: Amidst a sea of information, rich tapestry, in today's fast-paced world.

Transitional Words: Accordingly, additionally, arguably, certainly, consequently, hence, however, indeed, moreover, nevertheless, nonetheless, notwithstanding, thus, undoubtedly, moreover, furthermore, additionally, in light of.

Adjectives: Adept, commendable, dynamic, efficient, ever-evolving, exciting, exemplary, innovative, invaluable, robust, seamless, synergistic, thought-provoking, transformative, utmost, vibrant, vital.

Nouns: Efficiency, innovation, institution, integration, implementation, landscape, optimization, realm, tapestry, transformation.

Verbs: Aligns, augment, delve, embark, facilitate, maximize, underscores, utilize.

Phrases: A testament to, in conclusion, in summary, it's important to note/consider, it's worth noting that, on the contrary, objective study aimed, research needed to understand, despite facing, today's digital age, expressed excitement, deliver actionable insights through in-depth data analysis, drive insightful data-driven decisions, leveraging data-driven insights, leveraging complex datasets to extract meaningful insights, notable works include, play a significant role in shaping, crucial role in shaping, crucial role in determining.

Conclusion Crutches: In conclusion, to sum up, all things considered, ultimately.

Awkward Idiom Use: Hit the nail on the head, cut to the chase, barking up the wrong tree, the elephant in the room.

Overeager Emphasis: It is important to note, crucially, significantly, fundamentally.

  Greetings/Apologies: Hello, sorry.`
}

function initializeDocx () {
  try {
    data.docx = new Document({
      styles: {
        default: {
          document: {
            run: {
              size: 26,
              font: "Georgia"
            }
          }
        }
      },
      sections: data.populatedSections
    })
    console.log(`Initialized! This is type of data.docx: ${typeof (data.docx)}`)

  } catch (error) {
    console.error("wierd error while initializing docx code")
  }
}


async function compileDocx(userInputData) {
  Packer.toBuffer(data.docx).then((buffer) => {
    fs.writeFileSync(`docs/${userInputData.title}.docx`, buffer);
    console.log(`Document created successfully`);
  });
}

const PORT = process.env.PORT
const HOST = "127.0.0.1"
app.listen(PORT || 5000, HOST, () => {
  console.log(`Server is running on http://${HOST}/${PORT}`);
});
