const excerptContainer = document.querySelector(".excerpt-container");
      const addBtn = document.getElementById("addExcerptBtn");
      let excerptCount = 1;
      const maxExcerpts = 5;

      // Add excerpt field
      addBtn.addEventListener("click", () => {
        if (excerptCount < maxExcerpts) {
          excerptCount++;
          const newField = document.createElement("div");
          newField.className = "excerpt-field";
          newField.innerHTML = `
                    <label>Excerpt ${excerptCount}</label>
                    <textarea required></textarea>
                    <button type="button" class="remove-excerpt-btn">×</button>
                `;
          excerptContainer.appendChild(newField);

          if (excerptCount === maxExcerpts) {
            addBtn.disabled = true;
          }
        }
      });

      // Remove excerpt field
      excerptContainer.addEventListener("click", (e) => {
        if (e.target.classList.contains("remove-excerpt-btn")) {
          if (excerptCount > 1) {
            e.target.parentElement.remove();
            excerptCount--;
            addBtn.disabled = false;

            // Update remaining labels
            const fields = excerptContainer.querySelectorAll(".excerpt-field");
            fields.forEach((field, index) => {
              field.querySelector("label").textContent = `Excerpt ${index + 1}`;
            });
          }
        }
      });

      // Form validation
      document.getElementById("trainForm").addEventListener("submit", (e) => {
        e.preventDefault();

        const voiceName = document.querySelector('input[type="text"]').value;
        const excerpts = Array.from(document.querySelectorAll("textarea"))
          .map((textarea) => textarea.value.trim())
          .filter((text) => text !== "");

        if (!voiceName || excerpts.length === 0) {
          alert("Please fill in all required fields");
          return;
        }

        if (excerpts.some((text) => text.length < 20)) {
          alert("Each excerpt should be at least 20 characters");
          return;
        }

        // Submit logic here
        console.log("Training model with:", { voiceName, excerpts });
        alert("Model training started!");
        window.location.href = "/dashboard";
      });


      const deleteModal = document.getElementById('deleteModal');
    let currentModelToDelete = null;

    document.querySelectorAll('.model-delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const modelItem = this.closest('.model-item');
            const modelName = modelItem.querySelector('.model-name').textContent;
            
            deleteModal.querySelector('.style-name').textContent = modelName;
            deleteModal.style.display = 'flex';
            currentModelToDelete = modelItem;
        });
    });

    document.getElementById('confirmDelete').addEventListener('click', function() {
        if(currentModelToDelete) {
            currentModelToDelete.remove();
            currentModelToDelete = null;
            deleteModal.style.display = 'none';
        }
    });

    document.getElementById('cancelDelete').addEventListener('click', function() {
        deleteModal.style.display = 'none';
        currentModelToDelete = null;
    });

    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if(e.target === deleteModal) {
            deleteModal.style.display = 'none';
            currentModelToDelete = null;
        }
    });