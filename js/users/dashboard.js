const createAiBtn = document.getElementById("create-with-ai");
const createScratchBtn = document.getElementById("create-scratch");
const createContainer = document.getElementById("create-btn-container");


// Create a form to be server when user clicks on the create buttons
const htmlComponents = {
    createForm: `<form id="create-form" class="bg-[#333] rounded-md p-5 gap-3 flex flex-col max-w-[600px] m-auto">
            <h3>Create Your Book with AI</h3>
            <label for="title" >Book Title</label>
            <input type="text" placeholder="Enter your book's title" name="title" value="The Clockwork Heart">

            <label for="subtitle" >Book Subtitle</label>
            <input type="text" placeholder="Enter your book's subtitle" name="subtitle" value="" >

            <div class="hidden gap-3 flex-col" id="aiInputsContainer">
                <label for="author">Author/Pen Name</label>
                <input type="text" placeholder="Enter author or pen name" name="author">
    
                <label for="genre">Book Genre</label>
                <input type="text" placeholder="Enter genre (e.g., Fantasy, Romance)" name="genre" value="Steampunk">

                <label for="audience">Book Audience</label>
                <input type="text" placeholder="Enter the target audience of this book (e.g., Adults(18+)" name="audience" value="Young Adult, Adult">

                <label for="category">Book Category</label>
                <textarea name="category" id="book-category" cols="30" rows="8" placeholder="Enter a list of comma separated values that sets the atmosphere of the book (e.g., Violence, Suicide, Sex)" >Mystery, Adventure</textarea>

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
                    <option value="inspirational">Inspirational</option>
                    <option value="sarcastic">Sarcastic</option>
                    <option value="whimsical">Whimsical (Light, fanciful, and imaginative, often with a magical or quirky vibe)</option>
                    <option value="nostalgic">Nostalgic</option>
                    <option value="suspenseful and intriguing" selected>Suspenseful and Intriguing</option>
                    <option value="romantic">Romantic</option>
                    <option value="cautionary">Cautionary - warning and instructive, often delivering a moral lesson or guiding behaviour</option>
                </select>
    
                <label for="description">Book Description/Fine Tuning</label>
                <textarea name="description" id="book-description" cols="30" rows="8">Amelia, a brilliant young inventor in a clockwork world, stumbles upon a hidden power source that could change everything. But it attracts the wrong kind of attention. Powerful players want to control it for themselves, and Amelia must decide: should she share her discovery and risk seeing it abused, or hide it away and potentially stifle progress? She soon finds herself caught in a dangerous political game, trying to expose a conspiracy that could not only rob her of her invention but also bring down the whole society. As Amelia gets closer to the truth, she learns just how hard it is to know who to trust.
</textarea>
            </div>
            <button id="nextStep" class="py-3 px-6 bg-primary-green-mint rounded-lg mt-4 hover:bg-primary-green-600" type="submit">Next</button>
        </form>`
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