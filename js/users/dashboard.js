const createAiBtn = document.getElementById("create-with-ai");
const createScratchBtn = document.getElementById("create-scratch");
const createContainer = document.getElementById("create-btn-container");



// Create a form to be server when user clicks on the create buttons
const htmlComponents = {
    createForm : `<form id="create-form" class="bg-[#333] rounded-md p-5 gap-3 flex flex-col max-w-[600px] m-auto">
            <h3>Create Your Book with AI</h3>
            <label for="title" >Book Title</label>
            <input type="text" placeholder="Enter your book's title" name="title" >

            <label for="subtitle" >Book Subtitle</label>
            <input type="text" placeholder="Enter your book's subtitle" name="subtitle" >

            <div class="hidden gap-3 flex-col" id="aiInputsContainer">
                <label for="author">Author/Pen Name</label>
                <input type="text" placeholder="Enter author or pen name" name="author">
    
                <label for="genre">Book Genre</label>
                <input type="text" placeholder="Enter genre (e.g., Fantasy, Romance)" name="genre">
                <label for="bookTone">Book Tone</label>
                <select name="bookTone" id="bookTone" class="max-w-[100%]">
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
                    <option value="suspenseful">Suspenseful</option>
                    <option value="romantic">Romantic</option>
                    <option value="cautionary">Cautionary - warning and instructive, often delivering a moral lesson or guiding behaviour</option>
                </select>
    
                <label for="description">Book Description/Fine Tuning</label>
                <textarea name="description" id="book-description" cols="30" rows="8"></textarea>
            </div>
            <button id="nextStep" class="py-3 px-6 bg-primary-green-mint rounded-lg mt-4 hover:bg-primary-green-600" type="submit">Next</button>
        </form>`
}

const pageState = {
    fromScratchForm: false, // Initially, the form for creating books from scratch is not visible
    fromAIForm: false,
}

createScratchBtn.addEventListener("click", ()=>{
    if (pageState.fromScratchForm === false){
        
        if (pageState.fromAIForm === true){ // Checks if ai form is present
            document.getElementById("create-form").remove(); pageState.fromAIForm = false;
        }

        createContainer.insertAdjacentHTML("afterend",htmlComponents.createForm);
        // set state to true
        pageState.fromScratchForm = true;

        const nextBtn = document.getElementById("nextStep");
        nextBtn.addEventListener("click", (e) => {
            e.preventDefault();
            alert("what do you think would happen? You have not coded my logic bro");
        })
    } else {
        // remove the form if it is already true.
        document.getElementById("create-form").remove();
        pageState.fromScratchForm = false;
    }
})

createAiBtn.addEventListener("click", ()=>{
    if (pageState.fromAIForm === false){
        if (pageState.fromScratchForm === true) {
            document.getElementById("create-form").remove();
            pageState.fromScratchForm = false;
        }

        createContainer.insertAdjacentHTML("afterend",htmlComponents.createForm);
        const aiInputsContainer = document.getElementById("aiInputsContainer");
        aiInputsContainer.classList.remove("hidden");
        aiInputsContainer.classList.add("flex");
        // set state to true
        pageState.fromAIForm = true;

        const nextBtn = document.getElementById("nextStep");
        nextBtn.addEventListener("click", function submitForm(e){
            e.preventDefault();
            const formElement = document.getElementById("create-form");
            const userInputData = getFormData(formElement); // This will receive the form data as an object
            // Now, time to query the generative AI Innit?
            
        })
    } else {
        // remove the form if it is already true.
        const aiInputsContainer = document.getElementById("aiInputsContainer");
        aiInputsContainer.classList.add("hidden");
        aiInputsContainer.classList.remove("flex");
        document.getElementById("create-form").remove();
        pageState.fromAIForm = false;
    }
})


function getFormData(formElement) {
    const formData = new FormData(formElement);
    const formObject = Object.fromEntries(formData.entries());
    return formObject;
}