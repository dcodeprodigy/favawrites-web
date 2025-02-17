# PLOT GENERATION

**For Each Chapter (with subchapter)**
*Each Subchapter*
- Ask Model for the Plot
- It must be a comprehensive plot, as arranged from both the user description and the model's intuition and understanding


**For Each Chapter (without subchapter)**
- Ask Model for the Complete, detailed, step-by-step plot for the chapter


# SAVE AS JSON
**SCHEMA**

*With or Without Subchapters*
[
    { // Sect 1
        name: "Name of the Section/Title of Chapter",
        0: "The plot details of the 1st subchapter",
        1: "The plot details of the 2nd subchapter,
        2: "The plot details of the 3rd subchapter,
        3: "The plot details of the 4th subchapter
    },
    { // Sect 2
        name: "Name of Chapter/Title",
        0: "For those without a subchapter, just give it a '0' instead and write a plot on how to go about them"
    }
]

*Individual Response shall be in the form*
{0 : "The subchapter plot"}
