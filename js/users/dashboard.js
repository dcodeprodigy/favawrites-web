const createAiBtn = document.getElementById("create-with-ai");
const createScratchBtn = document.getElementById("create-scratch");
const createContainer = document.getElementById("create-btn-container");


// Create a form to be server when user clicks on the create buttons
const htmlComponents = {
    createForm: `<form id="create-form" class="bg-[#333] rounded-md p-5 gap-3 flex flex-col max-w-[600px] m-auto">
    <h3>Create Your Book with AI</h3>
    <label for="title">Book Title</label>
    <input type="text" placeholder="Enter your book's title" name="title" value="The Power of Self Discipline">

    <label for="subtitle">Book Subtitle</label>
    <input type="text" placeholder="Enter your book's subtitle" name="subtitle" value="Dedicated Strategies for Building Consistency and Lasting Growth">

    <div class="gap-3 flex-col flex" id="aiInputsContainer">
        <label for="author">Author/Pen Name</label>
        <input type="text" placeholder="Enter author or pen name" name="author" value="Ethan Cole">

        <label for="genre">Book Genre</label>
        <input type="text" placeholder="Enter genre (e.g., Fantasy, Romance)" name="genre" value="Self-Help / Mindfulness">

        <label for="audience">Book Audience</label>
        <input type="text" placeholder="Enter the target audience of this book (e.g., Adults(18+)" name="audience" value="Individuals looking to build Self Discipline">

        <label for="writing_voice">Writer's Voice</label>
        <input type="text" placeholder="e.g., Calm and Empathetic Mindfulness Instructor" name="writing_voice" value="Strong, Understanding, Like He knows what it feels like to struggle with self discipline">

        <label for="category">Book Category</label>
        <textarea name="category" id="book-category" cols="30" rows="8" placeholder="Enter a list of comma separated values that sets the atmosphere of the book (e.g., Violence, Suicide, Sex)">Deliberate Self Discipline</textarea>

        <label for="modelType">AI Model</label>
        <select name="model" id="modelType" class="max-w-[100%]">
            <option value="gemini-1.5-flash-001" selected="">Gemini-1.5-flash-001</option>
            <option value="gemini-1.5-flash-002">Gemini-1.5-flash-002</option>
            <option value="gemini-1.5-flash-latest">gemini-1.5-flash-latest</option>
        </select>

        <label for="bookTone">Book Tone</label>
        <select name="bookTone" id="bookTone" class="max-w-[100%]">
            <option value="casual">Casual</option>
            <option value="calm and reassuring">Calm and reassuring</option> <option value="formal">Formal</option>
            <option value="narrative">Narrative</option>
            <option value="informative">Informative</option>
            <option value="humorous">Humorous</option>
            <option value="serious" selected>Serious</option>
            <option value="dark">Dark</option>
            <option value="inspirational">Inspirational</option>
            <option value="sarcastic">Sarcastic</option>
            <option value="whimsical">Whimsical</option>
            <option value="nostalgic">Nostalgic</option>
            <option value="suspenseful and intriguing">Suspenseful and Intriguing</option>
            <option value="romantic">Romantic</option>
            <option value="cautionary">Cautionary</option>
            <option value="instructive">Instructive</option>
        </select>


        <label for="description">Book Description/Fine Tuning</label>
        <textarea name="description" id="book-description" cols="30" rows="8">Table of Contents

Introduction
1. What to expect in this book
2. Willpower vs. Wiring : Why your brain works against you
3. Rewiring your Mind
4. The emotional undercurrent of discipline
5. Stress and Burnout : The enemy of self control
6. The "Just Start" Fallacy: Why action backfires
7. Outsmarting Procrastination using temptation bundling and Micro-commitments
8. The Power of "Productive Procrastination": When Distraction is a tool
9. Rethinking Failure - Building Resilience for the long haul
10. Your Focus fortress - crafting a distraction-proof workspace
11. Easily find your accountability network
12. When willpower wanes Systems over Motivation
13. The habit loop: rewiring your brain for effortless action
14. Rest as a weapon: Strategic Recovery for better performance
15. Redefining Success through Discipline and Fulfillment
16. Embrace change, stay balanced

        </textarea>
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
        // add loading spinner
        document.getElementById("nextStep").textContent = "Creating your Masterpiece..."
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
    let serverRes;
    await loopAxiosOnErr();

    async function loopAxiosOnErr() {
        try {
            console.log(`This is what is being posted to our server:`, userInputData);
            serverRes = await axios.post("/generate_book", userInputData, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                }
            });
            document.getElementById("nextStep").disabled = true;
            console.log(serverRes.status);
            console.log(serverRes.data);
            console.log(serverRes.headers);
            console.log(serverRes.config);
            if (serverRes.status === 200) {
                document.getElementById("nextStep").textContent = "Status = 200";
                document.getElementById("nextStep").disabled = false;
                alert("A 200 Status code was received");
            }

            console.log(serverRes);
            if (serverRes.data.file) {
                localStorage.setItem("bookLink", serverRes.data.file);
                const windowLocation = window.location.hostname;
                alert(`${window.location.protocol}//${windowLocation}${localStorage.getItem("bookLink")}`)
            }
        } catch (error) {
            if (error.response) {
                // Server responded with a status other than 2xx
                const err = JSON.parse(error.response.data)
                console.log('Error data:', err); // Access server's error data
                console.log('Status:', error.response.status); // Status code
                console.log('Headers:', error.response.headers); // Headers sent by server

                err.response ? alert("Status Text: " + err.response.statusText + "With Code: " + err.response.status) : alert(err + 'Status: ' + error.response.status);
            } else if (error.request) {
                // No response was received
                console.log('No response:', error.request);
                alert(error.request);
            } else {
                // Something else caused the error
                console.log('Error:', error.message);
                alert(error.message);
            }

            new Promise(async resolve => {
                let result;
                setTimeout(async function () {
                    result = document.getElementById("nextStep").textContent = "Next"
                    resolve(result);
                }, 1000)
            });

            document.getElementById("nextStep").disabled = false;


        }

    }
}