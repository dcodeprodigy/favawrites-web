const { Document, Packer, Paragraph, TextRun, AlignmentType } = require("docx");
const fs = require("fs");

// Create a new document
const doc = new Document({
  sections: [
    {
      children: [
        // Day 2
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Day 2 Setting Intentions", font: "Times New Roman", bold: true, size: 28 })],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Quote: \"Intention is one of the most powerful forces there is...\"", font: "Times New Roman", size: 13 }),
            new TextRun({ text: "- Brenna Yovanoff", break: 1, font: "Times New Roman", size: 13 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Author's Reflection", font: "Times New Roman", bold: true, size: 24 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Brenna Yovanoff's quote highlights...", font: "Times New Roman", size: 13 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Reader's Reflection", font: "Times New Roman", bold: true, size: 24 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Take a moment to reflect...", font: "Times New Roman", size: 13 }),
          ],
        }),

        // Day 3
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Day 3 The Power of Small Steps", font: "Times New Roman", bold: true, size: 28 })],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Quote: \"A journey of a thousand miles begins with a single step.\"", font: "Times New Roman", size: 13 }),
            new TextRun({ text: "- Lao Tzu", break: 1, font: "Times New Roman", size: 13 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Author's Reflection", font: "Times New Roman", bold: true, size: 24 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Lao Tzu's timeless wisdom speaks volumes...", font: "Times New Roman", size: 13 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Reader's Reflection", font: "Times New Roman", bold: true, size: 24 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Think about a goal you're currently pursuing...", font: "Times New Roman", size: 13 }),
          ],
        }),

        // Day 4
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Day 4 Embracing Imperfection", font: "Times New Roman", bold: true, size: 28 })],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Quote: \"Have no fear of perfection - you'll never reach it.\"", font: "Times New Roman", size: 13 }),
            new TextRun({ text: "- Salvador Dali", break: 1, font: "Times New Roman", size: 13 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Author's Reflection", font: "Times New Roman", bold: true, size: 24 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Salvador Dali's witty remark points to a profound truth...", font: "Times New Roman", size: 13 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Reader's Reflection", font: "Times New Roman", bold: true, size: 24 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "What is one area of your life where you tend to strive for perfection?", font: "Times New Roman", size: 13 }),
          ],
        }),

        // Day 5
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Day 5 Building a Routine", font: "Times New Roman", bold: true, size: 28 })],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Quote: \"We are what we repeatedly do...\"", font: "Times New Roman", size: 13 }),
            new TextRun({ text: "- Aristotle", break: 1, font: "Times New Roman", size: 13 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Author's Reflection", font: "Times New Roman", bold: true, size: 24 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Aristotle's words underscore the profound impact...", font: "Times New Roman", size: 13 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Reader's Reflection", font: "Times New Roman", bold: true, size: 24 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Take a few minutes to examine your current daily schedule...", font: "Times New Roman", size: 13 }),
          ],
        }),
      ],
    },
  ],
});

// Save the document as a .docx file
Packer.toBuffer(doc).then((buffer) => {
  let randomAttStr = "";
  const availableChar = "abcdefghijklmnopqrstuvwxyz"
  const charArr = availableChar.split(""); // turns availableChar to array of individual characters
  console.log(charArr.length)
  for (let i = 0; i <= 3; i++){
    const no = (charArr.length - 1) * Math.random().toFixed(); // multiply random number by length of array
    console.log(no);
    randomAttStr = randomAttStr.concat(charArr[no]); // gets the random character and append to randomAttStr
  }
  fs.writeFileSync(`docs/SelfDiscipline_Chapters_${randomAttStr}.docx`, buffer);
  console.log(`Document created successfully: SelfDiscipline_Chapters_${randomAttStr}.docx`);
});
