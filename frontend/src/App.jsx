import React, { useState,useEffect } from 'react';
import axios from 'axios';
import { BookOpen, History, Loader2, CheckCircle,Trash2 } from 'lucide-react';

// ==========================================
{/* Question Card that is reusable for printing quiz Cards */}
// ==========================================

const QuestionCard = ({ q, idx, isQuizMode, quizSubmitted, onSelect, userSelected }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div className="group p-6 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
      <div className="flex justify-between items-start mb-6">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
          {q.difficulty}
        </span>
        <span className="text-[10px] font-bold text-slate-300 bg-slate-50 px-2 py-1 rounded-md">QUESTION</span>
      </div>

      <p className="font-bold text-xl text-slate-800 mb-6 leading-snug">{q.question}</p>
      
      <div className="space-y-3 mb-6">
        {q.options.map((opt, i) => {
          // Logic for colors:
          // 1. If not in Quiz Mode: Show correct answer immediately (your current view)
          // 2. If in Quiz Mode & Submitted: Show Green/Red results
          // 3. If in Quiz Mode & NOT Submitted: Only highlight what the user clicked in Blue
          const showResults = !isQuizMode || quizSubmitted;
          const isCorrect = opt === q.answer;
          const isUserSelection = userSelected === opt;

          let cardStyle = "bg-slate-50 border-slate-100 text-slate-600";
          
          if (showResults) {
            if (isCorrect) cardStyle = "bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold";
            else if (isUserSelection && !isCorrect) cardStyle = "bg-red-50 border-red-200 text-red-800";
          } else if (isUserSelection) {
            cardStyle = "bg-indigo-50 border-indigo-400 text-indigo-700 font-semibold shadow-sm";
          }

          return (
            <button 
              key={i} 
              onClick={() => onSelect(idx, opt)}
              disabled={quizSubmitted}
              className={`w-full text-left p-4 border rounded-2xl text-sm transition-all duration-200 flex justify-between items-center ${cardStyle}`}
            >
              {opt}
              {showResults && isCorrect && <CheckCircle size={18} className="text-emerald-500" />}
            </button>
          );
        })}
      </div>

      {/* Explanation only shows if we are NOT in hidden quiz mode OR after user finishes */}
      {(!isQuizMode || quizSubmitted) && (
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-center gap-2 w-full py-3 mt-auto text-xs font-bold uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
        >
          {isExpanded ? 'Hide Explanation ▲' : 'Show Explanation ▼'}
        </button>
      )}

      {isExpanded && (
        <div className="mt-4 p-5 bg-slate-50 rounded-2xl border border-slate-200 animate-in fade-in slide-in-from-top-2">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-slate-400">Explanation</h4>
          <p className="text-sm text-slate-700 leading-relaxed italic">"{q.explanation}"</p>
        </div>
      )}
    </div>
  );
};

// ==========================================
const App = () => {
  //Values that are used for entire problem
  const [tab, setTab] = useState('generate');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [history, setHistory] = useState([]);

  const [error, setError] = useState(null);

  const [isQuizMode, setIsQuizMode] = useState(false);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});
  const [score, setScore] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewTitle, setPreviewTitle] = useState("");

  console.log(quizResult) //Checking the json result in console for output testing.

  //If user wants to delete,they can delete the quiz history from 'pastQuizzes' tab.
  const deleteQuiz = async (id) => {
    if (window.confirm("Are you sure you want to remove this quiz from your history?")) {
      try {
        const response = await fetch(`https://wiki-quiz-app-vfx4.onrender.com/quizzes/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          // This line removes the quiz from your UI immediately
          setHistory(prevHistory => prevHistory.filter(quiz => quiz.id !== id));
        } else {
          const errorData = await response.json();
          console.error("Server Error:", errorData);
          alert("Could not delete from server.");
        }
      } catch (error) {
        console.error("Network Error:", error);
        alert("Check if your backend is running!");
      }
    }
  };

  //When user clicks on 'pastQuizzes' tab, the data is fetched from here.
  const fetchHistory = async () => {
    try {
      const res = await axios.get('https://wiki-quiz-app-vfx4.onrender.com/history');
      setHistory(res.data);
    } catch (err) { console.error("History fetch failed"); }
  };

  // ==========================================
  //Just after entering the url in input field, it extracts the "Article Title" from the url provided.
  // ==========================================

  useEffect(() => {
    const fetchPreview = async () => {
      if (url.includes('wikipedia.org/wiki/')) {
        try {
          const titleFromUrl = url.split('/wiki/')[1].replace(/_/g, ' ');
          setPreviewTitle(decodeURIComponent(titleFromUrl));
        } catch (e) {
          setPreviewTitle("");
        }
      } else {
        setPreviewTitle("");
      }
    };
    fetchPreview();
  }, [url]);

  // Add this inside your App component
  // ==========================================
  useEffect(() => {
    document.body.style.overflow = isModalOpen ? 'hidden' : 'unset';
  }, [isModalOpen]);

  // ==========================================
  //The main part where the data is actually fetched from the article.
  // ==========================================
  const handleGenerate = async (forceRefresh = false) => {
    setQuizResult(null); 
    setUserAnswers({}); //clear old answers
    setQuizSubmitted(false);// Hide the "Score" and "Results" view
    setScore(0);// Reset score to zero
    setIsQuizMode(false); // Default back to "Study Mode" first
  // 1. Handle Invalid/Empty URL
    if (!url.trim() || !url.includes('wikipedia.org')) {
      alert("Please enter a valid Wikipedia URL.");
      return;
    }

    setLoading(true);
    setError(null); // Clear previous errors

    try {
      const API_BASE_URL = "https://wiki-quiz-app-vfx4.onrender.com";
      console.log(API_BASE_URL)
      console.log("Hi")
      const response = await fetch(`${API_BASE_URL}/generate-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url ,force_refresh: forceRefresh}),
      });

      const data = await response.json();

      // 2. Handle Server-Side Errors (like the 429 Rate Limit)
      if (!response.ok) {
        throw new Error(data.detail || "Failed to generate quiz. Please try again later.");
      }

      setQuizResult(data);
      setTab('generate');
    } catch (err) {
      // 3. Handle Network Errors
      console.error("Generation Error:", err);
      setError(err.message === "Failed to fetch" 
        ? "Network error: Is the backend server running?" 
        : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* The navbar that is visible in the output with Generate Button and Past Quizzes Button */}
      <nav className="bg-white border-b px-4 sm:px-8 py-4 flex flex-col sm:flex-row justify-between items-center sticky top-0 z-50 gap-4">
        <div className="flex items-center gap-2 text-indigo-600 font-bold text-xl"><BookOpen /> WikiQuiz AI</div>
        <div className="flex gap-4">
          <button onClick={() => setTab('generate')} className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-medium ${tab === 'generate' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>Generate Quiz</button>
          <button onClick={() => { setTab('history'); fetchHistory(); }} className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-medium ${tab === 'history' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>Past Quizzes</button>
        </div>
      </nav>
      {/* The main function */}
      <main className="max-w-5xl mx-auto p-8">
        {tab === 'generate' ? (
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-2xl font-bold mb-4">Wikipedia Article URL</h2>
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Url input field is here.. */}
                <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://en.wikipedia.org/wiki/..." className="flex-1 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-base" />
                <button onClick={() => handleGenerate(false)} disabled={loading || !url} className="w-full sm:w-auto bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 disabled:opacity-50 active:scale-95">
                  {loading ? <Loader2 className="animate-spin" /> : 'Generate'}
                </button>
              </div>
              <div>
                 {/* PREVIEW TITLE IS DISPLAYED */}
                {previewTitle && <p className="text-indigo-600 font-medium text-sm mt-3 ml-2">✨ Preview: {previewTitle}</p>}
                {/* ANY ERROR OCCURING IS DISPLAYED TO 'USER' IMMEDIALTELY HERE */}
                {error && (
                    <div className="mb-6 mt-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                      <div className="bg-red-100 p-2 rounded-full">⚠️</div>
                      <p className="text-sm font-medium">{error}</p>
                      <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">✕</button>
                    </div>
                  )}
              </div>
            </div>

            {quizResult && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                {/* SHOW THIS ONLY IF DATA IS FROM CACHE */}
                {quizResult?.is_cached && (
                <>
                  <span className="flex items-center mt-3 gap-1 px-1 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-half border border-amber-200 uppercase tracking-tighter">
                      <History size={12} />
                      Loaded from History
                  </span>
                  <button 
                      onClick={() => handleGenerate(true)} // Pass a flag to bypass cache
                      className="text-xs text-slate-600 hover:text-indigo-600 underline underline-offset-4"
                    >
                      Article updated? Click to regenerate
                  </button>
                </>
                
              )}
                
                {/* --- 1. ARTICLE INSIGHTS (Summary & Entities) --- */}
                {!isQuizMode&&(
                <div className="bg-white p-3 rounded-3xl shadow-sm border border-slate-200">
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-white text-indigo-600 rounded-xl font-bold border border-slate-200 hover:border-indigo-600 hover:bg-indigo-50 transition-all shadow-sm mt-2"
                  >
                    <BookOpen size={18} /> 
                    <span>View Article Details</span>
                  </button>
                </div>
                )}

                {/* --- 2. THE TOGGLE MODE SECTION --- */}

                <div className="flex gap-4 mb-8 bg-white p-2 rounded-2xl border border-slate-200 w-fit">
                  <button 
                    onClick={() => {setIsQuizMode(false); setQuizSubmitted(false); setScore(null); setUserAnswers({});}}
                    className={`px-6 py-2 rounded-xl font-bold text-sm ${!isQuizMode ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}
                  >
                    Study Mode
                  </button>
                  <button 
                    onClick={() => {setIsQuizMode(true); setQuizSubmitted(false); setScore(null); setUserAnswers({});}}
                    className={`px-6 py-2 rounded-xl font-bold text-sm ${isQuizMode ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}
                  >
                    Take Quiz
                  </button>
                </div>



                {/* --- THE QUIZ CARDS --- */}
                <div className="flex flex-wrap gap-6 items-start"> 
                 {/* --- START OF SECTION-WISE GROUPING --- */}
                  {quizResult && !loading && (
                    <div className="quiz-sections-container mt-10">
                      {['easy', 'medium', 'hard'].map((level) => {
                        // 1. Filter questions for this specific difficulty level
                        const levelQuestions = quizResult.quiz_content.filter(
                          (q) => q.difficulty.toLowerCase() === level
                        );

                        // 2. If no questions exist for this level, don't show the header
                        if (levelQuestions.length === 0) return null;

                        return (
                          <div key={level} className="mb-12">
                            {/* Section Header */}
                            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-2">
                              <span className={`h-3 w-3 rounded-full ${
                                level === 'easy' ? 'bg-green-500' : 
                                level === 'medium' ? 'bg-amber-500' : 'bg-red-500'
                              }`} />
                              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">
                                {level} Questions
                              </h3>
                            </div>

                            {/* Grid for this specific difficulty level */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {levelQuestions.map((q, index) => (
                                <QuestionCard 
                                  key={index} 
                                  q={q} 
                                  // Ensure these props match what your QuestionCard expects:
                                  userSelected={userAnswers[q.question]}
                                  onSelect={(id, selectedOption) => setUserAnswers({...userAnswers, [q.question]: selectedOption})}
                                  isQuizMode={isQuizMode}
                                  quizSubmitted={quizSubmitted}
                                />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {/* --- END OF SECTION-WISE GROUPING --- */}
                </div>

                {/* --- SUBMIT BUTTON --- */}
                {isQuizMode && !quizSubmitted && (
                  <div className="mt-12 text-center">
                    <button 
                      onClick={() => {
                        let total = 0;
                        quizResult.quiz_content.forEach((q) => {
                          if (userAnswers[q.question] === q.answer) total++;
                        });
                        setScore(total);
                        setQuizSubmitted(true);
                      }}
                      className="bg-emerald-600 text-white px-12 py-4 rounded-2xl font-black text-lg hover:bg-emerald-700 shadow-xl shadow-emerald-200 transition-all hover:-translate-y-1"
                    >
                      Submit Quiz & See Score
                    </button>
                  </div>
                )}

                {/* --- SCORE DISPLAY --- */}
                {quizSubmitted && score !== null && (
                  <div className="mt-12 bg-white p-10 rounded-[40px] border-4 border-indigo-100 text-center shadow-2xl animate-in zoom-in duration-500">
                    <h3 className="text-5xl mb-2">🎯</h3>
                    <h4 className="text-4xl font-black text-slate-900">Your Score: {score} / {quizResult.quiz_content.length}</h4>
                    <p className="text-slate-500 mt-4 font-medium uppercase tracking-widest">Quiz Completed Successfully</p>
                  </div>
                )}
                {/* --- 3. FURTHER READING --- */}
                {quizResult.related_topics && quizResult.related_topics.length > 0 && (
                  <div className="mt-12 border-t pt-10 pb-20">
                    <div className="flex items-center gap-2 mb-8">
                      <div className="h-6 w-1 bg-indigo-600 rounded-full"></div>
                      <h3 className="text-xl font-bold text-slate-800 tracking-tight">Further Reading</h3>
                    </div>
                    
                    {/* Fixed Grid: 1 column on mobile, 2 on tablets, 3 on desktops */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {quizResult.related_topics.map((topic, idx) => {
                        const title = typeof topic === 'object' ? topic.title : topic;
                        const desc = typeof topic === 'object' ? topic.description : "Explore more on Wikipedia.";
                        const wikiUrl = `https://en.wikipedia.org/wiki/${title.replace(/ /g, '_')}`;

                        return (
                          <a 
                            key={idx}
                            href={wikiUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-500 hover:shadow-md transition-all duration-300 flex flex-col"
                          >
                            <div className="mb-4">
                              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <BookOpen size={20} className="text-indigo-600" />
                              </div>
                              <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
                                {title}
                              </h4>
                              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                                {desc}
                              </p>
                            </div>
                            
                            <div className="mt-auto pt-4 flex items-center text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                              Read on Wikipedia 
                              <span className="ml-2 group-hover:translate-x-2 transition-transform">→</span>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
            
          </div>
        ) : (
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden w-full px-2 sm:px-0">
            {/*--- TAB-2 --- */}
              {history.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                  <History size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500 font-medium">No past quizzes found!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* This section replaces the <table> entirely */}
                  {history.map((item) => (
                    <div key={item.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                      {/* Title and URL Stacked Vertically */}
                      <div className="mb-4">
                        <h3 className="text-lg font-bold text-slate-800 leading-tight">
                          {item.title}
                        </h3>
                        <p className="text-xs text-indigo-500 break-all mt-1 bg-indigo-50 p-2 rounded-lg">
                          {item.url}
                        </p>
                      </div>
            
                      {/* Action Buttons */}
                      <div className="flex items-center justify-between border-t pt-3 mt-3">
                        <button 
                          onClick={() => {
                            setSelectedHistoryQuiz(item);
                            setShowHistoryModal(true);
                          }}
                          className="flex items-center gap-2 text-indigo-600 font-bold text-sm bg-indigo-50 px-4 py-2 rounded-xl active:scale-95 transition-all"
                        >
                          <Eye size={16} /> View Quiz
                        </button>
                        
                        <button 
                          onClick={() => deleteQuiz(item.id)}
                          className="p-2 text-red-500 bg-red-50 rounded-xl active:scale-95 transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
      </main>
      {/* --- SUMMARY AND ENTITIES MODAL --- */}
      {isModalOpen && (
  /* 1. The Overlay: Added overflow-y-auto and changed flex to items-start for long content */
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md overflow-y-auto pt-10 pb-10 px-4">     
              {/* 2. Clickable background (Overlay logic) */}
          <div className="fixed inset-0" onClick={() => setIsModalOpen(false)}></div>    
              {/* 3. Modal Content: Added my-auto to keep it centered when short, but allowing scroll when long */}
            <div className="relative bg-white w-full max-w-2xl mx-auto rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">      
                {/* Header: Sticky so you always see the close button */}
                <div className="sticky top-0 p-8 border-b flex justify-between items-center bg-white z-10">
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">Article Details</h3>
                  <button onClick={() => setIsModalOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors text-2xl">×</button>
                </div>
                {/* 4. The Body: REMOVED max-h and overflow-y-auto from here. 
                    Let the outer container handle the scroll for a smoother experience. */}
                <div className="p-8 space-y-8">
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-3">AI Summary</h4>
                    <p className="text-slate-600 leading-relaxed text-lg italic border-l-4 border-indigo-100 pl-6">
                      "{quizResult.summary}"
                    </p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-4">Extracted Entities</h4>
                    <div className="flex flex-wrap gap-3">
                      {quizResult.key_entities?.people?.map((p, i) => (
                        <span key={i} className="px-4 py-2 bg-purple-50 text-purple-700 rounded-xl text-xs font-bold border border-purple-100">👤 {p}</span>
                      ))}
                      {quizResult.key_entities?.locations?.map((l, i) => (
                        <span key={i} className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-100">📍 {l}</span>
                      ))}
                    </div>
                  </div>

                  {/* Bonus: If you are showing the RAW HTML here, add it below */}
                  {quizResult.raw_html && (
                    <div className="mt-6 pt-6 border-t border-slate-100">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-4">Original Content Preview</h4>
                      <div className="text-sm text-slate-500 max-h-96 overflow-y-auto bg-slate-50 p-4 rounded-xl font-mono">
                        {/* Note: Showing raw HTML can be huge, so we cap this specific section */}
                        {quizResult.raw_html.substring(0, 1000)}...
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 bg-slate-50 flex justify-end">
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg"
                  >
                    Got it
                  </button>
                </div>
              </div>
            </div>
          )}
          </div>
        );
      };
      // ==========================================

export default App;
