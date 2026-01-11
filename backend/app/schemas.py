from pydantic import BaseModel, HttpUrl
from typing import List, Dict, Optional
from datetime import datetime

class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    answer: str
    difficulty: str
    explanation: str
    section_reference: Optional[str] = None

class KeyEntities(BaseModel):
    people: List[str]
    organizations: List[str]
    locations: List[str]

class QuizRequest(BaseModel):
    url: HttpUrl

class QuizResponse(BaseModel):
    id: int
    url: str
    title: str
    summary: str
    key_entities: KeyEntities
    sections: List[str]
    quiz: List[QuizQuestion]
    related_topics: List[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class QuizListItem(BaseModel):
    id: int
    url: str
    title: str
    created_at: datetime
    
    class Config:
        from_attributes = True