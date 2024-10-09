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
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain",
  };

  const data = {
    kdp_titles_subtitle_rules : `Book Title
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
  }
  

  app.post("/generate_book", async (req, res) => {
    const userInputData = req.body;
    // const userInputData = {
    //     title: "The Pumpkin Patch Mystery",
    //     description: `In a small town surrounded by whispering woods, something strange is happening in the pumpkin patch. Every night, a new pumpkin vanishes without a trace! Follow a curious group of children who decide to uncover the mystery before Halloween night arrives. The story should be fun yet slightly eerie, with lovable characters, whimsical adventures, and a lighthearted tone. Each chapter should reveal clues that build suspense but never become too scary for young readers. You, the AI must emphasize teamwork, problem-solving, and the magic of friendship, while also leaving room for humorous, unexpected twists. 
    //     The tone of The Pumpkin Patch Mystery should be lighthearted, playful, and mildly suspenseful, with a sprinkle of whimsy and warmth. The language should be accessible and engaging for young readers, balancing curiosity with a sense of safety. There can be moments of gentle tension to keep the mystery engaging, but always with a reassuring, adventurous spirit. The focus should remain on fun, teamwork, and imagination, ensuring an enjoyable, heartwarming read for children.`,
    //     bookTone: "Entertaining",
    //     genre: "Children's Mystery/Adventure",

    // }
    console.log("This is the user input data from req.body: \n\n" + userInputData);
    const systemInstruction = `You are a professional human book writer. Please, read and sound human. Avoid any pattern that suggests you are an AI. Your tone must be ${userInputData.bookTone}. The genre of this book is ${userInputData.genre}. Make sure to write like it. 
    THIS IS VERY IMPORTANT - The number of each subchapter under each chapter must not be 3. They must range from 4 and above. No two chapters must have the same number of subchapters.
    See added instructions for this book below. Follow it: ${userInputData.description}`;

    console.log(`This is thr systemInstructions: ${systemInstruction}`)


    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro", systemInstruction });
    const chatSession = model.startChat({ generationConfig, safetySettings });
    const tocPrompt = getTocPrompt(userInputData);
    const modelResponse = await chatSession.sendMessage(tocPrompt);
    console.log("This is the model response as text: \n\n" + modelResponse.response.text());
    res.send(modelResponse.response.text());

  });

  function getTocPrompt(inputData) {
    const tocSchema = `{

    "title": "The Title of the book I told you, exactly as i did",

    "subtitle" : "Generate a suitable subtitle to the title and place it here.",

    "toc" : [

        {"ch-1": "the title of the first chapter", "sch-1": ["1.1 subchapter 1 title", "1.2 subchapter 2 title", "1.3 subchapter 3 title", "1.4 subchapter 4 title"], "sch-no": "here, input the number of sub chapters you added in this chapter strictly as a number, not a string. This helps me access this toc for promoting later on. For example, if you included 7 subchapters the value must be a number '7' "},

        {"ch-2": "the title of the second chapter", "sch-2": ["2.1 subchapter 1 title", "2.2 subchapter 2 title", "2.3 subchapter 3 title"], "sch-no": "here, input the number of sub chapters you added in this chapter strictly as a number, not a string. This helps me access this toc for promoting later on. For example, if you included 7 subchapters the value must be a number '7' "}
    ],

    "chapters" : "Here, input the number of chapters in the toc as a number, not a string. This will help me access the available chapters to automatically prompt you later with code. For example, if you included 9 chapters, the value of this property must ne just '9'"

}

`
console.log(inputData);
    return  `Generate a comprehensive table of contents for a book titled ${inputData.title}. In your response, include a suitable catchy subtitle that will cause anyone who sees this in an amazon kdp book listing to want to click on it. Make sure the subtitle follows the amazon kdp rules for subtitles as specified here ${data.kdp_titles_subtitle_rules}.
    
    Return your response in this schema: ${tocSchema}`
  }



  const PORT = process.env.PORT
  const HOST = process.env.HOST
  app.listen(PORT || 5000, HOST, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`); 
  });
