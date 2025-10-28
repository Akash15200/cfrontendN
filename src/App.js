// App.js - Enhanced version
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import IDE from './pages/IDE';
import StandaloneIDE from './pages/StandaloneIDE';
import { authAPI } from './services/api';
import { toast } from 'react-toastify';
import './App.css';

// Enhanced Protected Route with auto-login
const ProtectedRoute = ({ children }) => {
  const [verifying, setVerifying] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('cipherstudio_token');
      if (!token) {
        setVerifying(false);
        return;
      }

      try {
        const response = await authAPI.verify();
        if (response.data.valid) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        localStorage.removeItem('cipherstudio_token');
        localStorage.removeItem('cipherstudio_user');
      } finally {
        setVerifying(false);
      }
    };

    verifyAuth();
  }, []);

  if (verifying) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Public Route (redirect if already logged in)
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('cipherstudio_token');
  return !token ? children : <Navigate to="/dashboard" />;
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('dark');

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      // Load theme
      const savedTheme = localStorage.getItem('cipherstudio_theme') || 'dark';
      setTheme(savedTheme);
      applyTheme(savedTheme);

      // Load user
      const token = localStorage.getItem('cipherstudio_token');
      const savedUser = localStorage.getItem('cipherstudio_user');
      
      if (token && savedUser) {
        try {
          const response = await authAPI.verify();
          if (response.data.valid) {
            setUser(response.data.user);
          } else {
            localStorage.removeItem('cipherstudio_token');
            localStorage.removeItem('cipherstudio_user');
          }
        } catch (error) {
          console.error('Auth verification failed:', error);
          localStorage.removeItem('cipherstudio_token');
          localStorage.removeItem('cipherstudio_user');
        }
      }
      
      setLoading(false);
    };

    initializeApp();
  }, []);

  const applyTheme = (theme) => {
    document.documentElement.className = theme;
    localStorage.setItem('cipherstudio_theme', theme);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  const handleLogin = (userData) => {
    setUser(userData);
    toast.success(`Welcome back, ${userData.username}!`);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('cipherstudio_token');
    localStorage.removeItem('cipherstudio_user');
    toast.success('Logged out successfully');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading CipherStudio...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className={`App ${theme}`}>
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login onLogin={handleLogin} />
              </PublicRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <Register onLogin={handleLogin} />
              </PublicRoute>
            } 
          />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard user={user} onLogout={handleLogout} theme={theme} onThemeToggle={toggleTheme} />
              </ProtectedRoute>
            } 
          />
          
          {/* IDE Routes */}
          <Route 
            path="/ide/:projectId" 
            element={
              <ProtectedRoute>
                <IDE user={user} onLogout={handleLogout} theme={theme} onThemeToggle={toggleTheme} />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/standalone-ide" 
            element={
              <ProtectedRoute>
                <StandaloneIDE theme={theme} onThemeToggle={toggleTheme} />
              </ProtectedRoute>
            } 
          />
          
          {/* Default Route */}
          <Route path="/" element={<Navigate to="/dashboard" />} />
          
          {/* 404 Route */}
          <Route path="*" element={
            <div className="flex items-center justify-center min-h-screen bg-gray-900">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-white mb-4">404</h1>
                <p className="text-gray-400 mb-8">Page not found</p>
                <a href="/dashboard" className="btn-primary">
                  Go to Dashboard
                </a>
              </div>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;