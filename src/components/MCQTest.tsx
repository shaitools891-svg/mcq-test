import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  ArrowLeft, 
  RotateCcw, 
  Award,
  Clock,
  BookOpen,
  ChevronRight,
  LogOut,
  ImageIcon
} from 'lucide-react';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';
import { useTimer } from '../hooks/useTimer';
import { toast } from 'sonner';
import { saveMCQResult, hashProfileId } from '../utils/supabaseClient';
import { comilla2023Bio2nd, dhaka2023Bio2nd } from '../data';

// Get current profile info
const getProfileInfo = (): { name: string } | null => {
  const profileId = localStorage.getItem('selectedProfile');
  const profiles: Record<string, { name: string }> = {
    aliza: { name: 'Aliza' },
    eshita: { name: 'Eshita' },
    shapla: { name: 'Shapla' },
    shakib: { name: 'Shakib' }
  };
  return profileId ? (profiles[profileId] || null) : null;
};

interface Question {
  id: number;
  question: string;
  options: string[];
  correct_index: number;
  category?: string;
  explanations?: Record<string, string>;
  stem?: string;
  stem_image?: string;
  multi_options?: string[];
  board?: string;
  year?: number;
}

// Helper function to get board display name
const getBoardDisplayName = (boardId: string | null): string => {
  if (!boardId) return '';
  const boardNames: Record<string, string> = {
    comilla: 'কুমিল্লা বোর্ড',
    dhaka: 'ঢাকা বোর্ড',
    rajshahi: 'রাজশাহী বোর্ড',
    chittagong: 'চট্টগ্রাম বোর্ড',
    barisal: 'বরিশাল বোর্ড',
    sylhet: 'সিলেট বোর্ড',
    dinajpur: 'দিনাজপুর বোর্ড',
    mymensingh: 'ময়মনসিংহ বোর্ড'
  };
  return boardNames[boardId] || '';
};

// Map board selections to question data
const getQuestionsForSelection = (board: string, paper: string, subject: string): Question[] => {
  if (subject === 'biology' && paper === '2nd') {
    if (board === 'comilla') {
      return comilla2023Bio2nd as Question[];
    }
    if (board === 'dhaka') {
      return dhaka2023Bio2nd as Question[];
    }
  }
  // Default to Comilla board
  return comilla2023Bio2nd as Question[];
};

const optionLabels = ['ক', 'খ', 'গ', 'ঘ'];

// Helper function to render text with LaTeX formulas
const renderWithLatex = (text: string) => {
  // Split by LaTeX delimiters $...$
  const parts = text.split(/(\$[^$]+\$)/g);
  return parts.map((part, index) => {
    if (part.startsWith('$') && part.endsWith('$')) {
      // Extract LaTeX content without $
      const latex = part.slice(1, -1);
      try {
        return <InlineMath key={index} math={latex} />;
      } catch {
        return <span key={index}>{part}</span>;
      }
    }
    return <span key={index}>{part}</span>;
  });
};

const TOTAL_TIME_25_QUESTIONS = 15 * 60; // 15 minutes in seconds
const TOTAL_TIME_30_QUESTIONS = 20 * 60; // 20 minutes in seconds

// Determine time limit based on number of questions
const getTimeLimit = (questionCount: number) => {
  if (questionCount <= 25) {
    return TOTAL_TIME_25_QUESTIONS;
  }
  return TOTAL_TIME_30_QUESTIONS;
};

export default function MCQTest() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  
  // Initialize selectedAnswers when questions change
  useEffect(() => {
    if (questions.length > 0 && selectedAnswers.length === 0) {
      setSelectedAnswers(new Array(questions.length).fill(-1));
    }
  }, [questions, selectedAnswers.length]);
  
  // Store final time when test ends
  const [finalTimeLeft, setFinalTimeLeft] = useState(0);
  const [finalFormattedTime, setFinalFormattedTime] = useState('00:00');
  
  // Subject/Board selection state
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedPaper, setSelectedPaper] = useState<string | null>(null);
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const [testStarted, setTestStarted] = useState(false);
  
  // Profile menu state
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Use the timer hook
  const { timeLeft, isRunning, formattedTime, reset: resetTimer, pause: pauseTimer, resume: resumeTimer } = useTimer({ 
    questionCount: questions.length,
    onTimeUp: () => setShowResults(true)
  });

  // Calculate the time limit for display
  const timeLimit = getTimeLimit(questions.length);

  // Calculate elapsed time for display in results (for consistency)
  const timeElapsed = timeLimit - timeLeft;

  const handleSelectAnswer = (optionIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = optionIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    // Store the final time values before pausing
    setFinalTimeLeft(timeLeft);
    setFinalFormattedTime(formattedTime);
    
    try {
      if (pauseTimer) pauseTimer();
    } catch (e) {
      console.log('Timer pause error:', e);
    }
    
    // Save results
    const profileId = localStorage.getItem('selectedProfile');
    if (profileId) {
      // Skip saving for admin profile (admin may run tests for checking)
      if (profileId === 'shakib') {
        toast.info('Admin test mode - results not saved');
        setShowResults(true);
        return;
      }
      
      const score = calculateScore();
      const percentage = getScorePercentage();
      const resultData = {
        date: new Date().toISOString(),
        score: score,
        total: questions.length,
        percentage: percentage,
        timeTaken: 15 * 60 - timeLeft,
        answers: selectedAnswers
      };
      
      // Save to localStorage
      const storageKey = `mcq_results_${profileId}`;
      const existingResults = JSON.parse(localStorage.getItem(storageKey) || '[]');
      existingResults.push(resultData);
      localStorage.setItem(storageKey, JSON.stringify(existingResults));
      
      // Try to sync to Supabase (non-blocking) - use hashed profile ID for privacy
      saveMCQResult({
        profileId: hashProfileId(profileId),
        score: score,
        total: questions.length,
        percentage: percentage,
        answers: selectedAnswers
      }).then(success => {
        if (success) {
          console.log('Results synced to cloud');
        }
      }).catch((err: unknown) => {
        console.log('Supabase sync failed (offline mode):', err);
      });
      
      toast.success('Test completed! Results saved.');
    }
    
    setShowResults(true);
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setSelectedAnswers(new Array(questions.length).fill(-1));
    setShowResults(false);
    setFinalTimeLeft(0);
    setFinalFormattedTime('00:00');
    try {
      if (resetTimer) resetTimer();
    } catch (e) {
      console.log('Timer reset error:', e);
    }
    // Also reset selection state to go back to selection screen
    setTestStarted(false);
    setSelectedSubject(null);
    setSelectedPaper(null);
    setSelectedBoard(null);
  };

  const calculateScore = () => {
    let correct = 0;
    selectedAnswers.forEach((answer, index) => {
      if (answer === questions[index].correct_index) {
        correct++;
      }
    });
    return correct;
  };

  const getScorePercentage = () => {
    return Math.round((calculateScore() / questions.length) * 100);
  };

  const getScoreMessage = () => {
    const percentage = getScorePercentage();
    if (percentage >= 80) return "Excellent! Outstanding performance! 🎉";
    if (percentage >= 60) return "Good job! Keep it up! 👍";
    if (percentage >= 40) return "Not bad! Room for improvement! 📚";
    return "Keep practicing! You'll do better! 💪";
  };

  if (showResults) {
    const score = calculateScore();
    const percentage = getScorePercentage();

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-800 p-6 mb-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 mb-4">
                <Award className="w-10 h-10 text-amber-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {getBoardDisplayName(selectedBoard)} ২০২৩ - জীববিজ্ঞান ২য় পত্র
              </h1>
              <p className="text-gray-600 dark:text-gray-400">MCQ Test Results</p>
            </div>
          </div>

          {/* Score Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-800 p-8 mb-6">
            <div className="text-center">
              <div className="text-6xl font-black text-amber-500 mb-2">
                {score}/{questions.length}
              </div>
              <div className="text-3xl font-bold text-gray-700 dark:text-gray-300 mb-4">
                {percentage}%
              </div>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                {getScoreMessage()}
              </p>
              <div className="flex items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Time: {finalFormattedTime || formattedTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Correct: {score}</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span>Wrong: {questions.length - score}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Answer Review */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-800 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Answer Review
            </h2>
            <div className="space-y-4">
              {questions.map((q, idx) => {
                const userAnswer = selectedAnswers[idx];
                const isCorrect = userAnswer === q.correct_index;
                const isUnanswered = userAnswer === -1;

                return (
                  <div 
                    key={q.id} 
                    className={`p-4 rounded-xl border ${
                      isCorrect 
                        ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20' 
                        : isUnanswered
                        ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20'
                        : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        isCorrect 
                          ? 'bg-emerald-500 text-white' 
                          : isUnanswered
                          ? 'bg-amber-500 text-white'
                          : 'bg-red-500 text-white'
                      }`}>
                        {q.id}
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-900 dark:text-white font-medium mb-2">{renderWithLatex(q.question)}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          {q.options.map((opt, optIdx) => (
                            <div
                              key={optIdx}
                              className={`px-3 py-2 rounded-lg ${
                                optIdx === q.correct_index
                                  ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-medium'
                                  : optIdx === userAnswer && !isCorrect
                                  ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 line-through'
                                  : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400'
                              }`}
                            >
                              {optionLabels[optIdx]}. {renderWithLatex(opt)}
                            </div>
                          ))}
                        </div>
                        {isUnanswered && (
                          <p className="text-amber-600 dark:text-amber-400 text-sm mt-2">Not answered</p>
                        )}
                        {/* Show explanations for each option */}
                        {q.explanations && (
                          <div className="mt-3 space-y-2">
                            {q.options.map((opt, optIdx) => {
                              const explanation = q.explanations?.[opt];
                              if (!explanation) return null;
                              const isCorrectOption = optIdx === q.correct_index;
                              return (
                                <div 
                                  key={optIdx}
                                  className={`p-3 rounded-lg text-sm ${
                                    isCorrectOption 
                                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-500'
                                      : 'bg-gray-50 dark:bg-zinc-800 border-l-4 border-gray-300 dark:border-zinc-600'
                                  }`}
                                >
                                  <span className={`font-medium ${isCorrectOption ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-600 dark:text-gray-400'}`}>
                                    {optionLabels[optIdx]}. 
                                  </span>
                                  <span className={isCorrectOption ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}>
                                    {explanation}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Restart Button */}
          <div className="text-center">
            <button
              onClick={handleRestart}
              className="inline-flex items-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
            >
              <RotateCcw className="w-5 h-5" />
              Take Test Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const answeredCount = selectedAnswers.filter(a => a !== -1).length;
  const profile = getProfileInfo();

  // Subject selection screen
  if (!testStarted) {
    const subjects = [
      { id: 'biology', name: 'Biology', nameBn: 'জীববিজ্ঞান', icon: '🧬' },
      { id: 'chemistry', name: 'Chemistry', nameBn: 'রসায়ন', icon: '⚗️', disabled: true },
      { id: 'physics', name: 'Physics', nameBn: 'পদার্থবিদ্যা', icon: '⚛️', disabled: true },
      { id: 'math', name: 'Math', nameBn: 'গণিত', icon: '📐', disabled: true },
    ];

    const papers = [
      { id: '1st', name: 'Paper 1st', nameBn: '১ম পত্র' },
      { id: '2nd', name: 'Paper 2nd', nameBn: '২য় পত্র' },
    ];

    const boards = [
      { id: 'comilla', name: 'Comilla', nameBn: 'কুমিল্লা বোর্ড', year: '2023' },
      { id: 'dhaka', name: 'Dhaka', nameBn: 'ঢাকা বোর্ড', year: '2023' },
      { id: 'rajshahi', name: 'Rajshahi', nameBn: 'রাজশাহী বোর্ড', year: '2023', disabled: true },
      { id: 'chittagong', name: 'Chittagong', nameBn: 'চট্টগ্রাম বোর্ড', year: '2023', disabled: true },
      { id: 'barisal', name: 'Barisal', nameBn: 'বরিশাল বোর্ড', year: '2023', disabled: true },
      { id: 'sylhet', name: 'Sylhet', nameBn: 'সিলেট বোর্ড', year: '2023', disabled: true },
      { id: 'dinajpur', name: 'Dinajpur', nameBn: 'দিনাজপুর বোর্ড', year: '2023', disabled: true },
      { id: 'mymensingh', name: 'Mymensingh', nameBn: 'ময়মনসিংহ বোর্ড', year: '2023', disabled: true },
    ];

    const isSubjectSelected = selectedSubject !== null;
    const isPaperSelected = selectedPaper !== null;
    const isBoardSelected = selectedBoard !== null;
    const canStartTest = isSubjectSelected && isPaperSelected && isBoardSelected;

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Profile Avatar in Top Right */}
          {profile && (
            <div className="fixed top-4 right-4 z-50">
              <div 
                className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center shadow-lg cursor-pointer"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                title={profile.name}
              >
                <span className="text-white font-bold text-sm">{profile.name[0]}</span>
              </div>
              
              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-700 py-2">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-zinc-700">
                    <p className="font-medium text-gray-900 dark:text-white">{profile.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">Student</p>
                  </div>
                  <button
                    onClick={() => {
                      localStorage.removeItem('selectedProfile');
                      window.location.href = '/';
                    }}
                    className="w-full px-4 py-2 text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Selection Screen */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-800 p-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              Select Exam Type
            </h1>

            {/* Subject Selection */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select Subject</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {subjects.map((subject) => (
                  <button
                    key={subject.id}
                    onClick={() => !subject.disabled && setSelectedSubject(subject.id)}
                    disabled={subject.disabled}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      subject.disabled
                        ? 'border-gray-200 dark:border-zinc-700 opacity-50 cursor-not-allowed'
                        : selectedSubject === subject.id
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20'
                        : 'border-gray-200 dark:border-zinc-700 hover:border-rose-300 dark:hover:border-rose-700'
                    }`}
                  >
                    <div className="text-3xl mb-2">{subject.icon}</div>
                    <div className="font-medium text-gray-900 dark:text-white">{subject.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{subject.nameBn}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Paper Selection */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select Paper</h2>
              <div className="grid grid-cols-2 gap-4">
                {papers.map((paper) => (
                  <button
                    key={paper.id}
                    onClick={() => setSelectedPaper(paper.id)}
                    disabled={!selectedSubject}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      !selectedSubject
                        ? 'border-gray-200 dark:border-zinc-700 opacity-50 cursor-not-allowed'
                        : selectedPaper === paper.id
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20'
                        : 'border-gray-200 dark:border-zinc-700 hover:border-rose-300 dark:hover:border-rose-700'
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-white">{paper.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{paper.nameBn}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Board Selection */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select Board & Year</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {boards.map((board) => (
                  <button
                    key={board.id}
                    onClick={() => !board.disabled && setSelectedBoard(board.id)}
                    disabled={!selectedPaper || board.disabled}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      !selectedPaper || board.disabled
                        ? 'border-gray-200 dark:border-zinc-700 opacity-50 cursor-not-allowed'
                        : selectedBoard === board.id
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20'
                        : 'border-gray-200 dark:border-zinc-700 hover:border-rose-300 dark:hover:border-rose-700'
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-white">{board.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{board.nameBn}</div>
                    <div className="text-xs text-amber-500 font-medium">{board.year}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={() => {
                const loadedQuestions = getQuestionsForSelection(selectedBoard!, selectedPaper!, selectedSubject!);
                setQuestions(loadedQuestions);
                setTestStarted(true);
              }}
              disabled={!canStartTest}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                canStartTest
                  ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg'
                  : 'bg-gray-200 dark:bg-zinc-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }`}
            >
              Start Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Profile Avatar in Top Right */}
        {profile && (
          <div className="fixed top-4 right-4 z-50">
            <div 
              className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center shadow-lg cursor-pointer"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              title={profile.name}
            >
              <span className="text-white font-bold text-sm">{profile.name[0]}</span>
            </div>
            
            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-700 py-2">
                <div className="px-4 py-2 border-b border-gray-200 dark:border-zinc-700">
                  <p className="font-medium text-gray-900 dark:text-white">{profile.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">Student</p>
                </div>
                <button
                  onClick={() => {
                    localStorage.removeItem('selectedProfile');
                    window.location.href = '/';
                  }}
                  className="w-full px-4 py-2 text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        )}

        {/* Header */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-800 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {getBoardDisplayName(selectedBoard)} ২০২৩
              </h1>
              <p className="text-gray-600 dark:text-gray-400">জীববিজ্ঞান ২য় পত্র (MCQ)</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <Clock className="w-4 h-4 text-amber-500" />
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                  {formattedTime}
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-bold text-amber-500">{answeredCount}</span>/{questions.length} answered
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="h-2 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span>Question {currentQuestion + 1} of {questions.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-800 p-6 mb-6">
          {/* Stem Section - for Dhaka Board questions with stems */}
          {(currentQ.stem || currentQ.stem_image) && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700">
              {currentQ.stem && (
                <p className="text-gray-700 dark:text-gray-300 mb-3">{currentQ.stem}</p>
              )}
              {currentQ.stem_image && (
                <div className="mt-3">
                  <img 
                    src={`./assets/${currentQ.stem_image}`} 
                    alt="Question stem" 
                    className="max-w-full h-auto rounded-lg"
                  />
                </div>
              )}
            </div>
          )}
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0 w-12 h-12 bg-amber-500 text-white rounded-xl flex items-center justify-center font-bold text-lg">
              {currentQ.id}
            </div>
            <div className="flex-1">
              {/* Multi-options display */}
              {currentQ.multi_options && (
                <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  {currentQ.multi_options.map((opt, idx) => (
                    <div key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                      {opt}
                    </div>
                  ))}
                </div>
              )}
              <p className="text-lg font-medium text-gray-900 dark:text-white leading-relaxed">
                {renderWithLatex(currentQ.question)}
              </p>
              <span className="inline-block mt-2 text-xs px-3 py-1 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 rounded-full">
                {currentQ.category}
              </span>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {currentQ.options.map((option, idx) => {
              const isSelected = selectedAnswers[currentQuestion] === idx;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelectAnswer(idx)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                      : 'border-gray-200 dark:border-zinc-700 hover:border-amber-300 dark:hover:border-amber-700 hover:bg-gray-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                    isSelected
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400'
                  }`}
                  >
                    {optionLabels[idx]}
                  </div>
                  <span className={`flex-1 ${
                    isSelected ? 'text-amber-700 dark:text-amber-300 font-medium' : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {renderWithLatex(option)}
                  </span>
                  {isSelected && (
                    <CheckCircle2 className="w-5 h-5 text-amber-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>

          {/* Question Navigator Dots */}
          <div className="hidden sm:flex items-center gap-1">
            {questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentQuestion(idx)}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  idx === currentQuestion
                    ? 'w-6 bg-amber-500'
                    : selectedAnswers[idx] !== -1
                    ? 'bg-emerald-400'
                    : 'bg-gray-300 dark:bg-zinc-600'
                }`}
              />
            ))}
          </div>

          {currentQuestion === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
            >
              Submit
              <CheckCircle2 className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Navigation */}
        <div className="mt-8 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-800 p-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Quick Navigation</p>
          <div className="grid grid-cols-10 sm:grid-cols-10 gap-2">
            {questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentQuestion(idx)}
                className={`w-full aspect-square rounded-lg text-sm font-bold transition-all duration-200 ${
                  idx === currentQuestion
                    ? 'bg-amber-500 text-white'
                    : selectedAnswers[idx] !== -1
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50'
                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-amber-500 rounded"></div>
              <span>Current</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-emerald-100 dark:bg-emerald-900/30 rounded border border-emerald-300"></div>
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-100 dark:bg-zinc-800 rounded border border-gray-300"></div>
              <span>Not answered</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
