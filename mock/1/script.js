// script.js
document.addEventListener('DOMContentLoaded', () => {
    // Chart Configuration
    const initTokenChart = () => {
        const ctx = document.getElementById('tokenChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                datasets: [
                    {
                        label: 'Input Tokens',
                        data: [1200, 1900, 3000, 2500],
                        borderColor: '#00BFA6',
                        backgroundColor: 'rgba(0, 191, 166, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Output Tokens',
                        data: [800, 1200, 1500, 1800],
                        borderColor: '#6C63FF',
                        backgroundColor: 'rgba(108, 99, 255, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { color: '#FFFFFF' }
                    },
                    tooltip: {
                        backgroundColor: '#16213E',
                        titleColor: '#FFFFFF',
                        bodyColor: '#FFFFFF'
                    }
                },
                scales: {
                    x: {
                        grid: { color: '#2E3A59' },
                        ticks: { color: '#FFFFFF' }
                    },
                    y: {
                        grid: { color: '#2E3A59' },
                        ticks: { color: '#FFFFFF' }
                    }
                }
            }
        });
    };

    // Book Management System
    const bookList = document.getElementById('book-list');
    const bookCount = document.getElementById('book-count');
    const createBookBtn = document.getElementById('create-book-btn');
    const bookDialog = document.getElementById('book-creation-dialog');
    const cancelBtn = document.getElementById('cancel-book-creation');
    const bookForm = document.getElementById('book-form');

    let books = [
        {
            title: 'The AI Revolution',
            progress: 70,
            duration: '1hr 29min',
            created: '2024-02-15'
        },
        {
            title: 'Machine Learning Basics',
            progress: 45,
            duration: '45min',
            created: '2024-02-14'
        },
        {
            title: 'Future of Programming',
            progress: 90,
            duration: '2hr 15min',
            created: '2024-02-13'
        }
    ];

    const renderBooks = () => {
        bookList.innerHTML = '';
        books.forEach(book => {
            const bookEl = document.createElement('div');
            bookEl.className = 'book-item';
            bookEl.innerHTML = `
            <div class="book-image-placeholder"></div>
            <div class="book-info">
                <h3>${book.title}</h3>
                <small>Created: ${book.created}</small>
            </div>
            <div class="book-stats">
                <div class="generation-progress">${book.progress}%</div>
                <span class="duration">${book.duration}</span>
                <button class="download-btn">⇣</button>
            </div>
        `;
            bookList.appendChild(bookEl);
        });
        bookCount.textContent = books.length;
    };

    // Dialog Handlers
    createBookBtn.addEventListener('click', () => bookDialog.showModal());
    cancelBtn.addEventListener('click', () => bookDialog.close());

    bookForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(bookForm);
        const newBook = {
            title: formData.get('book-title'),
            progress: 0,
            duration: 'Starting...',
            created: new Date().toISOString().split('T')[0]
        };

        books.unshift(newBook);
        renderBooks();
        bookForm.reset();
        bookDialog.close();
    });

    // Book Hover Effects
    document.addEventListener('mouseover', (e) => {
        if (e.target.closest('.book-item')) {
            e.target.closest('.book-item').style.transform = 'translateY(-5px)';
        }
    });

    document.addEventListener('mouseout', (e) => {
        if (e.target.closest('.book-item')) {
            e.target.closest('.book-item').style.transform = 'none';
        }
    });

    // Initialization
    initTokenChart();
    renderBooks();
});