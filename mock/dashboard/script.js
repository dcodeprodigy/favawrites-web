const createFolderBtn = document.querySelector('.nav-btn:first-child');
const folderDialog = document.getElementById('folder-creation-dialog');
const cancelFolderBtn = document.getElementById('cancel-folder-creation');
const folderForm = document.getElementById('folder-form');

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
                        data: [900457, 777345, 1192276, 230300],
                        borderColor: '#00BFA6',
                        backgroundColor: 'rgba(0, 191, 166, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Output Tokens',
                        data: [300233, 421212, 698976, 56888],
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


    createBookBtn.addEventListener("click", ()=> {
        window.location.href = "../create-book/index.html"
    })

    let books = [
        {
            title: 'AI Fundamentals',
            progress: 100,
            duration: '2h 15m',
            status: 'completed',
            chapters: { current: 10, total: 10 }
        },
        {
            title: 'Machine Learning',
            progress: 45,
            duration: '1h 05m',
            status: 'ongoing',
            chapters: { current: 4, total: 9 }
        },
        {
            title: 'Failed Project',
            progress: 68,
            duration: '45m',
            status: 'failed',
            chapters: { current: 7, total: 10 }
        }
    ];

    const renderBooks = () => {
        bookList.innerHTML = '';
        books.forEach(book => {
            const statusClass = `status-${book.status}`;
            const chaptersText = book.chapters ? 
                `${Math.round((book.progress/100)*book.chapters.total)}/${book.chapters.total} chapters` : 
                `${book.progress}% progress`;
    
                bookList.innerHTML += `
                <div class="book-item ${statusClass}">
                    <div class="book-info">
                        <div class="book-image-placeholder"></div>
                        <h3 class="book-title">${book.title}</h3>
                    </div>
            
                    <div class="status-column">
                        <div class="retry-container">
                            ${getRetryButton(book.status)}
                            <div class="progress-indicator" data-tooltip="${chaptersText}">
                                ${book.progress}%
                            </div>
                        </div>
                        <div class="duration" data-tooltip="${getDurationTooltip(book.status)}">
                            ${book.duration}
                        </div>
                        <button class="download-btn ${book.status === 'completed' ? '' : 'disabled'}">
                            <i class="fas fa-download"></i>
                        </button>
                    </div>
                </div>
            `;
        });
    };

    const getDurationTooltip = (status) => {
        const messages = {
            'completed': 'Completed in',
            'ongoing': 'Ongoing -',
            'failed': 'Failed after'
        };
        return messages[status] || 'Generation duration';
    };

    
    
    const getRetryButton = (status) => {
        if(status === 'failed') return `<div class="retry-icon"></div>`;
        if(status === 'ongoing') return `<div class="dash">-</div>`;
        return ''; // No retry indicator for completed
    };
    
    // Add download handlers
    document.addEventListener('click', (e) => {
        if(e.target.closest('.download-btn:not(.disabled)')) {
            const bookTitle = e.target.closest('.book-item').querySelector('.book-title').textContent;
            alert(`Downloading "${bookTitle}"...`);
            // Add actual download logic here
        }
        
        if(e.target.closest('.retry-icon')) {
            const bookItem = e.target.closest('.book-item');
            alert(`Retrying generation for "${bookItem.querySelector('.book-title').textContent}"`);
            // Add retry logic here
        }
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


// Add to existing script
document.addEventListener('click', (e) => {
    const dropdowns = document.querySelectorAll('.dropdown-content');
    dropdowns.forEach(dropdown => {
        if (!dropdown.parentElement.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
});

// Close dropdown when clicking outside
document.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', (e) => {
        // Handle menu item clicks
        const action = e.target.textContent.trim();
        switch(action) {
            case '🚪 Log Out':
                if(confirm('Are you sure you want to log out?')) {
                    // Add logout logic
                    console.log('User logged out');
                }
                break;
            case '📝 Profile':
                // Handle profile action
                break;
            case '⚙️ Settings':
                // Handle settings action
                break;
        }
        e.target.closest('.dropdown-content').style.display = 'none';
    });
});


createFolderBtn.addEventListener('click', () => folderDialog.showModal());
cancelFolderBtn.addEventListener('click', () => folderDialog.close());

folderForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const folderName = document.getElementById('folder-name').value;
    
    if (folderName.trim()) {
        console.log('Creating folder:', folderName);
        // Add your folder creation logic here
        folderDialog.close();
        folderForm.reset();
    } else {
        alert('Please enter a folder name');
    }
});


function openTrain() {
    window.location.href = "../train-model/index.html"
}