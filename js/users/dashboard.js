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
    <input type="text" placeholder="Enter your book's subtitle" name="subtitle" value="Building Confidence and Resilience, One Step at a Time">

    <div class="gap-3 flex-col flex" id="aiInputsContainer">
        <label for="author">Author/Pen Name</label>
        <input type="text" placeholder="Enter author or pen name" name="author">

        <label for="genre">Book Genre</label>
        <input type="text" placeholder="Enter genre (e.g., Fantasy, Romance)" name="genre" value="Self-Help / Personal Development">

        <label for="audience">Book Audience</label>
        <input type="text" placeholder="Enter the target audience of this book (e.g., Adults(18+)" name="audience" value="Anyone looking to create positive change in their life through small, manageable steps.">

        <label for="category">Book Category</label>
        <textarea name="category" id="book-category" cols="30" rows="8" placeholder="Enter a list of comma separated values that sets the atmosphere of the book (e.g., Violence, Suicide, Sex)">Small Wins, Resilience, Confidence, Simplicity, Personal Growth</textarea>

        <label for="bookTone">Book Tone</label>
        <select name="bookTone" id="bookTone" class="max-w-[100%]">
            <option value="entertaining">Entertaining</option>
            <option value="casual" selected>Casual</option>
            <option value="formal">Formal</option>
            <option value="narrative">Narrative</option>
            <option value="informative">Informative</option>
            <option value="humorous">Humorous</option>
            <option value="serious">Serious</option>
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
        <textarea name="description" id="book-description" cols="30" rows="8">
This book focuses on transforming your life through small wins—achievable steps that gradually build confidence and resilience.

Chapter Outline:
1. **The Magic of Small Wins** - Discover how tiny, consistent successes lead to big life changes. This chapter emphasizes the power of small efforts and why they matter in the long run.

2. **Navigating Setbacks with Positivity** - Life happens, but setbacks don’t have to derail you. Learn practical ways to stay grounded and keep moving forward, even when things don’t go as planned.

These two chapters provide simple strategies to help you develop momentum and create meaningful progress, one small win at a time.
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
    let errors = 0;
    await loopAxiosOnErr();
    async function loopAxiosOnErr() {
        try {
            console.log(`This is what is being posted to our server:`, userInputData);
            const serverRes = await axios.post("/generate_book", userInputData, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                }
            });
            document.getElementById("nextStep").disabled = true;

            if (serverRes.status === 200) {
                document.getElementById("nextStep").textContent = "Status = 200";
                document.getElementById("nextStep").disabled = false;
                alert("A 200 Status code was received");
            }

            console.log(serverRes);
            localStorage.setItem("book_data", serverRes.data)
        } catch (err) {
            errors++;
            console.log(`An error occurred. Hang tight while we retry : ${err}`);
            if (errors < 3) {
                loopAxiosOnErr();
            } else {
                console.log(`Oops, posting of form data failed! : ${err}.}`);
                alert(`Oops, posting of form data failed! : ${err}.`);
                document.getElementById("nextStep").textContent = "Bad Response! Internal Server Error"

                new Promise(async resolve=> {
                    let result;
                     setTimeout(async function () {
                        if (document.getElementById("nextStep").textContent == "Creating your Masterpiece..."){
                            null
                        } else {
                            result = document.getElementById("nextStep").textContent = "Next"
                        }
                        resolve(result);
                    }, 5000)
                });

                document.getElementById("nextStep").disabled = false;
            }
            
        }

    }
}