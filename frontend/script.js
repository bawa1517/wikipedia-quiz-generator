const API_BASE_URL = 'http://localhost:8000';

// Tab switching
document.addEventListener('DOMContentLoaded', function() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // Update active button
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update active pane
            tabPanes.forEach(pane => pane.classList.remove('active'));
            document.getElementById(`${targetTab}-tab`).classList.add('active');
            
            // Load history if switching to history tab
            if (targetTab === 'history') {
                loadHistory();
            }
        });
    });
    
    // Generate quiz button
    const generateBtn = document.getElementById('generate-btn');
    generateBtn.addEventListener('click', generateQuiz);
    
    // Modal close handlers
    const modalClose = document.querySelector('.modal-close');
    const modalCloseQuiz = document.querySelector('.modal-close-quiz');
    const quizModal = document.getElementById('quiz-modal');
    const takeQuizModal = document.getElementById('take-quiz-modal');
    
    if (modalClose) {
        modalClose.addEventListener('click', () => {
            quizModal.style.display = 'none';
        });
    }
    
    if (modalCloseQuiz) {
        modalCloseQuiz.addEventListener('click', () => {
            takeQuizModal.style.display = 'none';
        });
    }
    
    window.addEventListener('click', (e) => {
        if (e.target === quizModal) {
            quizModal.style.display = 'none';
        }
        if (e.target === takeQuizModal) {
            takeQuizModal.style.display = 'none';
        }
    });
});

async function generateQuiz() {
    const urlInput = document.getElementById('wiki-url');
    const url = urlInput.value.trim();
    
    if (!url) {
        showError('Please enter a Wikipedia URL');
        return;
    }
    
    if (!url.startsWith('https://en.wikipedia.org/wiki/')) {
        showError('Please enter a valid English Wikipedia URL');
        return;
    }
    
    // Hide previous results and errors
    hideError();
    document.getElementById('quiz-display').style.display = 'none';
    
    // Show loading
    const loading = document.getElementById('loading');
    const generateBtn = document.getElementById('generate-btn');
    const btnText = generateBtn.querySelector('.btn-text');
    const btnLoader = generateBtn.querySelector('.btn-loader');
    
    loading.style.display = 'block';
    generateBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline';
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/generate-quiz`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: url })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to generate quiz');
        }
        
        const quizData = await response.json();
        displayQuiz(quizData);
        
    } catch (error) {
        console.error('Error generating quiz:', error);
        showError(error.message || 'Failed to generate quiz. Please try again.');
    } finally {
        loading.style.display = 'none';
        generateBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
    }
}

function displayQuiz(quizData) {
    const quizDisplay = document.getElementById('quiz-display');
    
    let html = `
        <div class="quiz-header">
            <h2>${escapeHtml(quizData.title)}</h2>
            <p class="summary">${escapeHtml(quizData.summary)}</p>
            <a href="${escapeHtml(quizData.url)}" target="_blank" class="article-link">
                📖 View Article
            </a>
        </div>
        
        <div class="quiz-actions">
            <button class="btn-secondary" onclick="takeQuiz(${quizData.id})">Take Quiz</button>
            <button class="btn-secondary" onclick="viewQuizDetails(${quizData.id})">View Details</button>
        </div>
        
        <div class="quiz-stats">
            <span><strong>${quizData.quiz.length}</strong> Questions</span>
            <span><strong>${quizData.sections.length}</strong> Sections</span>
            <span><strong>${quizData.related_topics.length}</strong> Related Topics</span>
        </div>
        
        <div class="quiz-list">
    `;
    
    quizData.quiz.forEach((question, index) => {
        const difficultyClass = question.difficulty.toLowerCase();
        html += `
            <div class="quiz-item">
                <div class="question-header">
                    <span class="question-number">Q${index + 1}</span>
                    <span class="difficulty-badge ${difficultyClass}">${question.difficulty}</span>
                </div>
                <h3 class="question-text">${escapeHtml(question.question)}</h3>
                <ul class="options-list">
        `;
        
        question.options.forEach((option, optIndex) => {
            const isCorrect = option === question.answer;
            html += `
                <li class="option ${isCorrect ? 'correct' : ''}">
                    ${String.fromCharCode(65 + optIndex)}. ${escapeHtml(option)}
                    ${isCorrect ? ' ✓' : ''}
                </li>
            `;
        });
        
        html += `
                </ul>
                <div class="explanation">
                    <strong>Explanation:</strong> ${escapeHtml(question.explanation)}
                </div>
                ${question.section_reference ? `<div class="section-ref">Section: ${escapeHtml(question.section_reference)}</div>` : ''}
            </div>
        `;
    });
    
    html += `
        </div>
        
        <div class="related-topics">
            <h3>Related Topics</h3>
            <div class="topics-list">
    `;
    
    quizData.related_topics.forEach(topic => {
        html += `<span class="topic-tag">${escapeHtml(topic)}</span>`;
    });
    
    html += `
            </div>
        </div>
    `;
    
    quizDisplay.innerHTML = html;
    quizDisplay.style.display = 'block';
}

async function loadHistory() {
    const historyTbody = document.getElementById('history-tbody');
    const historyLoading = document.getElementById('history-loading');
    const noHistory = document.getElementById('no-history');
    const historyTable = document.getElementById('history-table');
    
    historyLoading.style.display = 'block';
    historyTable.style.display = 'none';
    noHistory.style.display = 'none';
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/quizzes`);
        
        if (!response.ok) {
            throw new Error('Failed to load history');
        }
        
        const quizzes = await response.json();
        historyLoading.style.display = 'none';
        
        if (quizzes.length === 0) {
            noHistory.style.display = 'block';
            return;
        }
        
        historyTbody.innerHTML = '';
        quizzes.forEach(quiz => {
            const row = document.createElement('tr');
            const date = new Date(quiz.created_at);
            row.innerHTML = `
                <td>${quiz.id}</td>
                <td>${escapeHtml(quiz.title)}</td>
                <td><a href="${escapeHtml(quiz.url)}" target="_blank">View</a></td>
                <td>${date.toLocaleString()}</td>
                <td>
                    <button class="btn-small" onclick="viewQuizDetails(${quiz.id})">View</button>
                    <button class="btn-small" onclick="takeQuiz(${quiz.id})">Take</button>
                    <button class="btn-small btn-danger" onclick="deleteQuiz(${quiz.id})">Delete</button>
                </td>
            `;
            historyTbody.appendChild(row);
        });
        
        historyTable.style.display = 'table';
        
    } catch (error) {
        console.error('Error loading history:', error);
        historyLoading.style.display = 'none';
        noHistory.style.display = 'block';
    }
}

async function viewQuizDetails(quizId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/quizzes/${quizId}`);
        
        if (!response.ok) {
            throw new Error('Failed to load quiz');
        }
        
        const quizData = await response.json();
        const modalBody = document.getElementById('modal-body');
        const modal = document.getElementById('quiz-modal');
        
        let html = `
            <h2>${escapeHtml(quizData.title)}</h2>
            <p><strong>URL:</strong> <a href="${escapeHtml(quizData.url)}" target="_blank">${escapeHtml(quizData.url)}</a></p>
            <p><strong>Summary:</strong> ${escapeHtml(quizData.summary)}</p>
            <p><strong>Questions:</strong> ${quizData.quiz.length}</p>
            <p><strong>Sections:</strong> ${quizData.sections.join(', ')}</p>
            <h3>Quiz Questions</h3>
            <div class="quiz-details-list">
        `;
        
        quizData.quiz.forEach((question, index) => {
            html += `
                <div class="question-detail">
                    <h4>Q${index + 1}: ${escapeHtml(question.question)}</h4>
                    <p><strong>Options:</strong></p>
                    <ul>
            `;
            question.options.forEach(opt => {
                html += `<li>${escapeHtml(opt)} ${opt === question.answer ? '(Correct)' : ''}</li>`;
            });
            html += `
                    </ul>
                    <p><strong>Explanation:</strong> ${escapeHtml(question.explanation)}</p>
                    <p><strong>Difficulty:</strong> ${question.difficulty}</p>
                </div>
            `;
        });
        
        html += `</div>`;
        modalBody.innerHTML = html;
        modal.style.display = 'block';
        
    } catch (error) {
        console.error('Error loading quiz details:', error);
        alert('Failed to load quiz details');
    }
}

async function takeQuiz(quizId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/quizzes/${quizId}`);
        
        if (!response.ok) {
            throw new Error('Failed to load quiz');
        }
        
        const quizData = await response.json();
        const modalBody = document.getElementById('take-quiz-body');
        const modal = document.getElementById('take-quiz-modal');
        
        let html = `
            <h2>${escapeHtml(quizData.title)} - Quiz</h2>
            <div id="quiz-container">
        `;
        
        quizData.quiz.forEach((question, index) => {
            html += `
                <div class="quiz-question-container" data-question-index="${index}">
                    <h3>Q${index + 1}: ${escapeHtml(question.question)}</h3>
                    <div class="quiz-options">
            `;
            question.options.forEach((option, optIndex) => {
                html += `
                    <label class="quiz-option-label">
                        <input type="radio" name="question-${index}" value="${escapeHtml(option)}">
                        ${String.fromCharCode(65 + optIndex)}. ${escapeHtml(option)}
                    </label>
                `;
            });
            html += `
                    </div>
                    <div class="quiz-answer" style="display: none;">
                        <strong>Correct Answer:</strong> ${escapeHtml(question.answer)}
                        <p><strong>Explanation:</strong> ${escapeHtml(question.explanation)}</p>
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
                <div class="quiz-controls">
                    <button class="btn-primary" onclick="submitQuiz()">Submit Quiz</button>
                    <button class="btn-secondary" onclick="resetQuiz()">Reset</button>
                </div>
                <div id="quiz-results" style="display: none;"></div>
            </div>
        `;
        
        modalBody.innerHTML = html;
        modal.style.display = 'block';
        
        // Store quiz data globally for submission
        window.currentQuizData = quizData;
        
    } catch (error) {
        console.error('Error loading quiz:', error);
        alert('Failed to load quiz');
    }
}

function submitQuiz() {
    if (!window.currentQuizData) return;
    
    const questions = document.querySelectorAll('.quiz-question-container');
    let score = 0;
    let total = questions.length;
    
    questions.forEach((questionDiv, index) => {
        const selected = questionDiv.querySelector('input[type="radio"]:checked');
        const correctAnswer = window.currentQuizData.quiz[index].answer;
        const answerDiv = questionDiv.querySelector('.quiz-answer');
        
        if (selected) {
            if (selected.value === correctAnswer) {
                score++;
                questionDiv.classList.add('correct');
            } else {
                questionDiv.classList.add('incorrect');
            }
        } else {
            questionDiv.classList.add('not-answered');
        }
        
        answerDiv.style.display = 'block';
    });
    
    const percentage = Math.round((score / total) * 100);
    const resultsDiv = document.getElementById('quiz-results');
    resultsDiv.innerHTML = `
        <h3>Quiz Results</h3>
        <p class="score">You scored ${score} out of ${total} (${percentage}%)</p>
    `;
    resultsDiv.style.display = 'block';
}

function resetQuiz() {
    const questions = document.querySelectorAll('.quiz-question-container');
    questions.forEach(questionDiv => {
        questionDiv.classList.remove('correct', 'incorrect', 'not-answered');
        const selected = questionDiv.querySelector('input[type="radio"]:checked');
        if (selected) selected.checked = false;
        const answerDiv = questionDiv.querySelector('.quiz-answer');
        answerDiv.style.display = 'none';
    });
    document.getElementById('quiz-results').style.display = 'none';
}

async function deleteQuiz(quizId) {
    if (!confirm('Are you sure you want to delete this quiz?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/quizzes/${quizId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete quiz');
        }
        
        loadHistory();
        
    } catch (error) {
        console.error('Error deleting quiz:', error);
        alert('Failed to delete quiz');
    }
}

function showError(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

function hideError() {
    document.getElementById('error-message').style.display = 'none';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
