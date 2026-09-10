import React, { useState, useEffect, useCallback } from 'react';
import { 
  Lock, 
  User, 
  ShieldCheck, 
  LogOut, 
  Loader2, 
  AlertCircle,
  KeyRound,
  Database,
  CheckCircle2
} from 'lucide-react';

// -------------------------------------------------------------------
// 1. MOCK JWT UTILITIES
// -------------------------------------------------------------------
// Note: In a real production app, JWT generation and signing (HMAC SHA256) 
// happens on the backend using a secure secret key. We are mocking this 
// mechanism here using Base64 encoding to demonstrate the token structure.

const mockSecretKey = "super_secret_key_mock_123";

const base64UrlEncode = (str) => {
  // Convert standard Base64 to Base64URL by replacing characters
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

const base64UrlDecode = (str) => {
  // Convert Base64URL back to standard Base64 for atob
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return atob(base64);
};

// Generates a simulated JWT
const generateMockJWT = (payload) => {
  const header = { alg: 'HS256', typ: 'JWT' };
  
  // 1. Encode Header
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  
  // 2. Add expiration (e.g., 1 hour from now)
  const tokenPayload = {
    ...payload,
    iat: Math.floor(Date.now() / 1000), // Issued at
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // Expires in 1hr
  };
  
  // Encode Payload
  const encodedPayload = base64UrlEncode(JSON.stringify(tokenPayload));
  
  // 3. Mock Signature (Normally this is a cryptographic hash of Header + Payload + Secret)
  // We'll just base64 encode a string mimicking a signature for demonstration.
  const signatureInput = `${encodedHeader}.${encodedPayload}.${mockSecretKey}`;
  const mockSignature = base64UrlEncode(signatureInput).substring(0, 43); // Truncate for realism
  
  return `${encodedHeader}.${encodedPayload}.${mockSignature}`;
};

// Decodes a JWT (Client-side decoding of the payload)
const decodeJWT = (token) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid token structure');
    
    const payloadStr = base64UrlDecode(parts[1]);
    return JSON.parse(payloadStr);
  } catch (error) {
    console.error("Failed to decode token:", error);
    return null;
  }
};

// -------------------------------------------------------------------
// 2. MOCK API SERVICES
// -------------------------------------------------------------------
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const mockApi = {
  // Simulate an Authentication Endpoint
  login: async (username, password) => {
    await delay(1200); // Simulate network latency
    
    // Hardcoded demo credentials
    if (username === 'admin' && password === 'password123') {
      const userPayload = {
        id: 'u_8849',
        username: 'admin',
        role: 'Administrator',
        email: 'admin@system.local'
      };
      
      const token = generateMockJWT(userPayload);
      return { success: true, token };
    }
    
    if (username === 'user' && password === 'user123') {
        const userPayload = {
          id: 'u_1122',
          username: 'user',
          role: 'Standard User',
          email: 'user@system.local'
        };
        const token = generateMockJWT(userPayload);
        return { success: true, token };
      }

    throw new Error('Invalid username or password');
  },

  // Simulate a Protected Resource Endpoint requiring a Bearer Token
  fetchProtectedData: async (token) => {
    await delay(800);
    
    if (!token) {
      throw new Error('401 Unauthorized: No token provided');
    }

    const decoded = decodeJWT(token);
    if (!decoded) {
      throw new Error('401 Unauthorized: Invalid token format');
    }

    // Check expiration
    if (decoded.exp * 1000 < Date.now()) {
      throw new Error('401 Unauthorized: Token has expired');
    }

    // Mock Database Response based on Role
    if (decoded.role === 'Administrator') {
      return [
        { id: 1, action: 'System Update', status: 'Completed', date: '2023-10-27' },
        { id: 2, action: 'User Sync', status: 'Pending', date: '2023-10-28' },
        { id: 3, action: 'Security Audit', status: 'In Progress', date: '2023-10-28' },
      ];
    } else {
       return [
        { id: 1, action: 'View Profile', status: 'Completed', date: '2023-10-27' },
        { id: 2, action: 'Change Avatar', status: 'Completed', date: '2023-10-28' }
      ];
    }
  }
};

// -------------------------------------------------------------------
// 3. REACT COMPONENTS
// -------------------------------------------------------------------

// --- Login Form Component ---
const LoginForm = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setCredentials(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError(''); // Clear error on typing
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await mockApi.login(credentials.username, credentials.password);
      if (response.success) {
        onLogin(response.token);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden relative">
      <div className="bg-indigo-600 p-8 text-center">
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
          <ShieldCheck className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white">Secure Access</h2>
        <p className="text-indigo-100 mt-2 text-sm">Enter your credentials to continue</p>
      </div>
      
      <div className="p-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3 text-sm animate-pulse">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                name="username"
                required
                value={credentials.username}
                onChange={handleChange}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 sm:text-sm transition-all"
                placeholder="Try 'admin' or 'user'"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                name="password"
                required
                value={credentials.password}
                onChange={handleChange}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 sm:text-sm transition-all"
                placeholder="Try 'password123' or 'user123'"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Sign In with JWT'}
          </button>
        </form>

        <div className="mt-8 bg-gray-50 p-4 rounded-xl text-xs text-gray-500 border border-gray-200">
          <p className="font-semibold text-gray-700 mb-1">Demo Credentials:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Admin: <code className="bg-gray-200 px-1 rounded">admin</code> / <code className="bg-gray-200 px-1 rounded">password123</code></li>
            <li>User: <code className="bg-gray-200 px-1 rounded">user</code> / <code className="bg-gray-200 px-1 rounded">user123</code></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// --- Protected Dashboard Component ---
const Dashboard = ({ token, user, onLogout }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Extract the raw base64 strings to show the user what a JWT looks like
  const [header, payload, signature] = token.split('.');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    setData(null);
    try {
      // Pass token in request (simulating 'Authorization: Bearer <token>')
      const result = await mockApi.fetchProtectedData(token);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl space-y-6">
      
      {/* Top Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 p-2 rounded-full">
            <User className="h-6 w-6 text-indigo-700" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Welcome, {user.username}</h1>
            <p className="text-sm text-gray-500">{user.role} • {user.email}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors text-sm"
        >
          <LogOut className="h-4 w-4" /> Sign Out
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Token Inspection Panel */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="bg-slate-800 p-4 border-b border-slate-700 flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-emerald-400" />
            <h2 className="text-white font-semibold">Your Active JWT</h2>
          </div>
          <div className="p-5 flex-1 bg-slate-900 overflow-x-auto text-sm font-mono leading-relaxed break-all whitespace-pre-wrap">
            <span className="text-red-400">{header}</span>
            <span className="text-white">.</span>
            <span className="text-purple-400">{payload}</span>
            <span className="text-white">.</span>
            <span className="text-blue-400">{signature}</span>
          </div>
          <div className="bg-slate-50 p-4 border-t border-gray-200 text-xs text-gray-600">
            <p><strong>Note:</strong> A JWT consists of three parts separated by dots: <span className="text-red-500 font-medium">Header</span>, <span className="text-purple-500 font-medium">Payload</span>, and <span className="text-blue-500 font-medium">Signature</span>.</p>
          </div>
        </div>

        {/* Protected Resource Panel */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
             <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-indigo-600" />
              <h2 className="font-semibold text-gray-800">Protected API Route</h2>
             </div>
          </div>
          
          <div className="p-6">
            <p className="text-sm text-gray-600 mb-6">
              Click below to simulate sending a GET request to a protected API endpoint. The request attaches your JWT in the <code className="bg-gray-100 px-1 py-0.5 rounded text-indigo-600">Authorization</code> header.
            </p>
            
            <button
              onClick={fetchData}
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-all disabled:opacity-70 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 mb-6"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Fetch Secure Data'}
            </button>

            {error && (
               <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm flex items-start gap-2">
                 <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                 {error}
               </div>
            )}

            {data && (
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <div className="flex items-center gap-2 mb-3 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                  <CheckCircle2 className="h-4 w-4" /> 200 OK — Auth Success
                </div>
                <pre className="text-green-300 text-xs font-mono overflow-auto">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

// -------------------------------------------------------------------
// 4. MAIN APP CONTAINER
// -------------------------------------------------------------------
export default function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Check for stored token on initial load
  useEffect(() => {
    const checkSession = async () => {
      // Simulate slight load time for realism
      await delay(500);
      const storedToken = localStorage.getItem('jwt_auth_token');
      
      if (storedToken) {
        const decoded = decodeJWT(storedToken);
        
        // Check if token is structurally valid and not expired
        if (decoded && decoded.exp * 1000 > Date.now()) {
          setToken(storedToken);
          setUser(decoded);
        } else {
          // Token is invalid or expired, clear it
          localStorage.removeItem('jwt_auth_token');
        }
      }
      setIsInitializing(false);
    };
    
    checkSession();
  }, []);

  const handleLogin = useCallback((newToken) => {
    localStorage.setItem('jwt_auth_token', newToken);
    setToken(newToken);
    
    // Decode the token locally to populate user state (Stateless architecture advantage)
    const decoded = decodeJWT(newToken);
    setUser(decoded);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('jwt_auth_token');
    setToken(null);
    setUser(null);
  }, []);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-indigo-600">
          <Loader2 className="h-10 w-10 animate-spin" />
          <p className="font-medium animate-pulse">Verifying Security Session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      {token && user ? (
        <Dashboard token={token} user={user} onLogout={handleLogout} />
      ) : (
        <LoginForm onLogin={handleLogin} />
      )}
    </div>
  );
}