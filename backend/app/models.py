from sqlalchemy import Column, Integer, String, JSON, Text
from .database import Base

class QuizHistory(Base):
    __tablename__ = "quiz_history"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(String, index=True)
    title = Column(String)
    summary = Column(Text)
    # Storing complex data as JSON
    key_entities = Column(JSON) 
    quiz_content = Column(JSON)
    related_topics = Column(JSON)
    raw_html = Column(Text) # For the bonus point requirement