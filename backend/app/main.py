from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import logging

from .database import engine, get_db, Base
from .models import WikiQuiz
from .schemas import QuizRequest, QuizResponse, QuizListItem
from .scraper import WikipediaScraper
from .quiz_generator import QuizGenerator

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Wikipedia Quiz Generator API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
scraper = WikipediaScraper()
quiz_gen = QuizGenerator()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.post("/api/generate-quiz", response_model=QuizResponse, status_code=201)
async def generate_quiz(request: QuizRequest, db: Session = Depends(get_db)):
    """Generate a quiz from a Wikipedia article URL"""
    url_str = str(request.url)
    
    # Check if quiz already exists (caching)
    existing_quiz = db.query(WikiQuiz).filter(WikiQuiz.url == url_str).first()
    if existing_quiz:
        logger.info(f"Returning cached quiz for {url_str}")
        return existing_quiz
    
    try:
        # Scrape article
        logger.info(f"Scraping article: {url_str}")
        article_data, raw_html = scraper.scrape_article(url_str)
        
        # Generate quiz
        logger.info(f"Generating quiz for: {article_data['title']}")
        quiz = quiz_gen.generate_quiz(article_data)
        
        # Generate related topics
        logger.info(f"Generating related topics")
        related_topics = quiz_gen.generate_related_topics(article_data)
        
        # Save to database
        db_quiz = WikiQuiz(
            url=url_str,
            title=article_data['title'],
            summary=article_data['summary'],
            key_entities=article_data['key_entities'],
            sections=article_data['sections'],
            quiz=quiz,
            related_topics=related_topics,
            raw_html=raw_html[:50000] if raw_html else None  # Limit HTML storage
        )
        
        db.add(db_quiz)
        db.commit()
        db.refresh(db_quiz)
        
        logger.info(f"Quiz generated successfully with ID: {db_quiz.id}")
        return db_quiz
        
    except Exception as e:
        logger.error(f"Error generating quiz: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/quizzes", response_model=List[QuizListItem])
async def get_quizzes(db: Session = Depends(get_db)):
    """Get all quiz history"""
    quizzes = (db.query(WikiQuiz).order_by(WikiQuiz.created_at.desc()).limit(50).all())
    return quizzes

@app.get("/api/quizzes/{quiz_id}", response_model=QuizResponse)
async def get_quiz(quiz_id: int, db: Session = Depends(get_db)):
    """Get a specific quiz by ID"""
    quiz = db.query(WikiQuiz).filter(WikiQuiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return quiz

@app.delete("/api/quizzes/{quiz_id}")
async def delete_quiz(quiz_id: int, db: Session = Depends(get_db)):
    """Delete a quiz"""
    quiz = db.query(WikiQuiz).filter(WikiQuiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    db.delete(quiz)
    db.commit()
    return {"message": "Quiz deleted successfully"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/")
async def root():
    return {"message": "Wikipedia Quiz Generator API", "version": "1.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)