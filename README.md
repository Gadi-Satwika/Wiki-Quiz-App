# WikiQuiz AI 

Full-Stack Quiz GeneratorAn AI-powered application that transforms Wikipedia knowledge into interactive assessments. 
This project uses LangChain and Llama 3 to parse complex articles and generate structured multiple-choice quizzes.

### Live Deployment:

Frontend (Vercel): [https://wiki-quiz-app-lxa7.vercel.app/]

Backend (Render): [https://wiki-quiz-app-vfx4.onrender.com]

Demo Video: [https://drive.google.com/file/d/11ehvFJxmeeDsRq2OdiszkCMGqUrjdHQL/view?usp=sharing]

###  Tech StackFrontend: 

React (Vite), 

Tailwind CSS (Fully Responsive)

Backend: FastAPI (Python), 

SQLAlchemyDatabase: SQLite (Persistent history storage)

AI Orchestration: LangChainLLM: Groq (Llama-3-8b-Preview)

### Local Setup Instructions
Backend Setup
1. Navigate to the directory: cd backend
2. Install dependencies: pip install -r requirements.txt
3. Create a .env file and add your API key:GROQ_API_KEY=your_key_here
4. Start the server: uvicorn app.main:app --reload2.
5. Frontend SetupNavigate to the directory: cd frontend
6. Install dependencies: npm install
7. Start the development server: npm run dev

 ### API EndpointsMethodEndpoint
 - Description
 - POST/generate-quiz -> Scrapes Wiki URL, generates AI quiz, and saves to DB.
 - GET/quizzes->Retrieves all past quizzes from the SQLite database.
 - GET/quizzes/{id}->Fetches detailed questions for a specific past quiz.
 - DELETE/quizzes/{id}->Removes a quiz record from the history.
 -
### Testing StepsDirect API Test: 
   Go to [https://wiki-quiz-app-vfx4.onrender.com]/docs to use the Swagger UI.
   
   Manual Test: Paste a Wikipedia URL (e.g., https://en.wikipedia.org/wiki/SpaceX) into the frontend.
   
   History Test: Generate a quiz, then switch to the Past Quizzes tab to verify the SQLite persistence.
   
   Responsive Test: Resize the browser window to verify the stacking behavior of the Navbar and Input cards.
   
 ### LangChain Prompt Templates:
   
   These templates are used to ensure the LLM provides consistent, valid JSON output for the frontend.
   
   1. Quiz Generation Template Plaintext
    "You are an expert Senior Educator and AI content specialist. 
     Your task is to analyze the provided Wikipedia text and create a comprehensive assessment.
    
    INSTRUCTIONS:
    1. Generate more than 10 questions and each question should contain exact of 4 options.
    2. Ensure a mix of difficulty levels: 3 easy, 4 medium, 3 hard.
    3. For each answer, provide a detailed explanation that reinforces the learning objective.
    4. Extract key entities found in the text.
    5. Suggest search queries for YouTube and Google to help the student learn more.
    
    {format_instructions}
    
    WIKIPEDIA TEXT: {text}
    "
  2. Related Topics Template Plaintext:
  
  " IMPORTANT: You must provide 3-5 'related_topics' which are 
    Wikipedia-style subjects related to the text." 

### Sample Data Folder (sample_data/)
1. urls.txt: Contains tested URLs like SpaceX.
2. example_response.json: A saved JSON output from the Llama 3 model showing the raw structure of a generated quiz.
  
### Final Note:

The backend is hosted on Render's Free Tier, which may spin down after inactivity. 
Please allow 30-60 seconds for the first quiz to generate while the server wakes up.
