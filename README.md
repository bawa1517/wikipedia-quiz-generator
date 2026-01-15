# Wikipedia Quiz Generator

A full-stack web application that generates educational multiple-choice quizzes from Wikipedia articles using AI. Transform any Wikipedia article into an interactive quiz with automatically generated questions, answers, and explanations.

Home:
<img width="2159" height="1376" alt="image" src="https://github.com/user-attachments/assets/b145a64a-aabe-4acf-99ee-48da3ade9179" />

Generated Quiz:
<img width="2159" height="1371" alt="image" src="https://github.com/user-attachments/assets/bd6a3670-c1b8-4711-8703-c52b91f7605c" />

Take Quiz:
<img width="2159" height="1247" alt="image" src="https://github.com/user-attachments/assets/2f639d94-1491-4412-af7b-3a76eea1a278" />

History:
<img width="2159" height="1248" alt="image" src="https://github.com/user-attachments/assets/e6559134-97c1-4703-9cd3-376cf682698f" />


## ✨ Features

- **AI-Powered Quiz Generation**: Uses Groq's LLM (Llama 3.1) to generate high-quality quiz questions from Wikipedia articles
- **Wikipedia Article Scraping**: Automatically extracts content from English Wikipedia articles
- **Interactive Quiz Interface**: Take quizzes with immediate feedback and explanations
- **Quiz History**: View and manage previously generated quizzes
- **Smart Caching**: Automatically caches quizzes to avoid regenerating the same content
- **Related Topics**: Suggests related Wikipedia topics for further learning
- **Beautiful UI**: Modern, responsive design with smooth animations

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - Database ORM
- **PostgreSQL** - Database
- **LangChain** - LLM integration framework
- **Groq API** - Fast LLM inference (Llama 3.1)
- **BeautifulSoup4** - Web scraping
- **Uvicorn** - ASGI server

### Frontend
- **Vanilla JavaScript** - No framework dependencies
- **HTML5 & CSS3** - Modern web standards
- **Fetch API** - RESTful API communication

## 📋 Prerequisites

- Python 3.8+ 
- PostgreSQL database
- Groq API key ([Get one here](https://console.groq.com/))
- Node.js (optional, for serving frontend)

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/bawa1517/wikipedia-quiz-generator.git
cd wiki-quiz-app
```

### 2. Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

### 3. Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE wiki_quiz_db;
```

### 4. Environment Configuration

Create a `.env` file in the `backend` directory:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/wiki_quiz_db

# Groq API
GROQ_API_KEY=your_groq_api_key_here
```

Replace:
- `username` and `password` with your PostgreSQL credentials
- `your_groq_api_key_here` with your actual Groq API key

### 5. Frontend Setup

The frontend is static HTML/CSS/JavaScript. No build process required!

## 🏃 Running the Application

### Backend Server

```bash
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at `http://localhost:8000`
- API docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

### Frontend Server

You can serve the frontend in several ways:

**Option 1: Python HTTP Server**
```bash
cd frontend
python -m http.server 3000
```

**Option 2: Node.js HTTP Server**
```bash
cd frontend
npx http-server -p 3000
```

**Option 3: Open Directly**
Simply open `frontend/index.html` in your browser (CORS may need to be configured)

The frontend will be available at `http://localhost:3000`

## 📡 API Endpoints

### Generate Quiz
```http
POST /api/generate-quiz
Content-Type: application/json

{
  "url": "https://en.wikipedia.org/wiki/Alan_Turing"
}
```

**Response:**
```json
{
  "id": 1,
  "url": "https://en.wikipedia.org/wiki/Alan_Turing",
  "title": "Alan Turing",
  "summary": "Article summary...",
  "quiz": [
    {
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "Correct option",
      "difficulty": "easy|medium|hard",
      "explanation": "Explanation text",
      "section_reference": "Section name"
    }
  ],
  "related_topics": ["Topic 1", "Topic 2"],
  "sections": ["Section 1", "Section 2"],
  "created_at": "2024-01-15T10:30:00"
}
```

### Get All Quizzes
```http
GET /api/quizzes
```

### Get Quiz by ID
```http
GET /api/quizzes/{quiz_id}
```

### Delete Quiz
```http
DELETE /api/quizzes/{quiz_id}
```

### Health Check
```http
GET /health
```

## 📁 Project Structure

```
wiki-quiz-app/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI application
│   │   ├── database.py          # Database configuration
│   │   ├── models.py            # SQLAlchemy models
│   │   ├── schemas.py           # Pydantic schemas
│   │   ├── scraper.py           # Wikipedia scraper
│   │   └── quiz_generator.py    # AI quiz generator
│   ├── prompt_quiz.txt          # LLM prompt template
│   └── requirements.txt         # Python dependencies
├── frontend/
│   ├── index.html              # Main HTML file
│   ├── script.js               # Frontend JavaScript
│   └── styles.css              # Styling
├── sample_data/
│   ├── sample_output.json      # Example quiz output
│   └── urls.txt                # Sample Wikipedia URLs
└── README.md                   # This file
```

## 💻 Usage

### Generating a Quiz

1. Open the frontend in your browser (`http://localhost:3000`)
2. Enter a Wikipedia article URL (e.g., `https://en.wikipedia.org/wiki/Alan_Turing`)
3. Click "Generate Quiz"
4. Wait 30-60 seconds for the quiz to be generated
5. View the quiz questions, answers, and explanations

### Taking a Quiz

1. Click "Take Quiz" on any generated quiz
2. Answer the multiple-choice questions
3. Click "Submit Quiz" to see your score
4. Review explanations for each question

### Viewing Quiz History

1. Click the "Past Quizzes" tab
2. Browse previously generated quizzes
3. View, take, or delete quizzes

## 🔧 Configuration

### Changing the LLM Model

Edit `backend/app/quiz_generator.py`:

```python
self.llm = ChatGroq(
    api_key=api_key,
    model="llama-3.1-8b-instant",  # Change model here
    temperature=0.3
)
```

Available models:
- `llama-3.1-8b-instant` (default, fast)
- `llama-3.1-70b-versatile` (more accurate, slower)

### Customizing the Prompt

Edit `backend/prompt_quiz.txt` to modify how quizzes are generated.

## 🐛 Troubleshooting

### Quiz Generation Fails

- **Check API Key**: Ensure `GROQ_API_KEY` is set correctly in `.env`
- **Check Database**: Verify PostgreSQL is running and `DATABASE_URL` is correct
- **Check URL Format**: Only English Wikipedia URLs are supported (`https://en.wikipedia.org/wiki/...`)
- **Check Logs**: Review backend server logs for detailed error messages

### Frontend Can't Connect to Backend

- **Check CORS**: Ensure backend is running and CORS is enabled
- **Check Ports**: Verify backend is on port 8000 and frontend on port 3000
- **Check API URL**: Ensure `API_BASE_URL` in `frontend/script.js` matches your backend URL

### Database Errors

- **Check Connection**: Verify PostgreSQL is running
- **Check Credentials**: Ensure database username, password, and database name are correct
- **Create Tables**: Tables are auto-created on first run, but you can manually run migrations if needed

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `GROQ_API_KEY` | Groq API key for LLM access | Yes |

## 🙏 Acknowledgments

- [Groq](https://groq.com/) for fast LLM inference
- [Wikipedia](https://www.wikipedia.org/) for the content source
- [FastAPI](https://fastapi.tiangolo.com/) for the excellent web framework
- [LangChain](https://www.langchain.com/) for LLM integration tools

---

**Happy Learning! 📚✨**
