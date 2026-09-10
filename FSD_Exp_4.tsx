import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon, 
  Twitter, 
  Facebook, 
  Linkedin,
  Instagram,
  Clock,
  X,
  Trash2,
  Edit2
} from 'lucide-react';

// --- Utility Functions ---
const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

const formatDateString = (year, month, day) => {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const PLATFORMS = {
  twitter: { icon: Twitter, color: 'bg-blue-400', text: 'text-blue-900', label: 'Twitter' },
  facebook: { icon: Facebook, color: 'bg-blue-600', text: 'text-blue-50', label: 'Facebook' },
  linkedin: { icon: Linkedin, color: 'bg-blue-700', text: 'text-blue-50', label: 'LinkedIn' },
  instagram: { icon: Instagram, color: 'bg-pink-600', text: 'text-pink-50', label: 'Instagram' },
};

export default function App() {
  // --- State Management ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [draggedEventId, setDraggedEventId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    platform: 'twitter',
    time: '12:00'
  });

  // Seed initial data based on current month
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    setEvents([
      {
        id: '1',
        title: 'Product Launch Thread',
        content: 'Exciting news! We are launching...',
        platform: 'twitter',
        date: formatDateString(year, month, 10),
        time: '09:00'
      },
      {
        id: '2',
        title: 'Weekly Tips',
        content: 'Here are 5 tips for better productivity.',
        platform: 'linkedin',
        date: formatDateString(year, month, 15),
        time: '14:30'
      },
      {
        id: '3',
        title: 'Behind the Scenes',
        content: 'Look at our amazing team working hard.',
        platform: 'instagram',
        date: formatDateString(year, month, 22),
        time: '17:00'
      }
    ]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // --- Calendar Math ---
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // --- Handlers ---
  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const handleToday = () => setCurrentDate(new Date());

  const openModal = (date, event = null) => {
    setSelectedDate(date);
    if (event) {
      setEditingEvent(event);
      setFormData({
        title: event.title,
        content: event.content,
        platform: event.platform,
        time: event.time
      });
    } else {
      setEditingEvent(null);
      setFormData({
        title: '',
        content: '',
        platform: 'twitter',
        time: '12:00'
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEvent(null);
  };

  const handleSaveEvent = (e) => {
    e.preventDefault();
    if (editingEvent) {
      // Update existing
      setEvents(events.map(ev => 
        ev.id === editingEvent.id 
          ? { ...ev, ...formData, date: selectedDate } 
          : ev
      ));
    } else {
      // Create new
      const newEvent = {
        id: Math.random().toString(36).substr(2, 9),
        date: selectedDate,
        ...formData
      };
      setEvents([...events, newEvent]);
    }
    closeModal();
  };

  const handleDeleteEvent = (id) => {
    setEvents(events.filter(ev => ev.id !== id));
    closeModal();
  };

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e, eventId) => {
    setDraggedEventId(eventId);
    // Needed for Firefox
    e.dataTransfer.setData('text/plain', eventId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetDate) => {
    e.preventDefault();
    if (!draggedEventId) return;

    setEvents(events.map(ev => 
      ev.id === draggedEventId 
        ? { ...ev, date: targetDate } 
        : ev
    ));
    setDraggedEventId(null);
  };

  // --- Render Helpers ---
  const renderCalendarDays = () => {
    const days = [];
    
    // Empty cells before the 1st of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="bg-slate-50 border-r border-b border-slate-200 min-h-[120px] p-2 opacity-50"></div>
      );
    }
    
    // Actual days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = formatDateString(year, month, day);
      const dayEvents = events.filter(e => e.date === dateString).sort((a, b) => a.time.localeCompare(b.time));
      
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
      
      days.push(
        <div 
          key={day} 
          className={`bg-white border-r border-b border-slate-200 min-h-[120px] p-2 group transition-colors hover:bg-slate-50 relative ${isToday ? 'bg-blue-50/30' : ''}`}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, dateString)}
          onClick={(e) => {
            // Prevent opening create modal if clicking on an event
            if (e.target === e.currentTarget || e.target.classList.contains('day-header')) {
               openModal(dateString);
            }
          }}
        >
          <div className="flex justify-between items-center mb-2 day-header cursor-pointer" onClick={() => openModal(dateString)}>
            <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-slate-700'}`}>
              {day}
            </span>
            <button 
              className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-blue-600 p-1"
              title="Add Post"
              onClick={(e) => { e.stopPropagation(); openModal(dateString); }}
            >
              <Plus size={16} />
            </button>
          </div>
          
          <div className="space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
            {dayEvents.map(event => {
              const PlatformIcon = PLATFORMS[event.platform].icon;
              return (
                <div
                  key={event.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, event.id)}
                  onClick={(e) => { e.stopPropagation(); openModal(dateString, event); }}
                  className={`cursor-move p-1.5 rounded-md shadow-sm border border-transparent hover:border-slate-300 transition-all ${PLATFORMS[event.platform].color} ${PLATFORMS[event.platform].text} text-xs flex items-center gap-1.5`}
                  title={`${event.time} - ${event.title}`}
                >
                  <PlatformIcon size={12} className="shrink-0" />
                  <span className="font-medium truncate">{event.title}</span>
                </div>
              )
            })}
          </div>
        </div>
      );
    }
    
    // Fill remaining grid to keep structure solid (optional, but looks cleaner)
    const totalCells = days.length;
    const rows = Math.ceil(totalCells / 7);
    const missingCells = (rows * 7) - totalCells;
    
    for (let i = 0; i < missingCells; i++) {
      days.push(
         <div key={`empty-end-${i}`} className="bg-slate-50 border-r border-b border-slate-200 min-h-[120px] p-2 opacity-50"></div>
      );
    }
    
    return days;
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2 text-blue-600">
          <CalendarIcon size={24} className="text-blue-600" />
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Content Scheduler</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button onClick={handleToday} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors">
            Today
          </button>
          
          <div className="flex items-center gap-2 bg-slate-100 rounded-md p-1">
            <button onClick={handlePrevMonth} className="p-1 hover:bg-white hover:shadow-sm rounded transition-all text-slate-600">
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm font-semibold w-32 text-center">
              {monthNames[month]} {year}
            </span>
            <button onClick={handleNextMonth} className="p-1 hover:bg-white hover:shadow-sm rounded transition-all text-slate-600">
              <ChevronRight size={20} />
            </button>
          </div>
          
          <button 
            onClick={() => openModal(formatDateString(year, month, new Date().getDate()))}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus size={16} />
            <span>New Post</span>
          </button>
        </div>
      </header>

      {/* Main Calendar Content */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          
          {/* Days Header */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
            {dayNames.map(day => (
              <div key={day} className="py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider border-r border-slate-200 last:border-0">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 border-l border-t border-slate-200 -ml-[1px] -mt-[1px]">
            {renderCalendarDays()}
          </div>
          
        </div>
      </main>

      {/* Post Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">
                {editingEvent ? 'Edit Scheduled Post' : 'Schedule New Post'}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveEvent} className="p-6">
              <div className="space-y-4">
                
                {/* Platform Selector */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Platform</label>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(PLATFORMS).map(([key, config]) => {
                      const Icon = config.icon;
                      const isSelected = formData.platform === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setFormData({...formData, platform: key})}
                          className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg border transition-all ${
                            isSelected 
                              ? `${config.color} border-transparent ${config.text} shadow-sm ring-2 ring-offset-1 ring-slate-200` 
                              : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          <Icon size={20} className="mb-1" />
                          <span className="text-[10px] font-semibold">{config.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                    <input 
                      type="date" 
                      required
                      value={selectedDate || ''}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                      <Clock size={14}/> Time
                    </label>
                    <input 
                      type="time" 
                      required
                      value={formData.time}
                      onChange={(e) => setFormData({...formData, time: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    />
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Product Launch Announcement"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Post Content</label>
                  <textarea 
                    rows="3"
                    required
                    placeholder="What do you want to share?"
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none text-sm"
                  ></textarea>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-100">
                {editingEvent ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteEvent(editingEvent.id)}
                    className="text-red-500 hover:text-red-700 p-2 rounded-md hover:bg-red-50 transition-colors flex items-center gap-1 text-sm font-medium"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                ) : <div></div>}
                
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center gap-2"
                  >
                    {editingEvent ? <Edit2 size={16} /> : <Plus size={16} />}
                    {editingEvent ? 'Update Post' : 'Schedule'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Small custom style block for styling scrollbars neatly */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}} />
    </div>
  );
}