import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  BookOpen, 
  Clock, 
  Bookmark, 
  TrendingUp,
  User,
  LogOut,
  BarChart3,
  Users,
  Activity,
  Trash2
} from 'lucide-react'
import { getAllProfilePictures, loadProfilePictureFromCloud, loadMCQResults, loadAllMCQResults, hashProfileId } from '../utils/supabaseClient'

// Base path for deployed assets (Vite base is /mcq-test/)
const ASSET_BASE = '/mcq-test/';

interface TestResult {
  date: string;
  score: number;
  total: number;
  percentage: number;
  timeTaken: number;
  answers: number[];
}

interface BookmarkedQuestion {
  questionId: number;
  question: string;
  bookmarkedAt: string;
}

// Get profile info
const getProfileInfo = (): { name: string; role: string; avatar: string } | null => {
  const profileId = localStorage.getItem('selectedProfile');
  const profiles: Record<string, { name: string; role: string; avatar: string }> = {
    aliza: { name: 'Aliza', role: 'student', avatar: '' },
    eshita: { name: 'Eshita', role: 'student', avatar: '' },
    shapla: { name: 'Shapla', role: 'student', avatar: '' },
    shakib: { name: 'Shakib', role: 'admin', avatar: '' }
  };
  
  // Load custom avatar from localStorage
  const savedAvatars = localStorage.getItem('customAvatars');
  if (savedAvatars) {
    const customAvatars = JSON.parse(savedAvatars);
    Object.keys(profiles).forEach(key => {
      if (customAvatars[key]) {
        profiles[key].avatar = customAvatars[key];
      }
    });
  }
  
  return profileId ? (profiles[profileId] || null) : null;
};

// Get test results for a profile
const getTestResults = (profileId: string): TestResult[] => {
  const storageKey = `mcq_results_${profileId}`;
  return JSON.parse(localStorage.getItem(storageKey) || '[]');
};

// Get all students results (for admin)
const getAllStudentsResults = (): Record<string, TestResult[]> => {
  const students = ['aliza', 'eshita', 'shapla'];
  const results: Record<string, TestResult[]> = {};
  students.forEach(student => {
    results[student] = getTestResults(student);
  });
  return results;
};

// Get bookmarks
const getBookmarks = (profileId: string): BookmarkedQuestion[] => {
  const storageKey = `mcq_bookmarks_${profileId}`;
  return JSON.parse(localStorage.getItem(storageKey) || '[]');
};

// Student Dashboard Component
const StudentDashboard = ({ profile: _profile }: { profile: { name: string; role: string; avatar: string } }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'summary' | 'activity' | 'bookmarks'>('summary');
  const [results, setResults] = useState<TestResult[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkedQuestion[]>([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const profileId = localStorage.getItem('selectedProfile');
    if (profileId) {
      // First load from localStorage (instant)
      const localResults = getTestResults(profileId);
      setResults(localResults);
      setBookmarks(getBookmarks(profileId));
      
      // Then load from Supabase and merge
      loadMCQResults(profileId).then(cloudResults => {
        if (cloudResults.length > 0) {
          // Merge cloud results with local, avoiding duplicates
          const localIds = new Set(localResults.map(r => `${r.date}-${r.score}-${r.percentage}`));
          const newFromCloud = cloudResults.filter(r => 
            !localIds.has(`${r.timestamp}-${r.score}-${r.percentage}`)
          );
          
          if (newFromCloud.length > 0) {
            // Save new cloud results to localStorage
            const mergedResults = [...localResults, ...newFromCloud.map(r => ({
              date: r.timestamp,
              score: r.score,
              total: r.total,
              percentage: r.percentage,
              timeTaken: 0,
              answers: []
            }))];
            
            const storageKey = `mcq_results_${profileId}`;
            localStorage.setItem(storageKey, JSON.stringify(mergedResults));
            setResults(mergedResults);
          }
        }
        setIsLoading(false);
      }).catch(() => {
        setIsLoading(false);
      });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('selectedProfile');
    navigate('/');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getAverageScore = () => {
    if (results.length === 0) return 0;
    const total = results.reduce((sum, r) => sum + r.percentage, 0);
    return Math.round(total / results.length);
  };

  const getBestScore = () => {
    if (results.length === 0) return 0;
    return Math.max(...results.map(r => r.percentage));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">

      {/* Profile Avatar in Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <div 
          className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center shadow-lg cursor-pointer"
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          title={_profile.name}
        >
          <span className="text-white font-bold text-sm">{_profile.name[0]}</span>
        </div>
        
        {/* Profile Dropdown Menu */}
        {showProfileMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-700 py-2">
            <div className="px-4 py-2 border-b border-gray-200 dark:border-zinc-700">
              <p className="font-medium text-gray-900 dark:text-white">{_profile.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{_profile.role}</p>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('selectedProfile');
                navigate('/');
              }}
              className="w-full px-4 py-2 text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex-1 py-4 text-sm font-medium transition-colors ${
            activeTab === 'summary' 
              ? 'text-rose-500 border-b-2 border-rose-500' 
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          <BookOpen size={18} className="mx-auto mb-1" />
          Summary
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`flex-1 py-4 text-sm font-medium transition-colors ${
            activeTab === 'activity' 
              ? 'text-rose-500 border-b-2 border-rose-500' 
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          <Activity size={18} className="mx-auto mb-1" />
          Activity
        </button>
        <button
          onClick={() => setActiveTab('bookmarks')}
          className={`flex-1 py-4 text-sm font-medium transition-colors ${
            activeTab === 'bookmarks' 
              ? 'text-rose-500 border-b-2 border-rose-500' 
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          <Bookmark size={18} className="mx-auto mb-1" />
          Bookmarks
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'summary' && (
          <div className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Average</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getAverageScore()}%</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-amber-600" />
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Tests Taken</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{results.length}</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-rose-600" />
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Best Score</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getBestScore()}%</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Bookmark className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Bookmarks</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{bookmarks.length}</p>
              </div>
            </div>

            {/* Recent Results */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Recent Results</h3>
              {results.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">No tests taken yet</p>
              ) : (
                <div className="space-y-3">
                  {results.slice().reverse().slice(0, 5).map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {result.score}/{result.total} ({result.percentage}%)
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(result.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        result.percentage >= 80 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        result.percentage >= 60 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {result.percentage >= 80 ? 'Excellent' : result.percentage >= 60 ? 'Good' : 'Needs Work'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Activity Log</h3>
            {results.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">No activity yet</p>
            ) : (
              <div className="space-y-3">
                {results.slice().reverse().map((result, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 border-l-2 border-rose-500">
                    <div className="w-2 h-2 rounded-full bg-rose-500 mt-2"></div>
                    <div>
                      <p className="text-sm text-gray-900 dark:text-white">
                        Completed MCQ Test - Scored {result.percentage}%
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(result.date).toLocaleDateString()} at {new Date(result.date).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'bookmarks' && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Bookmarked Questions</h3>
            {bookmarks.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">No bookmarks yet. Bookmark questions during the test!</p>
            ) : (
              <div className="space-y-3">
                {bookmarks.map((bookmark, index) => (
                  <div key={index} className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                    <p className="text-sm text-gray-900 dark:text-white">{bookmark.question}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Bookmarked on {new Date(bookmark.bookmarkedAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Admin Dashboard Component
const AdminDashboard = ({ profile }: { profile: { name: string; role: string; avatar: string } }) => {
  const navigate = useNavigate();
  const [studentsResults, setStudentsResults] = useState<Record<string, TestResult[]>>({});
  const [activeTab, setActiveTab] = useState<'overview' | 'activity'>('overview');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // First load from localStorage
    setStudentsResults(getAllStudentsResults());
    
    // Then load all results from Supabase
    loadAllMCQResults().then(allResults => {
      if (allResults.length > 0) {
        // Group results by profile ID
        const cloudByProfile: Record<string, TestResult[]> = {};
        allResults.forEach(r => {
          if (!cloudByProfile[r.anonymous_id]) {
            cloudByProfile[r.anonymous_id] = [];
          }
          cloudByProfile[r.anonymous_id].push({
            date: r.timestamp,
            score: r.score,
            total: r.total,
            percentage: r.percentage,
            timeTaken: 0,
            answers: []
          });
        });
        
        // Merge with local results
        const merged: Record<string, TestResult[]> = {};
        const localResults = getAllStudentsResults();
        
        // Get all profile IDs from both sources
        const allProfileIds = new Set([
          ...Object.keys(localResults),
          ...Object.keys(cloudByProfile)
        ]);
        
        allProfileIds.forEach(profileId => {
          const local = localResults[profileId] || [];
          const cloud = cloudByProfile[profileId] || [];
          
          // Simple merge - combine both, removing exact duplicates
          const mergedResults = [...local, ...cloud];
          merged[profileId] = mergedResults;
        });
        
        setStudentsResults(merged);
      }
      setIsLoading(false);
    }).catch(() => {
      setIsLoading(false);
    });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('selectedProfile');
    navigate('/');
  };

  const studentNames: Record<string, string> = {
    aliza: 'Aliza',
    eshita: 'Eshita',
    shapla: 'Shapla'
  };

  const studentAvatars: Record<string, string> = {
    aliza: '',
    eshita: '',
    shapla: ''
  };
  
  // Load custom avatars for students
  const savedAvatars = localStorage.getItem('customAvatars');
  if (savedAvatars) {
    const customAvatars = JSON.parse(savedAvatars);
    Object.keys(studentAvatars).forEach(key => {
      if (customAvatars[key]) {
        studentAvatars[key] = customAvatars[key];
      }
    });
  }

  const getStudentAverage = (studentId: string) => {
    const results = studentsResults[studentId] || [];
    if (results.length === 0) return 0;
    const total = results.reduce((sum, r) => sum + r.percentage, 0);
    return Math.round(total / results.length);
  };

  const getTotalTests = () => {
    return Object.values(studentsResults).flat().length;
  };

  const getAverageAcrossAll = () => {
    const allResults = Object.values(studentsResults).flat();
    if (allResults.length === 0) return 0;
    const total = allResults.reduce((sum, r) => sum + r.percentage, 0);
    return Math.round(total / allResults.length);
  };

  const clearStudentResults = (studentId: string) => {
    if (confirm(`Are you sure you want to reset all test results for ${studentNames[studentId]}?`)) {
      const storageKey = `mcq_results_${studentId}`;
      localStorage.removeItem(storageKey);
      setStudentsResults(getAllStudentsResults());
    }
  };

  // Simple bar chart using CSS
  const maxPercentage = 100;
  const barHeight = (percentage: number) => `${(percentage / maxPercentage) * 100}%`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-500 to-amber-500 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-2 border-white">
              {profile.avatar ? (
                <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold">{profile.name[0]}</span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{profile.name}</h1>
              <p className="text-white/80">Admin</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-4 text-sm font-medium transition-colors ${
            activeTab === 'overview' 
              ? 'text-rose-500 border-b-2 border-rose-500' 
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          <BarChart3 size={18} className="mx-auto mb-1" />
          Overview
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`flex-1 py-4 text-sm font-medium transition-colors ${
            activeTab === 'activity' 
              ? 'text-rose-500 border-b-2 border-rose-500' 
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          <Activity size={18} className="mx-auto mb-1" />
          Activity
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <Users className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Students</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Object.keys(studentsResults).filter(k => (studentsResults[k] || []).length > 0).length}
                </p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-amber-600" />
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Total Tests</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getTotalTests()}</p>
              </div>
            </div>

            {/* Performance Graph */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Student Performance</h3>
              <div className="flex items-end justify-around h-48 gap-2">
                {Object.keys(studentNames).map(studentId => {
                  const avg = getStudentAverage(studentId);
                  const tests = (studentsResults[studentId] || []).length;
                  return (
                    <div key={studentId} className="flex flex-col items-center flex-1">
                      <div className="w-full flex flex-col items-center">
                        <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">{avg}%</span>
                        <div 
                          className={`w-full max-w-12 rounded-t-lg transition-all ${
                            avg >= 80 ? 'bg-emerald-500' : avg >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ height: barHeight(avg || 5) }}
                        ></div>
                      </div>
                      <div className="mt-2 w-12 h-12 rounded-full bg-gray-200 dark:bg-zinc-700 overflow-hidden flex items-center justify-center">
                        {studentAvatars[studentId] ? (
                          <img src={studentAvatars[studentId]} alt={studentNames[studentId]} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg font-bold text-gray-600 dark:text-gray-300">{studentNames[studentId][0]}</span>
                        )}
                      </div>
                      <span className="text-xs mt-1 text-gray-600 dark:text-gray-400">{studentNames[studentId]}</span>
                      <span className="text-xs text-gray-400">({tests} tests)</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Student List */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Student Details</h3>
              <div className="space-y-3">
                {Object.keys(studentNames).map(studentId => {
                  const results = studentsResults[studentId] || [];
                  const avg = getStudentAverage(studentId);
                  const best = results.length > 0 ? Math.max(...results.map(r => r.percentage)) : 0;
                  
                  return (
                    <div key={studentId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-zinc-700 overflow-hidden flex items-center justify-center">
                          {studentAvatars[studentId] ? (
                            <img src={studentAvatars[studentId]} alt={studentNames[studentId]} className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-bold text-gray-600 dark:text-gray-300">{studentNames[studentId][0]}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{studentNames[studentId]}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{results.length} tests</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 dark:text-white">{avg}%</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Best: {best}%</p>
                      </div>
                      <button
                        onClick={() => clearStudentResults(studentId)}
                        className="ml-2 p-2 text-gray-400 hover:text-rose-500 transition-colors"
                        title="Reset results"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
            {getTotalTests() === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">No activity yet</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(studentsResults).flatMap(([studentId, results]) =>
                  results.map((result) => ({
                    studentId,
                    studentName: studentNames[studentId],
                    ...result
                  }))
                )
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 10)
                .map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 border-l-2 border-rose-500">
                    <div className="w-2 h-2 rounded-full bg-rose-500 mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 dark:text-white">
                        <span className="font-medium">{activity.studentName}</span> completed MCQ Test - Scored {activity.percentage}%
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(activity.date).toLocaleDateString()} at {new Date(activity.date).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Main Dashboard Component
export default function Dashboard() {
  const [profile, setProfile] = useState<{ name: string; role: string; avatar: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const profileInfo = getProfileInfo();
    if (!profileInfo) {
      // No profile selected, redirect to profile selection
      navigate('/');
      return;
    }
    setProfile(profileInfo);
  }, [navigate]);

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return profile.role === 'admin' ? (
    <AdminDashboard profile={profile} />
  ) : (
    <StudentDashboard profile={profile} />
  );
}

// Wrapper for App.tsx routing
export function DashboardWrapper() {
  return <Dashboard />;
}
