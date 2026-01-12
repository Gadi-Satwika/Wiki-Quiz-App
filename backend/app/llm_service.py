import os
import json
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field
from typing import List, Dict
from dotenv import load_dotenv

# Load API keys from .env
load_dotenv()

# --- STEP 1: DEFINE PROFESSIONAL DATA MODELS (Pydantic) ---
# This ensures the AI output is always valid and consistent.

class QuizQuestion(BaseModel):
    question: str = Field(description="A clear, challenging quiz question")
    options: List[str] = Field(description="A list of 4 distinct options")
    answer: str = Field(description="The exact string matching the correct option")
    difficulty: str = Field(description="easy, medium, or hard")
    explanation: str = Field(description="A detailed 2-sentence explanation of the factual answer")
    resource_hint: str = Field(description="A specific sub-topic name for the user to research more")

class ResourceLink(BaseModel):
    title: str = Field(description="Title of the learning resource")
    description: str = Field(description="Why this resource is helpful")
    search_query: str = Field(description="A specific search term for YouTube or Google")

class QuizResponse(BaseModel):
    summary: str = Field(description="A professional 3-sentence summary of the article")
    key_entities: Dict[str, List[str]] = Field(description="Categorized entities: people, organizations, locations")
    quiz: List[QuizQuestion] = Field(description="A list of 10 high-quality quiz questions")
    related_topics: List[ResourceLink] = Field(description="3-4 curated search queries for deeper learning")

# --- STEP 2: THE GENERATION FUNCTION ---

def generate_quiz_from_text(article_text: str):
    """
    Takes Wikipedia text and transforms it into a structured, professional quiz
    using LangChain and Groq's Llama-3.3-70b-versatile model.
    """
    
    # Initialize the LLM (Using Groq for speed and 0-404 reliability)
    llm = ChatGroq(
        #model_name="llama-3.3-70b-versatile",
        model_name="llama-3.1-8b-instant",
        groq_api_key=os.getenv("GROQ_API_KEY"),
        temperature=0.5 # Balanced for factual accuracy and clear wording
    )

    # Setup the Output Parser
    parser = JsonOutputParser(pydantic_object=QuizResponse)

    # Professional Prompt Template
    # We use instructions that demand high content validity and clear objectives.
    template = """
    You are an expert Senior Educator and AI content specialist. 
    Your task is to analyze the provided Wikipedia text and create a comprehensive assessment.
    
    INSTRUCTIONS:
    1. Generate more than 10 questions and each question should contain exact of 4 options.
    2. Ensure a mix of difficulty levels: 3 easy, 4 medium, 3 hard.
    3. For each answer, provide a detailed explanation that reinforces the learning objective.
    4. Extract key entities found in the text.
    5. Suggest search queries for YouTube and Google to help the student learn more.
    
    {format_instructions}

    IMPORTANT: You must provide 3-5 'related_topics' which are 
    Wikipedia-style subjects related to the text.
    
    WIKIPEDIA TEXT:
    {text}
    """

    prompt = PromptTemplate(
        template=template,
        input_variables=["text"],
        partial_variables={"format_instructions": parser.get_format_instructions()},
    )

    # The LangChain Chain (LCEL)
    chain = prompt | llm | parser

    try:
        # 1. This runs the AI and gets the JSON back based on your Pydantic model
        raw_result = chain.invoke({"text": article_text[:8000]})
        
        # 2. PRINT this to your terminal so you can see what the AI actually sent
        print("DEBUG AI RESPONSE:", raw_result.keys())

        # 3. We must MANUALLY map 'quiz' to 'quiz_content' 
        # because your Pydantic model uses 'quiz' but your DB/UI uses 'quiz_content'
        return {
            "summary": raw_result.get("summary", ""),
            "key_entities": raw_result.get("key_entities", {}),
            "quiz_content": raw_result.get("quiz", []),  # <--- CRITICAL FIX
            "related_topics": raw_result.get("related_topics", [])
        }
    except Exception as e:
        print(f"LLM SERVICE ERROR: {str(e)}")
        raise Exception(f"AI failed to structure the quiz correctly: {str(e)}")