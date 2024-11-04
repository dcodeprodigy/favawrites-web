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

const docx = new Document({
  sections: [  ]
  // Add a new section object to this array when we need a new page
})


// Create the document
const doc = new Document({
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
  sections: [
    {
      properties: { pageBreakBefore: true }, // Start new chapter on a new page
      children: [
        // Chapter Title (Heading 1)
        new Paragraph({
          alignment: AlignmentType.CENTER, // Centers the text
          spacing: { after: 300 },         // Adds spacing after the paragraph
          heading: "Heading1",             // Sets it as Heading 1
          children: [
            new TextRun({
              text: "Day 1 - The Fresh Start",
              bold: true,              // Makes the text bold
              size: 40,                // Sets font size (20 * 2 = 40 half-points)
            }),
          ],
        }),
        // Quote Section
        new Paragraph({
          alignment: AlignmentType.END,
          spacing: { after: 300 },
          children: [
            new TextRun({
              text: `"The first step towards getting somewhere is to decide you're not going to stay where you are." - J.P. Morgan`,
              italics: true,
              bold: false,
            }),
          ],
        }),

        // Author's Reflection Title (Heading 2)
        new Paragraph({
          spacing: { after: 200 },
          heading: "Heading2",
          children: [
            new TextRun({
              text: "Author's Reflection", // do not add any colon or semi colo after any heading. Be it h1 or h2 or h3.
              bold: true,
              size: 36,
            }),
          ],
        }),

        // Author's Reflection Text
        new Paragraph({
          spacing: { after: 200 },
          children: [
            new TextRun({
              text:
                "J.P. Morgan's words capture the very essence of a fresh start. It's not enough to simply wish for change; we must actively choose to move, to shift, to begin. Today, on the first day of January, we stand at this crucial juncture. The past is behind us, a mixture of triumphs and stumbles, and the future stretches before us, full of potential. This potential, however, remains dormant until we decide, definitively, to step away from our current position – whether that’s a bad habit, a limiting belief, or a stagnant routine.",
            }),
          ],
        }),

        // Additional Reflection Text
        new Paragraph({
          spacing: { after: 200 },
          children: [
            new TextRun({
              text:
              "Many of us set ambitious New Year's resolutions, fueled by the energy of a fresh start. But how do we ensure that this initial spark doesn't fizzle out? The key is to recognize that grand transformations are built upon small, consistent actions. Don't aim to overhaul your entire life overnight. Instead, focus on identifying one specific area you want to improve and take a single, concrete step in that direction. If you want to exercise more, don't sign up for a marathon on day one. Start with a 15-minute walk. If you're aiming to eat healthier, replace one unhealthy snack with a piece of fruit. These seemingly minor actions create momentum, building self-discipline and paving the way for lasting change.",

            }),
          ],
        }),

        new Paragraph({
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: "One of the biggest pitfalls in pursuing new goals is the tendency to get overwhelmed. We envision the entire journey ahead and become discouraged by its perceived magnitude. The antidote? Stay present. Focus solely on the task at hand, on the small step you're taking today. Don't worry about next week or next month. Just be here, now, committed to the present action. Remember, the longest journey begins with a single step, and each step you take brings you closer to your destination.",
  
            }),
          ],
        }),

        // Reader's Reflection Title (Heading 2)
        new Paragraph({
          spacing: { after: 200 },
          heading: "Heading2",
          children: [
            new TextRun({
              text: "Readers Reflection",
              bold: true,
              size: 36,
            }),
          ],
        }),

        // Reader's Reflection Text
        new Paragraph({
          spacing: { after: 300 },
          children: [
            new TextRun({
              text:
              "What is one small, concrete step you can take today to move towards a goal you've set for yourself? Write it down, commit to it, and celebrate its completion. How does taking this first step make you feel?",
            }),
          ],
        }),
      ],
    },
    { // a new section
      properties: { pageBreakBefore: true }, // Start new chapter on a new page
      children: [
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            heading: "Heading1",
            children: [
              new TextRun({
              text: "Day 2: Setting Intentions",
              size: 40,
            })
          ],
          }),
        
          new Paragraph({
            alignment: AlignmentType.END,
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: `"Intention is one of the most powerful forces there is. What you mean when you do a thing will always determine the outcome." - Brenna Yovanoff`,
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
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text:
                  "Brenna Yovanoff's quote highlights a crucial element in self-discipline and achieving our goals: intention. It's not enough to simply go through the motions; the why behind our actions carries immense weight. Yesterday, we focused on taking that first step. Today, we delve into the driving force behind those steps – our intentions..",
              
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text:
                  "Setting intentions is a powerful practice that shapes our focus and directs our energy. Unlike goals, which are specific and measurable outcomes, intentions are about how we want to be and how we want to approach our day. They are the guiding principles that inform our actions and decisions. For example, your goal might be to write a book. But your intention could be to approach the writing process with joy, curiosity, and a willingness to embrace imperfection. This intention will influence how you show up each day, how you handle setbacks, and how you ultimately experience the journey.",
           
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text:
                  "Setting daily intentions provides us with an internal compass, helping us navigate the inevitable challenges and distractions that arise. When we have a clear intention, we're less likely to get derailed by negative thoughts, unexpected obstacles, or the temptation to give up. It's like having a personal roadmap, reminding us of our chosen direction and keeping us focused on the bigger picture.",
            
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text:
                  `How do we set effective intentions? Start by identifying your core values – the things that truly matter to you. Your intentions should align with these values, creating a sense of purpose and authenticity in your actions. Keep your intentions concise and positive. Instead of "I won't procrastinate today," try "I will focus on completing my most important task first." This positive framing empowers you and reinforces the desired behavior. Finally, write your intentions down and revisit them throughout the day. This keeps them top of mind and strengthens their impact on your thoughts and actions.`,
               
              }),
            ],
          }),

          new Paragraph({
            spacing: { after: 200 },
            heading: "Heading2",
            children: [
              new TextRun({
                text: "Reader's Reflection", // do not add any colon or semi colo after any heading. Be it h1 or h2 or h3.
                bold: true,
                size: 36,
              }),
            ],
          }),

          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text:
                  `Take a moment to reflect on your core values. What is truly important to you? Now, set an intention for today that aligns with those values. How will you embody this intention in your actions and interactions? Write it down and keep it visible as a reminder throughout the day.`,
           
              }),
            ],
          }),

      ],
    },
  ],
});


// Save the document as a .docx file
Packer.toBuffer(doc).then((buffer) => {
  let randomAttStr = "";
  const availableChar = "abcdefghijklmnopqrstuvwxy01234"
  const charArr = availableChar.split(""); // turns availableChar to array of individual characters
  console.log(charArr.length)
  for (let i = 0; i <= 3; i++) {
    const no = Math.floor((charArr.length - 1) * Math.random().toFixed(1)); // multiply random number by length of array
    randomAttStr = randomAttStr.concat(charArr[no]); // gets the random character and append to randomAttStr
  }
  fs.writeFileSync(`docs/SelfDiscipline_Chapter_${randomAttStr}.docx`, buffer);
  console.log(`Document created successfully: SelfDiscipline_Chapter_1_${randomAttStr}.docx`);
});
