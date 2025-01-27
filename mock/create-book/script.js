document.addEventListener('DOMContentLoaded', () => {
    let currentStep = 1;
    const totalSteps = 5;
    const formSlides = document.querySelectorAll('.form-slide');
    const progressSteps = document.querySelectorAll('.progress-step');
    let selectedCategory = null;
    let selectedGenres = new Set();

    // Show/hide slides and update progress
    function showSlide(step) {
        formSlides.forEach(slide => {
            slide.classList.remove('active');
            if(parseInt(slide.dataset.step) === step) {
                slide.classList.add('active');
            }
        });

        progressSteps.forEach((stepNode, index) => {
            stepNode.classList.toggle('active', index < step);
        });
    }

    // Category selection logic
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', function() {
            document.querySelectorAll('.category-card').forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            selectedCategory = this.dataset.value;
        });
    });

    // Genre selection logic
    document.querySelectorAll('.genre-card').forEach(card => {
        card.addEventListener('click', function() {
            this.classList.toggle('selected');
            const genre = this.dataset.genre;
            selectedGenres.has(genre) ? selectedGenres.delete(genre) : selectedGenres.add(genre);
        });
    });

    // TOC processing logic
    function processTOC(rawInput) {
        // Basic cleaning and formatting
        return rawInput
            .replace(/[^\w\s.,\-:;'"!?\n]/g, '') // Remove special chars
            .replace(/\n{3,}/g, '\n\n') // Limit newlines
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map(line => `• ${line}`)
            .join('\n');
    }

    // Navigation controls
    document.querySelectorAll('.next-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            if (!validateStep(currentStep)) return;
            
            if(currentStep === 4) { // Special handling for TOC generation
                const rawInput = document.querySelector('[data-step="4"] textarea').value;
                const processedTOC = processTOC(rawInput);
                document.getElementById('tocPreview').textContent = processedTOC;
                document.getElementById('finalToc').value = processedTOC;
            }
            
            if(currentStep < totalSteps) currentStep++;
            showSlide(currentStep);
        });
    });

    document.querySelectorAll('.prev-btn').forEach(button => {
        button.addEventListener('click', () => {
            if(currentStep > 1) currentStep--;
            showSlide(currentStep);
        });
    });

    // Form validation
    function validateStep(step) {
        switch(step) {
            case 1:
                const title = document.querySelector('[data-step="1"] input').value;
                if(!title.trim()) {
                    alert('Please enter a title');
                    return false;
                }
                return true;
                
            case 2:
                if(!selectedCategory) {
                    alert('Please select a category');
                    return false;
                }
                return true;
                
            case 3:
                if(selectedGenres.size === 0) {
                    alert('Please select at least one genre');
                    return false;
                }
                return true;
                
            case 4:
                // Optional: Add validation if style selection is required
                // if(!selectedStyle) {
                //     alert('Please select a writing style');
                //     return false;
                // }
                return true;
                
            case 5:
                const instructions = document.querySelector('[data-step="5"] textarea').value;
                if(!instructions.trim()) {
                    alert('Please provide some instructions');
                    return false;
                }
                return true;
                
            case 6:
                // Final review step - no validation needed
                return true;
                
            default:
                return true;
        }
    }
    // Add to existing JS
let selectedStyle = null;

// Style selection logic
document.querySelectorAll('.style-card').forEach(card => {
    card.addEventListener('click', function() {
        document.querySelectorAll('.style-card').forEach(c => c.classList.remove('selected'));
        this.classList.add('selected');
        selectedStyle = this.querySelector('.style-name').textContent;
    });
});


    // Form submission
    document.getElementById('multiStepForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = {
            title: document.querySelector('[data-step="1"] input').value,
            subtitle: document.querySelector('[data-step="1"] input:nth-of-type(2)').value,
            penName: document.querySelector('[data-step="1"] input:nth-of-type(3)').value,
            category: selectedCategory,
            genres: Array.from(selectedGenres),
            toc: document.getElementById('finalToc').value,
            writingStyle: selectedStyle
        };

        // Submit to backend (simulated)
        console.log('Form Data:', formData);
        alert('Book creation started! Redirecting to dashboard...');
        window.location.href = '/dashboard';
    });
});