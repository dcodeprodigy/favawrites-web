const { typed } = require("typed.js");

function beginTypedJS() {
  setTimeout(() => {
    let typedH1 = new typed("#typed-texts", {
      strings: [
        "Craft your <span class='type-color text-primary-green-mint'>masterpiece</span> with AI.",
        "Generate chapters, outlines, and more with Fava<span class='type-color text-primary-green-mint'>writes.</span>",
        "Edit, refine, and perfect your e-book with <span class='type-color text-primary-green-mint'>AI assistance.</span>",
        "<span class=' type-color text-primary-green-mint'>AI-powered research</span> for e-books that stand out.",
        "Top-notch type-setting for <span class='type-color text-primary-green-mint'>interiors that sells.</span>"
      ],
      typeSpeed: 80,
      backSpeed: 40,
      backDelay: 1500,
      loop: false,
    });
  }, 500);
}

window.addEventListener("load", beginTypedJS);

/* Generate chapters, outlines, and more. AI ebook creation.
Edit, refine, and perfect your ebook with AI assistance.
AI-powered research for ebooks that stand out. */