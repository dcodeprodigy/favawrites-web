
// import TableOfContentsComponent from "/js/components/toc.js";


const generateTOCForm = document.getElementById("generate-toc");

// Validate form for creating book table of contents
generateTOCForm.addEventListener("submit", validateTOCForm);
async function validateTOCForm(event) {
  event.preventDefault();

  const bookTitle = document.getElementById("book-title");
  const authorName = document.getElementById("author");
  const bookDescription = document.getElementById("description");
  const bookStyle = document.getElementsByName("bookStyle");

  function checkBookStyle() {
    for (let i = 0; i < bookStyle.length; i++) {
      if (bookStyle[i].checked) {
        return "filled";
      }
    }
    return "not filled";
  }

  if (
    bookTitle.value === "" ||
    authorName.value === "" ||
    bookDescription.value === "" ||
    checkBookStyle() === "not filled"
  ) {
    alert("One or more required fields not completed");
    console.log("One or more required fields not completed");
  } else {
    const formData = new FormData(generateTOCForm);
    const formObject = {};
    for (const [key, value] of formData.entries()) {
      formObject[key] = value;
    }

    // Activate Loading Animatiobn and Disable Submit Button
    const generateTOCBtns = Array.from(document.getElementsByClassName("saveAndSubmitBtn"));

    generateTOCBtns.forEach(generateTOCBtn => {
      generateTOCBtn.disabled = true;
    });

    axios.get("/users/components/tocGenAnimation.html")
      .then(response => {
        console.log(response.data);
        const tocAnimation = document.getElementById("tocAnimation");
        tocAnimation.innerHTML = response.data;
        const styleTag = document.createElement("style");
        // Get style
        axios.get("css/components/toc.css")
          .then(response => {
            styleTag.innerHTML = response.data;
            document.head.appendChild(styleTag);
            console.log("style complete");
          })
          .catch(error => {
            console.error(error);
          })

      })
      .catch(error => {
        console.error(error);
      });





    console.log(formObject);
  }
}



window.addEventListener("load", () => {
  const inputs = document.querySelectorAll("input");
  const textArea = document.querySelector("textarea");

  inputs.forEach(input => {
    input.value = "Hello World"
  })

  textArea.value = "This is just a text guys!"
})