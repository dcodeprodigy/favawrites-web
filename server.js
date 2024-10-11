"use strict"
const express = require('express');
const app = express();
const path = require('path');
// const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } = require('@google/generative-ai');
const { title } = require('process');

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
  current_chapter: 1,
  plot: {  }
}

const schema = {
  toc: `{

    "title": "The Title of the book I told you, exactly as i did",

    "subtitle" : "Generate a suitable subtitle to the title and place it here.",

    "toc" : [

        {"ch-1": "the title of the first chapter", "sch-1": ["1.1 subchapter 1 title", "1.2 subchapter 2 title", "1.3 subchapter 3 title", "1.4 subchapter 4 title"], "sch-no": "here, input the number of sub chapters you added in this chapter strictly as a number, not a string. This helps me access this toc for promoting later on. For example, if you included 7 subchapters the value must be a number '7' "},

        {"ch-2": "the title of the second chapter", "sch-2": ["2.1 subchapter 1 title", "2.2 subchapter 2 title", "2.3 subchapter 3 title"], "sch-no": "here, input the number of sub chapters you added in this chapter strictly as a number, not a string. This helps me access this toc for promoting later on. For example, if you included 7 subchapters the value must be a number '7' "}
    ],

    "chapters" : "Here, input the number of chapters in the toc as a number, not a string. This will help me access the available chapters to automatically prompt you later with code. For example, if you included 9 chapters, the value of this property must ne just '9'"

}`,
  plot: `{
          "chapter-1" : {
		"1.1 A World of Cogs and Steam": "Introduce the city of Atmos, a bustling metropolis powered by intricate clockwork mechanisms. Describe the daily life of its citizens, where gears and steam dictate the rhythm of existence. Introduce Amelia, a young, brilliant inventor living in her father's shadow. She's fascinated by the city's mechanics but feels stifled by her predetermined path in her father's workshop.",

        "1.2 The Watchmaker's Daughter": "Amelia's life revolves around her father's workshop, filled with gears, springs, and half-assembled automata. Her father, a renowned clockmaker, represents tradition and precision. Highlight their contrasting views on invention and progress, showcasing Amelia's desire to push boundaries beyond mere clockwork.",
		  }
    }`
}

const finalReturnData = {};

app.post("/generate_book", async (req, res) => {
  const userInputData = req.body;

  console.log("This is the user input data from req.body: \n\n" + userInputData);
  const systemInstruction = `You are a professional human book writer. Please, read and sound human. Avoid any pattern that suggests you are an AI. Your tone must be ${userInputData.bookTone}. The genre of this book is ${userInputData.genre} and the audience is ${userInputData.audience}.
    THIS IS VERY IMPORTANT - The number of each subchapter under each chapter must not be 3. They must range from 4 and above. No two chapters must have the same number of subchapters.
    See added instructions for this book below. Follow it: 
    
    ${userInputData.description}
    
    Also, you must follow this behaviour when writing:
    As a human book writer, you will be creating full-fledged books that reflect a writing style indistinguishable from human authorship. Focus on narrative techniques, creativity, and depth to ensure the text is not detectable by AI detectors.

# Steps

1. Understand the Genre and Audience: The genre and target audience for the book has already been written above to you. Understand them and tailor your writing style, vocabulary, and themes appropriately.
2. Plot Development: On request, develop a detailed plot outline for each chapter at a time, ensuring it has a captivating beginning, engaging middle, and satisfying conclusion.
3. Character Creation: On request, create complex, relatable characters with motivations, flaws, and arcs that contribute to the story’s progression.
4. Narrative Voice and Style: Choose a consistent narrative voice and style that feels authentically human, with attention to natural language patterns and expressions.
5. Writing: Compose the text, focusing on authenticity, creativity, and richness of language to enhance human-like qualities.
6. Edit and Refine: Revise for consistency, coherence, and stylistic polish, ensuring the text flows naturally and showcases human-like creativity.

# Output Format

The output should be a coherent, engaging narrative structured into chapters, with each chapter formatted using standard novel conventions. The text should be proofread for grammar, punctuation, and style to maintain professionalism and readability.

# Examples

* [Example 1 Start]*: If writing a mystery novel, create an intriguing hook in the first chapter, such as a mysterious incident or a puzzle. These chapters must be detailed and long, just live a conventional novel chapter.
* [Example 1 Additional Detail]*: Develop clues and red herrings throughout the chapters, leading to a surprising yet satisfying resolution.
* [Continuation of Example 1]*: Ensure character interactions and dialogue are nuanced and reflective of real human experiences, contributing to the mystery's unfolding.
* [Example 1 End]*

(Each book example should be a comprehensive and unique storyline, marked by creativity, and should reflect the length and complexity of a real novel.)

# Notes

- Pay close attention to emotional depth and narrative consistency.
- Incorporate cultural, historical, or social references reflective of the human condition.
- Avoid patterns or clichés typical of AI-generated content.
    `;

  // console.log(`This is the systemInstructions: ${systemInstruction}`)


  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro", systemInstruction });
  const chatSession = model.startChat({ generationConfig, safetySettings });
  const tocPrompt = getTocPrompt(userInputData);
  const tocRes = await chatSession.sendMessage(tocPrompt);
  console.log("This is the model response as text: \n\n" + tocRes.response.text());

  finalReturnData["firstReq"] = parseJson(tocRes);; // Push to final object as an object not a json string
  console.log(typeof (finalReturnData.firstReq));
  // Next, begin creating for each chapter
  let chapterPlot = await generatePlot(chatSession);
  finalReturnData["chapter1Plot"] = chapterPlot;
  console.log("This is the chapterPlot on line 153: "+ chapterPlot);
  res.send(finalReturnData)

  async function generatePlot(chatSession) {

    const tableOfContents = finalReturnData.firstReq.toc; // get the table of contents, just to obey DRY principle
    // console.log(tableOfContents, typeof(tableOfContents));

    for (let i = 0; i < finalReturnData.firstReq.chapters; i++){
      if (data.current_chapter === 1 && tableOfContents[data.current_chapter - 1]["sch-no"] !==0){
        // This chapter1Plot shall return an object promise. This contains all the plot generated for chapter 1 for now
        const chapter1Plot = await tableOfContents[data.current_chapter - 1][`sch-${data.current_chapter}`].map(subchapter => {
          // Generate the plot for each subchapter
          try {
            const plotPrompt = `Now, let us start the plot for chapter ${data.current_chapter} titled: ${finalReturnData.firstReq.toc[data.current_chapter - 1][`ch-${data.current_chapter}`]}, but just for the subchapter titled: ${subchapter}. Return your response in this schema:
          
          ["This is the written plot for subchapter X. No titles, just move with the subchapter plot..."]
          `
// Omo i am here guy. fuckkkkk
          const secondReqResponse = chatSession.sendMessage(plotPrompt);
          console.log("waiting for the timeout on plot generation");
          new Promise(resolve => setTimeout(resolve, 2000)); // Delay for 2 seconds before making another request to gemini. This prevents the too many request statusText, hopefully.
          // return parseJson(secondReqResponse);
          
          } catch (error) {
            console.error("This error occurred for some reason when generating plot: " + error);
            return error;
          }
          

        });

        console.log(`the type of the chapter1Plot function is ${typeof(chapter1Plot)}`);
        console.log(`the map returned variable is: \n\n ${chapter1Plot}`);

        finalReturnData["plot"] = `chapter${data.current_chapter}` // Theres no need for an if statement to check if data.current_chapter is one in order to set the object property of "plot" since we are in that kind of if statement right now
        console.log(`The type of "finalReturnData["plot"][chapter1]" is: ${typeof(finalReturnData.plot[`chapter${data.current_chapter}`])}`);

        finalReturnData["plot"][`chapter${data.current_chapter}`] = chapter1Plot;
        console.log("These are the plot: "+ finalReturnData["plot"]["chapter" + data.current_chapter]);
        data.current_chapter++;

      } else {
        // Do for next chapters
        console.log("What the hell, did i run? I think it is time to move to the next chapter plots boy!")
      }

    }
    // return parseJson(chapterPlot)
    // instead of returning at this Point, run a loop to generate the plot for each chapterPlot. Helps avoid confusion

  }
});

function getTocPrompt(inputData) {
  console.log(inputData);
  return `Generate a comprehensive table of contents for a book titled ${inputData.title}. In your response, include a suitable catchy subtitle that will cause anyone who sees this in an amazon kdp book listing to want to click on it. Make sure the subtitle follows the amazon kdp rules for subtitles as specified here ${data.kdp_titles_subtitle_rules}.
    
    Return your response in this schema: ${schema.toc}`
}

function parseJson(param) {
  return JSON.parse(param.response.text());
}



const PORT = process.env.PORT
const HOST = "127.0.0.1"
app.listen(PORT || 5000, HOST, () => {
  console.log(`Server is running on http://${HOST}/${PORT}`);
});
