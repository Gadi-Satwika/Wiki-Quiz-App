from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from . import models, database, scraper, llm_service
import os

# Create the database tables
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

# ENABLE CORS (So your React frontend can talk to this Python backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Your React URL
    allow_credentials=True,
    allow_methods=["*"], # <--- ENSURE DELETE IS HERE
    allow_headers=["*"],
)

@app.post("/generate-quiz")
async def generate_quiz(payload: dict, db: Session = Depends(database.get_db)):
    url = payload.get("url")
    force_refresh = payload.get("force_refresh", False)
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")

    if not force_refresh:
        existing_entry = db.query(models.QuizHistory).filter(models.QuizHistory.url == url).first()
        if existing_entry:
            return {
                "id": existing_entry.id,
                "is_cached": True,  # <--- ADD THIS LINE
                "url": existing_entry.url,
                "title": existing_entry.title,
                "summary": existing_entry.summary,
                "key_entities": existing_entry.key_entities,
                "quiz_content": existing_entry.quiz_content,
                "related_topics": existing_entry.related_topics
            }

# For a fresh generation, add: "is_cached": False
    print(f"CACHE MISS: Scraping and Generating new quiz for {url}")
    # 1. Scrape the Wikipedia Article
    scraped_data = scraper.scrape_wikipedia_article(url)

    # 2. Use LLM to generate the quiz
    quiz_data = llm_service.generate_quiz_from_text(scraped_data["text"])

    # 3. Save to PostgreSQL (Safely)
    new_entry = models.QuizHistory(
        url=url,
        title=scraped_data["title"],
        # .get("key", default) prevents the KeyError
        summary=quiz_data.get("summary", "No summary generated."),
        key_entities=quiz_data.get("key_entities", {"people": [], "organizations": [], "locations": []}),
        quiz_content=quiz_data.get("quiz_content", []),
        related_topics=quiz_data.get("related_topics", []),
        raw_html=scraped_data["raw_html"]
    )
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)

    return new_entry

@app.get("/history")
async def get_history(db: Session = Depends(database.get_db)):
    # Returns all past quizzes for Tab 2
    return db.query(models.QuizHistory).all()

@app.delete("/quizzes/{quiz_id}")
def delete_quiz(quiz_id: int, db: Session = Depends(database.get_db)):
    db_quiz = db.query(models.QuizHistory).filter(models.QuizHistory.id == quiz_id).first()
    if not db_quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    db.delete(db_quiz)
    db.commit()
    return {"message": "Quiz deleted successfully"}

if __name__ == "__main__":
    import uvicorn
    import os
    # Render provides a PORT environment variable; if not found, it defaults to 8000
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)