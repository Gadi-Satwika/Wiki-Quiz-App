from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# We will store this in a .env file later
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:password@localhost/wiki_quiz_db"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency to get the DB session in our routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()