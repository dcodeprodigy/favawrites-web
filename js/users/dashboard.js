const createAiBtn = document.getElementById("create-with-ai");
const createScratchBtn = document.getElementById("create-scratch");
const createContainer = document.getElementById("create-btn-container");
const copyright = document.getElementById("copyright");
const year = new Date ().getFullYear();
copyright.innerHTML = `&#169; ${year} favawrites. All rights reserved.`;

// Create a form to be server when user clicks on the create buttons
const htmlComponents = {
    createForm: `<form id="create-form" class="bg-[#333] rounded-md p-5 gap-3 flex flex-col max-w-[600px] m-auto">
    <h3>Create Your Book with AI</h3>
    <button id="clearForm" type="button" class="py-3 px-6 rounded-lg mt-4 bg-secondary-black-slate hover:bg-secondary-black-slate-light">Clear Form</button>
    <button id="saveForm" type="button" class="py-3 px-6 rounded-lg bg-primary-green-mint  hover:bg-primary-green-600">Save Form</button>
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
            <option value="gemini-1.5-flash" selected="">Gemini 1.5 Flash</option>
            <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash Exp</option>
            <option value="gemini-2.0-flash-lite-preview-02-05">Gemini 2.0 Flash Lite</option>
            <option value="gemini-gemini-1.5-flash-8b">Gemini 1.5 Flash 8B</option>
        </select>

        
        <label for="plots">Use Plots</label>
        <select name="plots" id="plots" class="max-w-[100%]">
            <option value="true" selected>True</option>
            <option value="false">False</option>
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
    const userForm = document.getElementById("create-form");
    console.log('listening for nextbtn click');
    userForm.addEventListener("submit", (event)=> {
        event.preventDefault();
        const submitBtn = document.getElementById("nextStep");
        // add loading spinner
        submitBtn.textContent = "Creating your Masterpiece...";
        submitBtn.disabled = true;
        submitBtn.style.cursor = "wait";

        const userInputedData = getFormData(userForm); // This will receive the form data as an object
        localStorage.setItem("FormData", JSON.stringify(userInputedData)); // save object to local storage

        // Now, time to query the generative AI Innit?
        // Make a requet to our server api
        postFormData(userInputedData, submitBtn);

    })

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
        const clearFormBtn = document.getElementById("clearForm");
        const saveFormBtn = document.getElementById("saveForm");
        saveFormBtn.addEventListener("click", saveFormData);
        clearFormBtn.addEventListener("click", clearForm);
        const form = document.getElementById("create-form");
        function populateWithSavedData() {
            if (localStorage.getItem("FormData")) {
                console.log("Got FormData")
                const storedFormData = JSON.parse(localStorage.getItem("FormData"));
                const form = document.getElementById("create-form");

                for (const key in storedFormData) {
                    const element = form.elements[key];

                    if (element) {
                        if (element.type === "checkbox" || element.type === "radio") {
                            element.checked = storedFormData[key];
                        }
                        else if (element.nodeName.toLowerCase() == 'textarea') {
                            element.value = storedFormData[key]
                        }
                        else if (element.nodeName.toLowerCase() == 'select') {
                            element.value = storedFormData[key]
                        }
                        else {
                            element.value = storedFormData[key]; // Regular input fields
                        }
                    }
                }
            }
        }
        function clearForm() {
            // clear local storage
            const formObj = JSON.parse(localStorage.getItem("FormData"));
            if (formObj) {
                for (const [key, value] of Object.entries(formObj)) {
                    if (value == true) {
                        formObj[key] = false
                    } else {
                        formObj[key] = ""
                    }
                }
                localStorage.setItem("FormData", JSON.stringify(formObj));
                // populate form with empty data
                populateWithSavedData();  
                // remove FormData from loacal storage to avoid an empty field being populated when we refresh the page
                localStorage.removeItem("FormData");
                clearFormBtn.textContent = "Cleared!";
                setTimeout(() => {
                    if (clearFormBtn.textContent === "Cleared!") {
                        clearFormBtn.textContent = "Clear Form";
                    }
                }, 3000);
            }
        }
        function saveFormData() { // save form data at will
            const formObject = getFormData(form);
            localStorage.setItem("FormData", JSON.stringify(formObject));

            saveFormBtn.textContent = "Saved to Local Storage!";
            setTimeout(() => {
                if (saveFormBtn.textContent === "Saved to Local Storage!") {
                    saveFormBtn.textContent = "Save Form";
                }
            }, 3000);
            
        }
        populateWithSavedData();
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

async function postFormData(userInputData, submitBtn) {
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

            if (serverRes.status >= 200 && serverRes.status < 300) {
                submitBtn.textContent = "Status = 200";
                submitBtn.disabled = false;
                submitBtn.style.cursor = "pointer"
                alert("A 200 Status code was received");
            }

            console.log(serverRes);
            if (serverRes.data.file) {
                localStorage.setItem("bookLink", serverRes.data.file);
                const windowLocation = window.location.hostname;
                alert(`${window.location.protocol}//${windowLocation}${localStorage.getItem("bookLink")}`)
            }
        } catch (error) {
            submitBtn.disabled = false;
                submitBtn.style.cursor = "pointer"
            if (error.response) {

                const err = error.response.data
                console.log('Error data:', err);
                console.log('Status:', error.response.status);


                alert("An error occured: " + error);

                err.response ? alert("Status Text: " + err.response.statusText + " With Code: " + err.response.status) : alert(err + 'Status: ' + error.response.status);
            } else if (error.request) {
                // No response was received
                console.log('No response:', error.request);
                alert(error.request);
            } else {
                // Something else caused the error
                console.log('Error: ', error.message + " " + error.status);
                alert(error.message);
            }

            new Promise(async resolve => {
                let result;
                setTimeout(async function () {
                    result = submitBtn.textContent = "Next"
                    resolve(result);
                }, 1000)
            });
        }

    }
}


