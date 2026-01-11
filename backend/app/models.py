from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from datetime import datetime
from .database import Base

class WikiQuiz(Base):
    __tablename__ = "wiki_quizzes"
    
    id = Column(Integer, primary_key=True, index=True)
    url = Column(String, unique=True, index=True)
    title = Column(String)
    summary = Column(Text)
    key_entities = Column(JSON)
    sections = Column(JSON)
    quiz = Column(JSON)
    related_topics = Column(JSON)
    raw_html = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)