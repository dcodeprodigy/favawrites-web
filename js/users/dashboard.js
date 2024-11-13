const createAiBtn = document.getElementById("create-with-ai");
const createScratchBtn = document.getElementById("create-scratch");
const createContainer = document.getElementById("create-btn-container");


// Create a form to be server when user clicks on the create buttons
const htmlComponents = {
    createForm: `<form id="create-form" class="bg-[#333] rounded-md p-5 gap-3 flex flex-col max-w-[600px] m-auto">
    <h3>Create Your Book with AI</h3>
    <label for="title">Book Title</label>
    <input type="text" placeholder="Enter your book's title" name="title" value="The Power of Small Wins">

    <label for="subtitle">Book Subtitle</label>
    <input type="text" placeholder="Enter your book's subtitle" name="subtitle" value="A Simple Guide to Building Confidence, Resilience, and Momentum through Small, Everyday Achievements">

    <div class="hidden gap-3 flex-col" id="aiInputsContainer">
        <label for="author">Author/Pen Name</label>
        <input type="text" placeholder="Enter author or pen name" name="author">

        <label for="genre">Book Genre</label>
        <input type="text" placeholder="Enter genre (e.g., Fantasy, Romance)" name="genre" value="Self-Help / Personal Development">

        <label for="audience">Book Audience</label>
        <input type="text" placeholder="Enter the target audience of this book (e.g., Adults(18+)" name="audience" value="Individuals seeking sustainable self-improvement methods, focusing on confidence, resilience, and daily progress through small wins.">

        <label for="category">Book Category</label>
        <textarea name="category" id="book-category" cols="30" rows="8" placeholder="Enter a list of comma separated values that sets the atmosphere of the book (e.g., Violence, Suicide, Sex)">Small Wins, Resilience, Confidence, Daily Progress, Personal Growth, Mindset</textarea>

        <label for="bookTone">Book Tone</label>
        <select name="bookTone" id="bookTone" class="max-w-[100%]">
            <option value="entertaining">Entertaining</option>
            <option value="casual">Casual</option>
            <option value="formal">Formal</option>
            <option value="narrative">Narrative</option>
            <option value="informative">Informative</option>
            <option value="humorous">Humorous</option>
            <option value="serious">Serious</option>
            <option value="dark">Dark</option>
            <option value="inspirational" selected>Inspirational</option>
            <option value="sarcastic">Sarcastic</option>
            <option value="whimsical">Whimsical (Light, fanciful, and imaginative, often with a magical or quirky vibe)</option>
            <option value="nostalgic">Nostalgic</option>
            <option value="suspenseful and intriguing">Suspenseful and Intriguing</option>
            <option value="romantic">Romantic</option>
            <option value="cautionary">Cautionary - warning and instructive, often delivering a moral lesson or guiding behaviour</option>
            <option value="instructive">Instructive, motivating, and reflective—offering supportive, practical advice from a mentor's perspective.</option>
        </select>

        <label for="description">Book Description/Fine Tuning</label>
        <textarea name="description" id="book-description" cols="30" rows="8">Book Description/Fine Tuning
This book guides readers on transforming their lives through "small wins"—daily, achievable goals that build confidence and momentum without the burnout of big, overwhelming goals.

Chapter Outline:
1. **The Psychology of Small Wins** - Understand how small achievements boost motivation, positive habits, and create an upward spiral of success. Key objective: Emphasize celebrating small victories for cumulative, long-term impact.

2. **Setting Intentions, Not Just Goals** - Learn to set flexible, realistic intentions over rigid goals, helping readers stay committed even on tough days. Key objective: Guide readers on setting adaptable intentions that keep them motivated.

3. **Building Habits One Step at a Time** - Explore techniques for creating sustainable habits that don’t overwhelm, like the "2-minute rule." Key objective: Help readers develop consistent habits that align with their goals and intentions.

4. **Managing Setbacks with a Growth Mindset** - Reframe setbacks as learning opportunities rather than failures. Key objective: Encourage resilience by viewing challenges constructively.

5. **Celebrating and Building Momentum** - Show the importance of tracking and celebrating progress, reinforcing motivation and long-term success. Key objective: Inspire readers to envision their progress through the power of small wins.

Additional Instructions for AI:
For each chapter, provide:
- Key Concept: An insightful introduction to each chapter's theme.
- Actionable Steps: Simple, immediate exercises or prompts.
- Reflection Prompt: Journaling or thought-provoking questions to reflect on each lesson.

Tone: Inspiring, instructive, and reflective—like a mentor's guidance, balanced with practical advice and emotional support.</textarea>
    </div>
    <button id="nextStep" class="py-3 px-6 bg-primary-green-mint rounded-lg mt-4 hover:bg-primary-green-600" type="submit">Next</button>
</form>
`
}

const pageState = {
    fromScratchForm: false, // Initially, the form for creating books from scratch is not visible
    fromAIForm: false,
}


function listenForSubmit() {
    console.log('listening for nextbtn click');
    document.getElementById("create-form").addEventListener("submit", submitFormData)

    function submitFormData(event) {
        event.preventDefault();
        const userForm = document.getElementById("create-form");
        const userInputedData = getFormData(userForm); // This will receive the form data as an object

        // Now, time to query the generative AI Innit?
        // Make a requet to our server api
        postFormData(userInputedData);

    }
}

createScratchBtn.addEventListener("click", () => {
    if (pageState.fromScratchForm === false) {

        if (pageState.fromAIForm === true) { // Checks if ai form is present
            document.getElementById("create-form").remove(); pageState.fromAIForm = false;
        }

        createContainer.insertAdjacentHTML("afterend", htmlComponents.createForm);
        // set state to true
        pageState.fromScratchForm = true;

        const nextBtn = document.getElementById("nextStep");
        nextBtn.addEventListener("click", (event) => {
            event.preventDefault();
            alert("what do you think would happen? You have not coded my logic bro");
        })
    } else {
        // remove the form if it is already true.
        document.getElementById("create-form").remove();
        pageState.fromScratchForm = false;
    }
})

createAiBtn.addEventListener("click", () => {
    if (pageState.fromAIForm === false) {
        if (pageState.fromScratchForm === true) {
            document.getElementById("create-form").remove();
            pageState.fromScratchForm = false;
        }

        createContainer.insertAdjacentHTML("afterend", htmlComponents.createForm);
        const aiInputsContainer = document.getElementById("aiInputsContainer");
        aiInputsContainer.classList.remove("hidden");
        aiInputsContainer.classList.add("flex");
        // set state to true
        pageState.fromAIForm = true;
        listenForSubmit();


    } else {
        // remove the form if it is already true.
        const aiInputsContainer = document.getElementById("aiInputsContainer");
        aiInputsContainer.classList.add("hidden");
        aiInputsContainer.classList.remove("flex");
        document.getElementById("create-form").remove();
        pageState.fromAIForm = false;
    }
})


function getFormData(userForm) {
    const formData = new FormData(userForm);
    const formObject = Object.fromEntries(formData.entries());
    return formObject;
}

async function postFormData(userInputData) {
    let errors = 0;
    loopAxiosOnErr();
    async function loopAxiosOnErr () {
        try {
            console.log(`This is what is being posted to our server`, userInputData);
            const serverRes = await axios.post("/generate_book", userInputData, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                }
            });
            console.log(serverRes);
            localStorage.setItem("book data", serverRes)
        } catch (err) {
            errors++
            console.log(`An error occurred. Hang tight while we retry : ${err}`);
            errors < 3 ? loopAxiosOnErr() : console.log(`Oops, posting of form data failed! : ${err}`);
        }

    }
}