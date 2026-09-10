import React, { useState, useContext, createContext, useMemo } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Users, 
  FileEdit, 
  LayoutDashboard, 
  LogOut, 
  Lock,
  Eye,
  AlertTriangle,
  ServerCrash
} from 'lucide-react';


// -------------------------------------------------------------------
// 1. MOCK DATA & CONTEXT SETUPS
// -------------------------------------------------------------------

// Mock Users with different roles
const MOCK_USERS = {
  admin:  { id: 1, name: 'Alice (Admin)', role: 'Admin', avatar: 'bg-red-500' },
  editor: { id: 2, name: 'Bob (Editor)', role: 'Editor', avatar: 'bg-blue-500' },
  viewer: { id: 3, name: 'Charlie (Viewer)', role: 'Viewer', avatar: 'bg-emerald-500' }
};

// Define permissions hierarchy for UI conditional rendering
const PERMISSIONS = {
  canEditContent: ['Admin', 'Editor'],
  canDeleteUsers: ['Admin'],
  canViewReports: ['Admin', 'Editor', 'Viewer']
};

// Context for Authentication
const AuthContext = createContext(null);

// Context for lightweight routing
const RouterContext = createContext(null);


// -------------------------------------------------------------------
// 2. PROVIDERS
// -------------------------------------------------------------------

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // null means unauthenticated

  const login = (roleKey) => setUser(MOCK_USERS[roleKey]);
  const logout = () => setUser(null);

  // Helper to check if current user has a specific permission
  const hasPermission = (allowedRoles) => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

const RouterProvider = ({ children }) => {
  const [currentPath, setCurrentPath] = useState('/login');

  const navigate = (path) => setCurrentPath(path);

  return (
    <RouterContext.Provider value={{ currentPath, navigate }}>
      {children}
    </RouterContext.Provider>
  );
};

// Custom Hooks for easy access
const useAuth = () => useContext(AuthContext);
const useRouter = () => useContext(RouterContext);


// -------------------------------------------------------------------
// 3. CORE RBAC COMPONENTS
// -------------------------------------------------------------------

// The ProtectedRoute component intercepts rendering based on roles
const ProtectedRoute = ({ allowedRoles, children }) => {
  const { user } = useAuth();

  if (!user) {
    return <Unauthorized message="You must be logged in to view this page." type="login" />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Unauthorized message={`Access Denied. Requires one of: ${allowedRoles.join(', ')}`} type="role" />;
  }

  return children;
};

// Component to wrap specific UI elements (buttons, sections) based on roles
const RoleBasedUI = ({ allowedRoles, children }) => {
  const { hasPermission } = useAuth();
  
  if (!hasPermission(allowedRoles)) {
    return null; // Don't render the element at all
  }
  
  return children;
};

// Reusable Unauthorized / Access Denied view
const Unauthorized = ({ message, type }) => {
  const { navigate } = useRouter();
  
  return (
    <div className="flex flex-col items-center justify-center h-full bg-red-50 rounded-2xl border border-red-100 p-8 text-center min-h-[400px]">
      <ShieldAlert className="h-16 w-16 text-red-500 mb-4" />
      <h2 className="text-2xl font-bold text-red-900 mb-2">
        {type === 'login' ? 'Authentication Required' : 'Access Restricted'}
      </h2>
      <p className="text-red-700 mb-6">{message}</p>
      
      {type === 'role' && (
        <button 
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm"
        >
          Return to Dashboard
        </button>
      )}
    </div>
  );
};


// -------------------------------------------------------------------
// 4. APPLICATION PAGES (VIEWS)
// -------------------------------------------------------------------

const LoginView = () => {
  const { login } = useAuth();
  const { navigate } = useRouter();

  const handleLogin = (role) => {
    login(role);
    navigate('/dashboard');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 max-w-md w-full text-center">
        <div className="mx-auto bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
          <Lock className="h-8 w-8 text-indigo-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">RBAC System</h1>
        <p className="text-slate-500 mb-8">Select a role to log in and test permissions.</p>
        
        <div className="space-y-3">
          <button onClick={() => handleLogin('admin')} className="w-full flex items-center justify-between p-4 border border-red-200 bg-red-50 hover:bg-red-100 text-red-900 rounded-xl transition-colors font-semibold group">
            <span className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-red-500 group-hover:scale-110 transition-transform" /> Log in as Admin</span>
            <span className="text-xs bg-red-200 px-2 py-1 rounded text-red-800">Full Access</span>
          </button>
          
          <button onClick={() => handleLogin('editor')} className="w-full flex items-center justify-between p-4 border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-xl transition-colors font-semibold group">
            <span className="flex items-center gap-3"><FileEdit className="h-5 w-5 text-blue-500 group-hover:scale-110 transition-transform" /> Log in as Editor</span>
            <span className="text-xs bg-blue-200 px-2 py-1 rounded text-blue-800">Partial Access</span>
          </button>
          
          <button onClick={() => handleLogin('viewer')} className="w-full flex items-center justify-between p-4 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-xl transition-colors font-semibold group">
            <span className="flex items-center gap-3"><Eye className="h-5 w-5 text-emerald-500 group-hover:scale-110 transition-transform" /> Log in as Viewer</span>
            <span className="text-xs bg-emerald-200 px-2 py-1 rounded text-emerald-800">Read Only</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const DashboardView = () => {
  const { user } = useAuth();
  
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">General Dashboard</h2>
        <p className="text-slate-600">Welcome back! This page is accessible to everyone who is logged in (Admins, Editors, and Viewers).</p>
      </div>

      {/* Example of In-Page UI Conditional Rendering based on Roles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Visible to everyone */}
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-3">
            <Eye className="h-4 w-4 text-emerald-500" /> Read Analytics
          </h3>
          <p className="text-sm text-slate-500 mb-4">You can view these basic statistics.</p>
          <button className="w-full py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50">View Report</button>
        </div>

        {/* Visible to Admins and Editors */}
        <RoleBasedUI allowedRoles={PERMISSIONS.canEditContent}>
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
            <h3 className="font-semibold text-blue-900 flex items-center gap-2 mb-3">
              <FileEdit className="h-4 w-4 text-blue-500" /> Content Editor
            </h3>
            <p className="text-sm text-blue-700 mb-4">Because you are an {user.role}, you can edit content.</p>
            <button className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm">Create New Post</button>
          </div>
        </RoleBasedUI>

        {/* Visible to Admins ONLY */}
        <RoleBasedUI allowedRoles={PERMISSIONS.canDeleteUsers}>
          <div className="bg-red-50 p-6 rounded-xl border border-red-100">
            <h3 className="font-semibold text-red-900 flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-red-500" /> Danger Zone
            </h3>
            <p className="text-sm text-red-700 mb-4">Admin exclusive actions. Handle with care.</p>
            <button className="w-full py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 shadow-sm">Purge Database</button>
          </div>
        </RoleBasedUI>

      </div>
    </div>
  );
};

const EditorWorkspaceView = () => (
  <div className="bg-white p-8 rounded-2xl border border-blue-200 shadow-sm min-h-[400px]">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-3 bg-blue-100 rounded-lg"><FileEdit className="h-6 w-6 text-blue-600" /></div>
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Editor Workspace</h2>
        <p className="text-slate-500">Accessible by Admins and Editors.</p>
      </div>
    </div>
    <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-8 text-center">
      <p className="text-slate-500 font-medium">Drafting area... You have the required permissions to be here.</p>
    </div>
  </div>
);

const AdminPanelView = () => (
  <div className="bg-slate-900 p-8 rounded-2xl border border-slate-700 shadow-xl min-h-[400px] text-slate-100">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-3 bg-red-500/20 rounded-lg border border-red-500/30"><ServerCrash className="h-6 w-6 text-red-400" /></div>
      <div>
        <h2 className="text-2xl font-bold text-white">System Administration</h2>
        <p className="text-slate-400">Strictly accessible by Admins only.</p>
      </div>
    </div>
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
      <h3 className="font-semibold mb-4 text-red-400">System Logs</h3>
      <div className="font-mono text-xs text-slate-400 space-y-2">
        <p>[SYS] Authentication module loaded successfully.</p>
        <p>[SYS] RBAC policies enforced across routes.</p>
        <p>[SEC] Unauthorized access attempt blocked from IP 192.168.1.5</p>
        <p className="text-emerald-400">[OK] All systems operational.</p>
      </div>
    </div>
  </div>
);


// -------------------------------------------------------------------
// 5. MAIN LAYOUT & ROUTER SWITCH
// -------------------------------------------------------------------

const AppLayout = () => {
  const { user, logout } = useAuth();
  const { currentPath, navigate } = useRouter();

  // Redirect to login if unauthenticated and trying to access app wrapper
  if (!user && currentPath !== '/login') {
    return <LoginView />;
  }

  // If on login page but authenticated, redirect to dashboard
  if (user && currentPath === '/login') {
    navigate('/dashboard');
    return null;
  }

  if (!user) return <LoginView />;

  return (
    <div className="flex h-screen bg-slate-100 font-sans">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-2xl z-10">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-indigo-400" /> SecureApp
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {/* Dashboard is visible to all roles */}
          <button 
            onClick={() => navigate('/dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${currentPath === '/dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <LayoutDashboard className="h-5 w-5" /> Dashboard
          </button>

          {/* Editor link visible to Admin/Editor, but we can also choose to show it to everyone 
              and let the ProtectedRoute handle the block. For UX, it's usually best to hide links 
              users can't access, but for this demo, we'll show them to demonstrate the block! */}
          
          <button 
            onClick={() => navigate('/editor')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${currentPath === '/editor' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <FileEdit className="h-5 w-5" /> Editor Tools
            {/* Visual indicator that this is restricted */}
            {!['Admin', 'Editor'].includes(user.role) && <Lock className="h-4 w-4 ml-auto text-slate-600" />}
          </button>

          <button 
            onClick={() => navigate('/admin')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${currentPath === '/admin' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <Users className="h-5 w-5" /> Admin Panel
            {/* Visual indicator that this is restricted */}
            {user.role !== 'Admin' && <Lock className="h-4 w-4 ml-auto text-slate-600" />}
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold ${user.avatar}`}>
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.role}</p>
            </div>
          </div>
          <button 
            onClick={() => { logout(); navigate('/login'); }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-red-900/50 hover:text-red-400 text-slate-300 rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto">
          {/* 
            ROUTING SWITCH LOGIC
            Here we wrap our views in ProtectedRoutes to enforce RBAC.
          */}
          {currentPath === '/dashboard' && (
            <ProtectedRoute allowedRoles={['Admin', 'Editor', 'Viewer']}>
              <DashboardView />
            </ProtectedRoute>
          )}

          {currentPath === '/editor' && (
            <ProtectedRoute allowedRoles={['Admin', 'Editor']}>
              <EditorWorkspaceView />
            </ProtectedRoute>
          )}

          {currentPath === '/admin' && (
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminPanelView />
            </ProtectedRoute>
          )}
        </div>
      </main>
      
    </div>
  );
};


// -------------------------------------------------------------------
// 6. ROOT COMPONENT
// -------------------------------------------------------------------

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider>
        <AppLayout />
      </RouterProvider>
    </AuthProvider>
  );
}