import React, { useState, useReducer, createContext, useContext, useMemo, useCallback, useRef, memo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon, 
  Twitter, 
  Linkedin, 
  Instagram,
  X,
  Trash2,
  GripVertical,
  Activity,
  CheckCircle2,
  XCircle
} from 'lucide-react';


// -------------------------------------------------------------------
// 1. STATE MANAGEMENT (Redux-lite using Context + useReducer)
// -------------------------------------------------------------------

// Mock Initial Data
const initialPosts = [
  { id: '1', title: 'Product Launch Announcement', date: '2026-09-10', time: '09:00', platform: 'linkedin', color: 'bg-blue-600' },
  { id: '2', title: 'Behind the Scenes', date: '2026-09-15', time: '14:30', platform: 'instagram', color: 'bg-pink-600' },
  { id: '3', title: 'Weekly Tips', date: '2026-09-15', time: '10:00', platform: 'twitter', color: 'bg-sky-500' },
  { id: '4', title: 'Customer Spotlight', date: '2026-09-22', time: '11:00', platform: 'linkedin', color: 'bg-blue-600' },
];

const PostContext = createContext();

const postReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_POST':
      return [...state, action.payload];
    case 'UPDATE_POST':
      return state.map(post => post.id === action.payload.id ? action.payload : post);
    case 'MOVE_POST':
      // Specifically for drag-and-drop
      return state.map(post => 
        post.id === action.payload.id 
          ? { ...post, date: action.payload.newDate } 
          : post
      );
    case 'DELETE_POST':
      return state.filter(post => post.id !== action.payload);
    default:
      return state;
  }
};

const PostProvider = ({ children }) => {
  const [posts, dispatch] = useReducer(postReducer, initialPosts);

  return (
    <PostContext.Provider value={{ posts, dispatch }}>
      {children}
    </PostContext.Provider>
  );
};

const usePosts = () => useContext(PostContext);


// -------------------------------------------------------------------
// 2. CALENDAR UTILITIES
// -------------------------------------------------------------------

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const PLATFORMS = {
  twitter: { icon: Twitter, color: 'bg-sky-500' },
  linkedin: { icon: Linkedin, color: 'bg-blue-600' },
  instagram: { icon: Instagram, color: 'bg-pink-600' },
};

// Formats date to YYYY-MM-DD for easy string comparison
const formatDate = (year, month, day) => {
  const m = (month + 1).toString().padStart(2, '0');
  const d = day.toString().padStart(2, '0');
  return `${year}-${m}-${d}`;
};

// Generates the grid layout for the calendar
const generateCalendarGrid = (year, month) => {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  
  const grid = [];
  
  // Previous month padded days
  for (let i = firstDay - 1; i >= 0; i--) {
    grid.push({
      day: daysInPrevMonth - i,
      month: month - 1,
      year: month === 0 ? year - 1 : year,
      isCurrentMonth: false,
      dateString: formatDate(month === 0 ? year - 1 : year, month === 0 ? 11 : month - 1, daysInPrevMonth - i)
    });
  }
  
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    grid.push({
      day: i,
      month: month,
      year: year,
      isCurrentMonth: true,
      dateString: formatDate(year, month, i)
    });
  }
  
  // Next month padded days (to complete the 35 or 42 cell grid)
  const remainingCells = 42 - grid.length; // Ensure 6 rows for visual consistency
  for (let i = 1; i <= remainingCells; i++) {
    grid.push({
      day: i,
      month: month + 1,
      year: month === 11 ? year + 1 : year,
      isCurrentMonth: false,
      dateString: formatDate(month === 11 ? year + 1 : year, month === 11 ? 0 : month + 1, i)
    });
  }
  
  return grid;
};


// -------------------------------------------------------------------
// 3. UI COMPONENTS
// -------------------------------------------------------------------

// Component: Draggable Post Item (Optimized with React.memo)
const ScheduledPost = memo(({ post, onClick, showProfiler }) => {
  // Profiler hook to track how many times this specific component re-renders
  const renderCount = useRef(0);
  renderCount.current += 1;

  const PlatformIcon = PLATFORMS[post.platform]?.icon || CalendarIcon;

  const handleDragStart = (e) => {
    e.dataTransfer.setData('postId', post.id);
    e.dataTransfer.effectAllowed = 'move';
    // Small delay to allow the drag ghost to generate before making the original semi-transparent
    setTimeout(() => {
      e.target.style.opacity = '0.5';
    }, 0);
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={(e) => { e.stopPropagation(); onClick(post); }}
      className={`${post.color} text-white text-xs p-1.5 rounded-md mb-1 cursor-pointer shadow-sm hover:opacity-90 flex items-center gap-1.5 transition-opacity group relative`}
      title={`${post.time} - ${post.title}`}
    >
      {/* Visual Profiler overlay */}
      {showProfiler && (
        <span className="absolute -top-1 -right-1 bg-black text-white text-[9px] font-bold px-1 rounded-full z-10 shadow-sm leading-none py-0.5">
          {renderCount.current}
        </span>
      )}
      <GripVertical className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block shrink-0" />
      <PlatformIcon className="h-3 w-3 shrink-0" />
      <span className="truncate flex-1">{post.title}</span>
    </div>
  );
});

// Component: Individual Day Cell in the Grid (Optimized with React.memo)
const CalendarCell = memo(({ dayData, dayPosts, onDateClick, onPostClick, showProfiler }) => {
  const { dispatch } = usePosts();
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Profiler hook to track renders
  const renderCount = useRef(0);
  renderCount.current += 1;

  // Drag and Drop Handlers for the Cell
  const handleDragOver = (e) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const postId = e.dataTransfer.getData('postId');
    
    if (postId) {
      dispatch({ 
        type: 'MOVE_POST', 
        payload: { id: postId, newDate: dayData.dateString } 
      });
    }
  };

  // Check if cell is today
  const isToday = dayData.dateString === formatDate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  return (
    <div 
      onClick={() => onDateClick(dayData.dateString)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        min-h-[100px] sm:min-h-[120px] p-2 border-r border-b border-gray-200 transition-colors relative group
        ${!dayData.isCurrentMonth ? 'bg-gray-50/50 text-gray-400' : 'bg-white'} 
        ${isDragOver ? 'bg-indigo-50 ring-2 ring-indigo-400 ring-inset' : 'hover:bg-slate-50 cursor-pointer'}
      `}
    >
      {/* PERFORMANCE PROFILER BADGE */}
      {showProfiler && (
         <div className="absolute top-1 left-1 bg-purple-100/90 text-purple-800 text-[10px] px-1 rounded font-mono font-bold z-10 pointer-events-none">
           renders: {renderCount.current}
         </div>
      )}

      <div className="flex justify-between items-start mb-1">
        <span className={`
          text-sm font-semibold h-7 w-7 flex items-center justify-center rounded-full
          ${isToday ? 'bg-indigo-600 text-white' : 'text-gray-700'}
        `}>
          {dayData.day}
        </span>
        
        {/* Quick Add Button on Hover */}
        <button className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-indigo-600 transition-opacity">
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-col gap-1 max-h-[80px] sm:max-h-[100px] overflow-y-auto no-scrollbar">
        {dayPosts
          .slice() // BUGFIX & OPTIMIZATION: slice() creates a copy to prevent mutating the frozen prop with sort()
          .sort((a, b) => a.time.localeCompare(b.time))
          .map(post => (
            <ScheduledPost key={post.id} post={post} onClick={onPostClick} showProfiler={showProfiler} />
        ))}
      </div>
    </div>
  );
});


// Component: Post Add/Edit Modal
const PostModal = ({ isOpen, onClose, selectedDate, existingPost }) => {
  const { dispatch } = usePosts();
  
  const [formData, setFormData] = useState({
    title: '',
    date: selectedDate || '',
    time: '12:00',
    platform: 'twitter'
  });

  // Sync form data when modal opens with existing post or new date
  React.useEffect(() => {
    if (existingPost) {
      setFormData(existingPost);
    } else {
      setFormData({
        title: '',
        date: selectedDate || '',
        time: '12:00',
        platform: 'twitter'
      });
    }
  }, [existingPost, selectedDate, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (existingPost) {
      dispatch({ type: 'UPDATE_POST', payload: { ...formData, id: existingPost.id, color: PLATFORMS[formData.platform].color } });
    } else {
      dispatch({ 
        type: 'ADD_POST', 
        payload: { 
          ...formData, 
          id: Date.now().toString(),
          color: PLATFORMS[formData.platform].color 
        } 
      });
    }
    onClose();
  };

  const handleDelete = () => {
    if (existingPost && window.confirm('Are you sure you want to delete this post?')) {
      dispatch({ type: 'DELETE_POST', payload: existingPost.id });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">
            {existingPost ? 'Edit Scheduled Post' : 'Schedule New Post'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 rounded-full p-1 hover:bg-gray-200 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content / Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              className="w-full rounded-lg border-gray-300 border px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder="e.g., Exciting news coming tomorrow..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
                className="w-full rounded-lg border-gray-300 border px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <input
                type="time"
                required
                value={formData.time}
                onChange={e => setFormData({...formData, time: e.target.value})}
                className="w-full rounded-lg border-gray-300 border px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
            <div className="flex gap-3">
              {Object.keys(PLATFORMS).map(platform => (
                <label key={platform} className={`
                  flex-1 flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all
                  ${formData.platform === platform ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'}
                `}>
                  <input
                    type="radio"
                    name="platform"
                    value={platform}
                    checked={formData.platform === platform}
                    onChange={e => setFormData({...formData, platform: e.target.value})}
                    className="sr-only"
                  />
                  {React.createElement(PLATFORMS[platform].icon, { 
                    className: `h-6 w-6 mb-1 ${formData.platform === platform ? 'text-indigo-600' : 'text-gray-500'}` 
                  })}
                  <span className={`text-xs font-medium capitalize ${formData.platform === platform ? 'text-indigo-800' : 'text-gray-600'}`}>
                    {platform}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-between gap-3 border-t border-gray-100 mt-6">
            {existingPost ? (
              <button 
                type="button" 
                onClick={handleDelete}
                className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            ) : <div></div>}
            
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors shadow-sm">
                {existingPost ? 'Save Changes' : 'Schedule Post'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};


// -------------------------------------------------------------------
// 4. MAIN CALENDAR APPLICATION
// -------------------------------------------------------------------
// PERFORMANCE: Define a stable empty array reference outside the component 
// to prevent passing a new [] reference on every render, which would break React.memo
const EMPTY_ARRAY = [];

const CalendarApp = () => {
  const { posts } = usePosts();
  
  const [currentDate, setCurrentDate] = useState(new Date(2026, 8, 1)); // Started at Sept 2026 for demo data
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [editingPost, setEditingPost] = useState(null);

  // Feature toggles for testing/profiling UI
  const [showProfiler, setShowProfiler] = useState(false);
  const [testResults, setTestResults] = useState(null);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // OPTIMIZATION 1: Memoize Grid Generation. 
  // It only needs to recalculate when the displayed month/year changes, not on modal opens.
  const grid = useMemo(() => {
    return generateCalendarGrid(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  // OPTIMIZATION 2: Group posts by date in O(N) time.
  // Previously, we were running `posts.filter()` inside the grid cell loop (O(N*M)).
  const postsByDate = useMemo(() => {
    const map = {};
    posts.forEach(post => {
      if (!map[post.date]) map[post.date] = [];
      map[post.date].push(post);
    });
    return map;
  }, [posts]);

  // OPTIMIZATION 3: Stable references for event handlers using useCallback.
  // This prevents the child CalendarCells from re-rendering just because the parent function reference changed.
  const nextMonth = useCallback(() => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const prevMonth = useCallback(() => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const handleDateClick = useCallback((dateString) => {
    setSelectedDate(dateString);
    setEditingPost(null);
    setModalOpen(true);
  }, []);

  const handlePostClick = useCallback((post) => {
    setEditingPost(post);
    setSelectedDate(post.date);
    setModalOpen(true);
  }, []);

  // TESTING STRATEGY: Simulated Unit Tests Module
  const runTests = () => {
    const results = [];
    try {
       // Test 1: generateCalendarGrid
       const mockGrid = generateCalendarGrid(2026, 8); // Sept 2026
       results.push({ name: 'Grid Gen: Returns correct cell count (35 or 42)', passed: mockGrid.length === 35 || mockGrid.length === 42 });
       
       // Test 2: date formatting
       const formatted = formatDate(2026, 8, 5); // Month is 0-indexed (Sept)
       results.push({ name: 'Date Util: Formats correctly (YYYY-MM-DD)', passed: formatted === '2026-09-05' });

       // Test 3: Reducer logic
       const state1 = postReducer([], {type: 'ADD_POST', payload: {id: 1, title: 'Test'}});
       results.push({ name: 'postReducer: ADD_POST increases state length', passed: state1.length === 1 });

       // Test 4: Verify Component Memoization
       results.push({ name: 'CalendarCell: Memoization applied', passed: typeof CalendarCell.type === 'symbol' || CalendarCell.displayName === 'Memo' || !!CalendarCell.compare }); 
    } catch (e) {
       results.push({ name: 'Tests encountered an error', passed: false, error: e.message });
    }
    setTestResults(results);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-sm">
              <CalendarIcon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Content Calendar</h1>
              <p className="text-sm text-gray-500">Drag and drop posts to reschedule</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <button onClick={prevMonth} className="p-2 hover:bg-gray-50 text-gray-600 transition-colors border-r border-gray-200">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="px-4 py-2 font-semibold text-gray-800 min-w-[140px] text-center bg-white flex items-center justify-center">
                {MONTHS[currentMonth]} {currentYear}
              </div>
              <button onClick={nextMonth} className="p-2 hover:bg-gray-50 text-gray-600 transition-colors border-l border-gray-200">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            
            <button 
              onClick={goToToday}
              className="px-4 py-2 bg-white text-gray-700 font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm hidden sm:block"
            >
              Today
            </button>
            
            <button 
              onClick={() => handleDateClick(formatDate(currentYear, currentMonth, new Date().getDate()))}
              className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> <span className="hidden sm:inline">New Post</span>
            </button>
          </div>
        </div>

        {/* Performance & Testing Dashboard Overlay */}
        <div className="mb-6 bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Activity className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 text-sm">Performance & Testing Lab</h3>
              <p className="text-xs text-gray-500 max-w-sm">Turn on profiler and open the New Post modal to observe how <code className="bg-gray-100 px-1 rounded">React.memo</code> prevents the grid from re-rendering.</p>
            </div>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button 
              onClick={() => setShowProfiler(!showProfiler)}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${showProfiler ? 'bg-purple-100 border-purple-300 text-purple-800 shadow-inner' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              {showProfiler ? 'Disable Profiler' : 'Enable Profiler'}
            </button>
            <button 
              onClick={runTests}
              className="flex-1 sm:flex-none px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm"
            >
              Run Logic Tests
            </button>
          </div>
        </div>

        {/* Test Results Panel */}
        {testResults && (
          <div className="mb-6 bg-slate-900 p-5 rounded-xl border border-slate-700 text-slate-300 font-mono text-sm shadow-inner overflow-hidden animate-in fade-in slide-in-from-top-2">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-700">
               <span className="font-bold text-white flex items-center gap-2">
                 <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Test Execution Results
               </span>
               <button onClick={() => setTestResults(null)} className="text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-800 transition-colors">Clear</button>
            </div>
            <div className="space-y-3">
               {testResults.map((tr, i) => (
                 <div key={i} className="flex items-start gap-3 bg-slate-800/50 p-2 rounded border border-slate-700/50">
                    {tr.passed ? <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" /> : <XCircle className="h-5 w-5 text-red-400 shrink-0" />}
                    <span className={`${tr.passed ? 'text-slate-200' : 'text-red-300 font-bold'}`}>{tr.name}</span>
                 </div>
               ))}
            </div>
          </div>
        )}

        {/* Calendar Grid Container */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          
          {/* Days of Week Header */}
          <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/80">
            {DAYS_OF_WEEK.map((day, i) => (
              <div key={day} className={`
                py-3 text-center text-xs sm:text-sm font-semibold text-gray-600 border-r border-gray-200 last:border-r-0
                ${(i === 0 || i === 6) ? 'text-indigo-600' : ''}
              `}>
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Cells */}
          <div className="grid grid-cols-7 bg-gray-200 gap-[1px]">
            {grid.map((cell, index) => {
              // OPTIMIZATION 4: O(1) Lookup using grouped data. 
              // We pass EMPTY_ARRAY fallback to guarantee a stable reference for days without posts.
              const dayPosts = postsByDate[cell.dateString] || EMPTY_ARRAY;
              
              return (
                <CalendarCell 
                  key={`${cell.month}-${cell.day}-${index}`}
                  dayData={cell}
                  dayPosts={dayPosts}
                  onDateClick={handleDateClick}
                  onPostClick={handlePostClick}
                  showProfiler={showProfiler}
                />
              );
            })}
          </div>
        </div>

        {/* Global Modal */}
        <PostModal 
          isOpen={modalOpen} 
          onClose={() => setModalOpen(false)} 
          selectedDate={selectedDate}
          existingPost={editingPost}
        />

      </div>
    </div>
  );
};

// -------------------------------------------------------------------
// 5. ROOT COMPONENT EXPORT
// -------------------------------------------------------------------
export default function App() {
  return (
    <PostProvider>
      <CalendarApp />
    </PostProvider>
  );
}