const API_BASE = 'http://localhost:8000/api';

/* =========================
   DOM ELEMENTS
========================= */
const generateTab = document.getElementById('generate-tab');
const historyTab = document.getElementById('history-tab');
const tabBtns = document.querySelectorAll('.tab-btn');
const wikiUrlInput = document.getElementById('wiki-url');
const generateBtn = document.getElementById('generate-btn');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('error-message');
const quizDisplay = document.getElementById('quiz-display');
const historyTbody = document.getElementById('history-tbody');
const historyTable = document.getElementById('history-table');
const noHistory = document.getElementById('no-history');
const historyLoading = document.getElementById('history-loading');
const quizModal = document.getElementById('quiz-modal');
const takeQuizModal = document.getElementById('take-quiz-modal');
const modalBody = document.getElementById('modal-body');
const takeQuizBody = document.getElementById('take-quiz-body');
const modalClose = document.querySelector('.modal-close');
const modalCloseQuiz = document.querySelector('.modal-close-quiz');

/* =========================
   STATE
========================= */
let currentQuizData = null;
let userAnswers = {};
let quizHistory = [];

/* =========================
   INIT
========================= */
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadHistory();
});

/* =========================
   EVENT LISTENERS
========================= */
function setupEventListeners() {
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    generateBtn.addEventListener('click', generateQuiz);

    wikiUrlInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') generateQuiz();
    });

    modalClose.onclick = () => quizModal.style.display = 'none';

    modalCloseQuiz.onclick = () => {
        takeQuizModal.style.display = 'none';
        userAnswers = {};
    };

    window.onclick = e => {
        if (e.target === quizModal) quizModal.style.display = 'none';
        if (e.target === takeQuizModal) {
            takeQuizModal.style.display = 'none';
            userAnswers = {};
        }
    };
}

/* =========================
   TAB SWITCHING
========================= */
function switchTab(tab) {
    tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    generateTab.classList.toggle('active', tab === 'generate');
    historyTab.classList.toggle('active', tab === 'history');
    if (tab === 'history') loadHistory();
}

/* =========================
   GENERATE QUIZ
========================= */
async function generateQuiz() {
    if (generateBtn.disabled) return;

    const url = wikiUrlInput.value.trim();
    if (!url) return showError('Please enter a Wikipedia URL');
    if (!url.includes('wikipedia.org/wiki/'))
        return showError('Please enter a valid Wikipedia article URL');

    hideError();
    quizDisplay.style.display = 'none';
    loading.style.display = 'block';
    generateBtn.disabled = true;
    toggleBtnLoading(true);

    try {
        const res = await fetch(`${API_BASE}/generate-quiz`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || 'Failed to generate quiz');
        }

        currentQuizData = await res.json();
        displayQuiz(currentQuizData);
    } catch (err) {
        showError(err.message);
    } finally {
        loading.style.display = 'none';
        generateBtn.disabled = false;
        toggleBtnLoading(false);
    }
}

function toggleBtnLoading(isLoading) {
    generateBtn.querySelector('.btn-text').style.display = isLoading ? 'none' : 'inline';
    generateBtn.querySelector('.btn-loader').style.display = isLoading ? 'inline' : 'none';
}

/* =========================
   DISPLAY QUIZ
========================= */
function displayQuiz(data) {
    quizDisplay.style.display = 'block';

    quizDisplay.innerHTML = `
        <div class="quiz-header">
            <h2>${escapeHtml(data.title)}</h2>
            <p class="summary">${escapeHtml(data.summary)}</p>
            <a href="${escapeHtml(data.url)}" target="_blank" class="article-link">
                📖 View Original Article →
            </a>
        </div>

        <div class="quiz-section">
            <h2>
                📝 Quiz Questions (${data.quiz.length})
                <button class="take-quiz-btn" onclick="openTakeQuizModal()">🎯 Take Quiz</button>
            </h2>
            ${data.quiz.map((q, i) => createQuestionCard(q, i)).join('')}
        </div>

        <div class="related-topics">
            <h3>🔗 Related Topics</h3>
            <div class="topics-list">
                ${data.related_topics.map(t => `
                    <a class="topic-tag" target="_blank"
                       href="https://en.wikipedia.org/wiki/${encodeURIComponent(t)}">
                        ${escapeHtml(t)}
                    </a>`).join('')}
            </div>
        </div>
    `;
}

function createQuestionCard(q, i) {
    return `
        <div class="question-card">
            <div class="question-header">
                <div class="question-number">${i + 1}</div>
                <div class="question-text">${escapeHtml(q.question)}</div>
                <span class="difficulty-badge difficulty-${q.difficulty}">
                    ${q.difficulty}
                </span>
            </div>

            <div class="options">
                ${q.options.map(o => `<div class="option">${escapeHtml(o)}</div>`).join('')}
            </div>

            <div class="answer-section">
                <strong>✓ Correct Answer:</strong> ${escapeHtml(q.answer)}
                <div class="explanation">${escapeHtml(q.explanation)}</div>
            </div>
        </div>
    `;
}

/* =========================
   HISTORY
========================= */
async function loadHistory() {
    historyLoading.style.display = 'block';
    historyTable.style.display = 'none';
    noHistory.style.display = 'none';

    try {
        const res = await fetch(`${API_BASE}/quizzes`);
        if (!res.ok) throw new Error();
        quizHistory = await res.json();

        if (!quizHistory.length) {
            noHistory.style.display = 'block';
        } else {
            historyTbody.innerHTML = quizHistory.map(q => `
                <tr>
                    <td>${q.id}</td>
                    <td>${escapeHtml(q.title)}</td>
                    <td><a href="${escapeHtml(q.url)}" target="_blank">View</a></td>
                    <td>${new Date(q.created_at).toLocaleString()}</td>
                    <td>
                        <button class="btn-small" onclick="viewDetails(${q.id})">View</button>
                        <button class="btn-small btn-delete" onclick="deleteQuiz(${q.id})">Delete</button>
                    </td>
                </tr>`).join('');
            historyTable.style.display = 'table';
        }
    } catch {
        noHistory.textContent = 'Failed to load history';
        noHistory.style.display = 'block';
    } finally {
        historyLoading.style.display = 'none';
    }
}

/* =========================
   TAKE QUIZ MODE
========================= */
function openTakeQuizModal() {
    userAnswers = {};
    renderQuizTaking();
    takeQuizModal.style.display = 'block';
}

function renderQuizTaking() {
    const q = currentQuizData.quiz;
    const answered = Object.keys(userAnswers).length;
    const progress = (answered / q.length) * 100;

    takeQuizBody.innerHTML = `
        <div class="quiz-progress">
            <div class="progress-bar">
                <div class="progress-fill" style="width:${progress}%"></div>
            </div>
            ${answered}/${q.length} answered
        </div>

        ${q.map((ques, i) => `
            <div class="question-card">
                <div class="question-text">${escapeHtml(ques.question)}</div>
                <div class="options">
                    ${ques.options.map(opt => `
                        <div class="option ${userAnswers[i] === opt ? 'selected' : ''}"
                             data-q="${i}" data-opt="${escapeHtml(opt)}">
                            ${escapeHtml(opt)}
                        </div>`).join('')}
                </div>
            </div>`).join('')}

        <button class="submit-quiz-btn"
            ${answered < q.length ? 'disabled' : ''}
            onclick="submitQuiz()">Submit Quiz</button>
    `;

    attachOptionHandlers();
}

function attachOptionHandlers() {
    document.querySelectorAll('.option[data-q]').forEach(el => {
        el.onclick = () => {
            userAnswers[el.dataset.q] = el.dataset.opt;
            renderQuizTaking();
        };
    });
}

function submitQuiz() {
    const q = currentQuizData.quiz;
    let score = 0;
    q.forEach((x, i) => userAnswers[i] === x.answer && score++);
    takeQuizBody.innerHTML = `<h2>Your Score: ${score}/${q.length}</h2>`;
}

/* =========================
   UTILITIES
========================= */
function showError(msg) {
    errorMessage.textContent = msg;
    errorMessage.style.display = 'block';
}

function hideError() {
    errorMessage.style.display = 'none';
}

function escapeHtml(text) {
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
}
