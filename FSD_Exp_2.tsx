import React, { useState, useEffect } from 'react';
import { configureStore, createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { 
  Share2, 
  Plus, 
  Trash2, 
  Layout, 
  MessageSquare, 
  Loader2, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';

// -------------------------------------------------------------------
// 1. MOCK API SETUP
// -------------------------------------------------------------------
// We simulate network delays to practice asynchronous Redux flows.
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const mockApi = {
  fetchPosts: async () => {
    await delay(1000);
    return [
      { id: 'p1', title: 'Getting started with Redux Toolkit', content: 'RTK simplifies standard Redux tasks.', platformId: 'plat-1', createdAt: new Date().toISOString() },
      { id: 'p2', title: 'React Hooks Deep Dive', content: 'Understanding useEffect and useCallback.', platformId: 'plat-2', createdAt: new Date().toISOString() },
    ];
  },
  addPost: async (post) => {
    await delay(800);
    return { ...post, id: `p${Date.now()}`, createdAt: new Date().toISOString() };
  },
  deletePost: async (id) => {
    await delay(500);
    return id;
  }
};

// -------------------------------------------------------------------
// 1.5 CUSTOM REDUX-LIKE IMPLEMENTATION 
// (Since standard Redux packages aren't available in this specific environment, 
// we'll build a lightweight version that perfectly mimics Redux Toolkit's behavior)
// -------------------------------------------------------------------

const createStore = (reducer, initialState) => {
  let state = initialState;
  let listeners = [];

  const getState = () => state;

  const dispatch = (action) => {
    // Handle Thunks (Async actions)
    if (typeof action === 'function') {
      return action(dispatch, getState);
    }
    
    // Handle Standard Actions
    state = reducer(state, action);
    listeners.forEach(listener => listener());
  };

  const subscribe = (listener) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  };

  // Dispatch an init action to populate the initial state
  dispatch({ type: '@@INIT' });

  return { getState, dispatch, subscribe };
};

// Custom createAsyncThunk mock
const createMockAsyncThunk = (typePrefix, payloadCreator) => {
  const thunk = (arg) => async (dispatch) => {
    dispatch({ type: `${typePrefix}/pending` });
    try {
      const result = await payloadCreator(arg);
      dispatch({ type: `${typePrefix}/fulfilled`, payload: result });
      return result;
    } catch (error) {
      dispatch({ type: `${typePrefix}/rejected`, error });
      throw error;
    }
  };
  
  thunk.pending = `${typePrefix}/pending`;
  thunk.fulfilled = `${typePrefix}/fulfilled`;
  thunk.rejected = `${typePrefix}/rejected`;
  
  return thunk;
};

// Context for Provider
const StoreContext = React.createContext(null);

// Custom Provider
const Provider = ({ store, children }) => {
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
};

// Custom useDispatch
const useDispatch = () => {
  const store = React.useContext(StoreContext);
  return store.dispatch;
};

// Custom useSelector
const useSelector = (selector) => {
  const store = React.useContext(StoreContext);
  const [state, setState] = useState(selector(store.getState()));

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setState(selector(store.getState()));
    });
    return unsubscribe;
  }, [store, selector]);

  return state;
};

// -------------------------------------------------------------------
// 2. STATE & REDUCERS (Mimicking Redux Slices)
// -------------------------------------------------------------------

// --- Platforms (Synchronous/Static State) ---
// Demonstrates normalized state where Platforms are kept separate from Posts.
const initialPlatforms = [
  { id: 'plat-1', name: 'Twitter', color: 'bg-blue-500' },
  { id: 'plat-2', name: 'LinkedIn', color: 'bg-blue-700' },
  { id: 'plat-3', name: 'Facebook', color: 'bg-blue-600' },
  { id: 'plat-4', name: 'Instagram', color: 'bg-pink-600' },
];

const platformsReducer = (state = initialPlatforms, action) => {
  switch (action.type) {
    case 'platforms/addPlatform':
      return [...state, action.payload];
    default:
      return state;
  }
};

// --- Posts (Asynchronous State) ---
// Thunks for API simulation
export const fetchPosts = createMockAsyncThunk('posts/fetchPosts', async () => {
  return await mockApi.fetchPosts();
});

export const addPost = createMockAsyncThunk('posts/addPost', async (newPost) => {
  return await mockApi.addPost(newPost);
});

export const deletePost = createMockAsyncThunk('posts/deletePost', async (id) => {
  return await mockApi.deletePost(id);
});

const initialPostsState = {
  items: [],
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  actionStatus: { type: '', message: '' } // For UI feedback on create/delete
};

const postsReducer = (state = initialPostsState, action) => {
  switch (action.type) {
    case 'posts/clearActionStatus':
      return { ...state, actionStatus: { type: '', message: '' } };
      
    // Fetch Posts
    case fetchPosts.pending:
      return { ...state, status: 'loading' };
    case fetchPosts.fulfilled:
      return { ...state, status: 'succeeded', items: action.payload };
    case fetchPosts.rejected:
      return { ...state, status: 'failed', error: action.error.message };
      
    // Add Post
    case addPost.pending:
      return { ...state, actionStatus: { type: 'loading', message: 'Publishing post...' } };
    case addPost.fulfilled:
      return { 
        ...state, 
        items: [action.payload, ...state.items],
        actionStatus: { type: 'success', message: 'Post published successfully!' }
      };
      
    // Delete Post
    case deletePost.pending:
      return { ...state, actionStatus: { type: 'loading', message: 'Deleting post...' } };
    case deletePost.fulfilled:
      return { 
        ...state, 
        items: state.items.filter(post => post.id !== action.payload),
        actionStatus: { type: 'success', message: 'Post deleted.' }
      };
      
    default:
      return state;
  }
};

export const clearActionStatus = () => ({ type: 'posts/clearActionStatus' });

// -------------------------------------------------------------------
// 3. STORE CONFIGURATION
// -------------------------------------------------------------------
const rootReducer = (state = {}, action) => ({
  platforms: platformsReducer(state.platforms, action),
  posts: postsReducer(state.posts, action),
});

const store = createStore(rootReducer, {
  platforms: initialPlatforms,
  posts: initialPostsState
});

// -------------------------------------------------------------------
// 4. REACT COMPONENTS
// -------------------------------------------------------------------

// Component: Create Post Form
const CreatePostForm = () => {
  const dispatch = useDispatch();
  const platforms = useSelector((state) => state.platforms);
  const actionStatus = useSelector((state) => state.posts.actionStatus);
  
  const [formData, setFormData] = useState({ title: '', content: '', platformId: platforms[0]?.id || '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.title.trim() && formData.content.trim()) {
      dispatch(addPost(formData));
      setFormData({ title: '', content: '', platformId: platforms[0]?.id || '' });
      
      // Auto-clear success message after 3s
      setTimeout(() => {
        dispatch(clearActionStatus());
      }, 3000);
    }
  };

  const isSubmitting = actionStatus.type === 'loading';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
        <Plus className="h-5 w-5 text-indigo-600" />
        <h2 className="text-lg font-semibold text-gray-800">Create New Post</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Target Platform</label>
          <select
            name="platformId"
            value={formData.platformId}
            onChange={handleChange}
            disabled={isSubmitting}
            className="w-full rounded-lg border-gray-300 border px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
          >
            {platforms.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Post Title</label>
          <input
            type="text"
            name="title"
            required
            value={formData.title}
            onChange={handleChange}
            disabled={isSubmitting}
            className="w-full rounded-lg border-gray-300 border px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
            placeholder="Announcing our new feature..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
          <textarea
            name="content"
            required
            rows={4}
            value={formData.content}
            onChange={handleChange}
            disabled={isSubmitting}
            className="w-full rounded-lg border-gray-300 border px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 resize-none"
            placeholder="Write your post content here..."
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 transition-colors"
        >
          {isSubmitting ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
          ) : (
            <><Share2 className="h-4 w-4" /> Publish Post</>
          )}
        </button>
      </form>
    </div>
  );
};

// Component: Post List Display
const PostList = () => {
  const dispatch = useDispatch();
  const { items: posts, status, error } = useSelector((state) => state.posts);
  const platforms = useSelector((state) => state.platforms);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchPosts());
    }
  }, [status, dispatch]);

  const handleDelete = (id) => {
    if(window.confirm('Are you sure you want to delete this post?')) {
      dispatch(deletePost(id));
      setTimeout(() => dispatch(clearActionStatus()), 3000);
    }
  };

  // Helper to get platform details by ID (Normalizing state)
  const getPlatform = (id) => platforms.find(p => p.id === id) || { name: 'Unknown', color: 'bg-gray-500' };

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Fetching posts from API...</p>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 flex items-center gap-3">
        <AlertCircle className="h-5 w-5" />
        <p>Error loading posts: {error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layout className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-800">Published Posts</h2>
        </div>
        <span className="bg-indigo-100 text-indigo-800 py-1 px-3 rounded-full text-xs font-bold">
          {posts.length} Total
        </span>
      </div>

      <div className="divide-y divide-gray-100">
        {posts.length === 0 ? (
          <div className="p-8 text-center text-gray-500 flex flex-col items-center">
            <MessageSquare className="h-10 w-10 text-gray-300 mb-3" />
            <p>No posts available. Create one to get started!</p>
          </div>
        ) : (
          posts.map((post) => {
            const platform = getPlatform(post.platformId);
            return (
              <div key={post.id} className="p-6 hover:bg-gray-50 transition-colors group">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <span className={`${platform.color} text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-sm`}>
                      {platform.name}
                    </span>
                    <h3 className="font-semibold text-gray-900">{post.title}</h3>
                  </div>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="text-gray-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                    title="Delete Post"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-gray-600 text-sm mt-2 line-clamp-2">{post.content}</p>
                <div className="mt-3 text-xs text-gray-400 font-medium">
                  ID: {post.id} • Created: {new Date(post.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// -------------------------------------------------------------------
// 5. MAIN APP LAYOUT
// -------------------------------------------------------------------
const MainApp = () => {
  const actionStatus = useSelector(state => state.posts.actionStatus);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Share2 className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Redux Hub
            </h1>
          </div>
        </div>
      </header>

      {/* Global Status Toast */}
      {actionStatus.message && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className={`p-4 rounded-xl flex items-center gap-3 border shadow-sm ${
            actionStatus.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 
            actionStatus.type === 'loading' ? 'bg-blue-50 border-blue-200 text-blue-800' : ''
          }`}>
            {actionStatus.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <Loader2 className="h-5 w-5 animate-spin" />}
            <p className="font-medium text-sm">{actionStatus.message}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Form */}
          <div className="lg:col-span-4">
            <div className="sticky top-24">
              <CreatePostForm />
              
              <div className="mt-6 bg-indigo-50 border border-indigo-100 rounded-xl p-5">
                <h4 className="font-semibold text-indigo-900 mb-2">Redux Concepts Used:</h4>
                <ul className="text-sm text-indigo-800 space-y-1.5 list-disc list-inside">
                  <li>Centralized <code className="bg-indigo-100 px-1 py-0.5 rounded text-xs">store</code></li>
                  <li>Normalized state slices</li>
                  <li><code className="bg-indigo-100 px-1 py-0.5 rounded text-xs">createAsyncThunk</code> for APIs</li>
                  <li><code className="bg-indigo-100 px-1 py-0.5 rounded text-xs">useSelector</code> & <code className="bg-indigo-100 px-1 py-0.5 rounded text-xs">useDispatch</code></li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* Right Column: List */}
          <div className="lg:col-span-8">
            <PostList />
          </div>
        </div>
      </main>
    </div>
  );
};

// -------------------------------------------------------------------
// 6. EXPORT WRAPPER WITH PROVIDER
// -------------------------------------------------------------------
export default function App() {
  return (
    <Provider store={store}>
      <MainApp />
    </Provider>
  );
}