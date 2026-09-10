import React, { useState, useEffect } from 'react';
import { Save, Edit2, Trash2, Plus, Clock, FileText } from 'lucide-react';

// Main App Component
const App = () => {
  // State for managing the list of drafts
  const [drafts, setDrafts] = useState(() => {
    // Initialize state from localStorage if available
    const savedDrafts = localStorage.getItem('postDrafts');
    return savedDrafts ? JSON.parse(savedDrafts) : [];
  });

  // State for managing the current draft being created/edited
  const [currentDraft, setCurrentDraft] = useState({ id: null, title: '', content: '' });

  // State for UI feedback (loading, success/error messages)
  const [status, setStatus] = useState({ loading: false, message: '', type: '' });

  // Effect to persist drafts to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('postDrafts', JSON.stringify(drafts));
  }, [drafts]);

  // Helper function to simulate network delay for mock API calls
  const simulateApiCall = (delay = 500) => {
    return new Promise((resolve) => setTimeout(resolve, delay));
  };

  // Handle input changes for the draft form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentDraft((prev) => ({ ...prev, [name]: value }));
  };

  // Save or Update a draft
  const handleSaveDraft = async (e) => {
    e.preventDefault();
    if (!currentDraft.title.trim()) {
      setStatus({ loading: false, message: 'Title is required to save a draft.', type: 'error' });
      return;
    }

    setStatus({ loading: true, message: 'Saving draft...', type: 'info' });

    // Simulate API delay
    await simulateApiCall(800);

    setDrafts((prevDrafts) => {
      if (currentDraft.id) {
        // Update existing draft
        return prevDrafts.map((draft) =>
          draft.id === currentDraft.id ? { ...currentDraft, updatedAt: new Date().toISOString() } : draft
        );
      } else {
        // Create new draft
        const newDraft = {
          ...currentDraft,
          id: Date.now().toString(), // Simple unique ID
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return [newDraft, ...prevDrafts];
      }
    });

    // Reset form and status
    setCurrentDraft({ id: null, title: '', content: '' });
    setStatus({ loading: false, message: 'Draft saved successfully!', type: 'success' });

    // Clear success message after 3 seconds
    setTimeout(() => setStatus({ loading: false, message: '', type: '' }), 3000);
  };

  // Edit an existing draft
  const handleEditDraft = (draft) => {
    setCurrentDraft(draft);
    setStatus({ loading: false, message: '', type: '' }); // Clear any messages
  };

  // Delete a draft
  const handleDeleteDraft = async (id) => {
    // We use window.confirm here as it's a simple browser native way for quick confirmation,
    // though in a production app a custom modal would be preferred.
    if (!window.confirm('Are you sure you want to delete this draft?')) return;

    setStatus({ loading: true, message: 'Deleting draft...', type: 'info' });

    // Simulate API delay
    await simulateApiCall(500);

    setDrafts((prevDrafts) => prevDrafts.filter((draft) => draft.id !== id));

    // If the deleted draft is currently being edited, reset the form
    if (currentDraft.id === id) {
      setCurrentDraft({ id: null, title: '', content: '' });
    }

    setStatus({ loading: false, message: 'Draft deleted.', type: 'success' });
    setTimeout(() => setStatus({ loading: false, message: '', type: '' }), 3000);
  };

  // Clear the form to start a new draft
  const handleNewDraft = () => {
    setCurrentDraft({ id: null, title: '', content: '' });
    setStatus({ loading: false, message: '', type: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight flex items-center justify-center gap-3">
            <FileText className="h-10 w-10 text-indigo-600" />
            Post Draft Manager
          </h1>
          <p className="mt-3 text-base text-gray-600">
            Create, edit, and manage your content drafts locally with mock API simulation.
          </p>
        </div>

        {/* Status Message */}
        {status.message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center justify-center transition-all duration-300 ease-in-out ${
              status.type === 'error'
                ? 'bg-red-50 text-red-800 border border-red-200'
                : status.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}
          >
            <p className="text-sm font-semibold">{status.message}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Draft Form Section */}
          <div className="lg:col-span-2 bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-xl font-semibold text-gray-900 flex justify-between items-center">
                {currentDraft.id ? 'Edit Existing Draft' : 'Create New Draft'}
                {currentDraft.id && (
                  <button
                    onClick={handleNewDraft}
                    className="text-sm flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                  >
                    <Plus className="h-4 w-4" /> New Draft
                  </button>
                )}
              </h3>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleSaveDraft} className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Draft Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    id="title"
                    value={currentDraft.title}
                    onChange={handleInputChange}
                    disabled={status.loading}
                    className="block w-full rounded-lg border-gray-300 border px-4 py-3 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                    placeholder="E.g., 10 Tips for Better React Code"
                  />
                </div>
                
                <div>
                  <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                    Post Content
                  </label>
                  <textarea
                    name="content"
                    id="content"
                    rows={12}
                    value={currentDraft.content}
                    onChange={handleInputChange}
                    disabled={status.loading}
                    className="block w-full rounded-lg border-gray-300 border px-4 py-3 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors resize-y"
                    placeholder="Write the main body of your post here..."
                  />
                </div>
                
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={status.loading}
                    className="inline-flex items-center justify-center gap-2 py-2.5 px-6 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 transition-all"
                  >
                    <Save className="h-4 w-4" />
                    {status.loading ? 'Saving to Storage...' : 'Save Draft'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Draft List Section */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden flex flex-col h-full max-h-[800px]">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900">
                Saved Drafts
              </h3>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                {drafts.length} {drafts.length === 1 ? 'Draft' : 'Drafts'}
              </span>
            </div>
            
            <ul className="divide-y divide-gray-100 overflow-y-auto flex-1">
              {drafts.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center justify-center h-full min-h-[300px]">
                  <FileText className="h-12 w-12 text-gray-300 mb-3" />
                  <p className="text-base font-medium text-gray-600">No drafts saved yet</p>
                  <p className="text-sm text-gray-400 mt-1">Start writing to see your drafts appear here.</p>
                </div>
              ) : (
                drafts.map((draft) => (
                  <li 
                    key={draft.id} 
                    className={`transition-colors border-l-4 ${
                      currentDraft.id === draft.id 
                        ? 'bg-indigo-50 border-indigo-500' 
                        : 'border-transparent hover:bg-gray-50'
                    }`}
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0 pr-4">
                          <p className="text-base font-semibold text-gray-900 truncate" title={draft.title}>
                            {draft.title || 'Untitled Draft'}
                          </p>
                          <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                            {draft.content || 'No content provided.'}
                          </p>
                        </div>
                        <div className="flex-shrink-0 flex flex-col gap-2">
                          <button
                            onClick={() => handleEditDraft(draft)}
                            disabled={status.loading}
                            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors focus:outline-none"
                            title="Edit Draft"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteDraft(draft.id)}
                            disabled={status.loading}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors focus:outline-none"
                            title="Delete Draft"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center text-xs text-gray-400 gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <time dateTime={draft.updatedAt}>
                          Last updated: {new Date(draft.updatedAt).toLocaleDateString()} at {new Date(draft.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </time>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default App;