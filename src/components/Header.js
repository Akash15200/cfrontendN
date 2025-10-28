import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaSave,
  FaFolderOpen,
  FaSun,
  FaMoon,
  FaCode,
  FaArrowLeft,
  FaUser,
  FaSignOutAlt,
  FaRocket,
  FaDownload,
  FaUpload,
  FaCog,
  FaBell,
  FaHome,
  FaProjectDiagram,
  FaExclamationCircle
} from "react-icons/fa";

const Header = ({
  onBack,
  projectName,
  showAuthButtons = false,
  onSave,
  isSaving = false,
  user,
  onLogout,
  lastSaved,
  showExport = false,
  onExport,
  onImport,
  theme = "dark",
  onThemeToggle,
  hasUnsavedChanges = false,
  onRunCode,
  isRunning = false
}) => {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const navigate = useNavigate();

  // Apply theme to document
  useEffect(() => {
    document.documentElement.className = theme;
    document.documentElement.style.backgroundColor = theme === "dark" ? "#1f2937" : "#ffffff";
  }, [theme]);

  // Online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-save notification
  useEffect(() => {
    if (lastSaved) {
      addNotification(
        "info",
        `Project auto-saved at ${new Date(lastSaved).toLocaleTimeString()}`
      );
    }
  }, [lastSaved]);

  // Save Project Function
  const saveProject = () => {
    try {
      const projectData = {
        files: {},
        lastSaved: new Date().toISOString(),
        name: projectName || "My Cyber Studio Project",
        version: "1.0.0"
      };
      
      localStorage.setItem("cyberstudio-project", JSON.stringify(projectData));
      addNotification(
        "success",
        `Project "${projectName || 'Untitled'}" saved successfully at ${new Date().toLocaleTimeString()}`
      );
      
      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error('Save failed:', error);
      addNotification("error", "Failed to save project: " + error.message);
    }
  };

  // Load Project Function
  const loadProject = () => {
    try {
      const saved = localStorage.getItem("cyberstudio-project");
      if (saved) {
        const project = JSON.parse(saved);
        const time = new Date(project.lastSaved).toLocaleTimeString();
        addNotification("success", `Project "${project.name}" loaded! Last saved: ${time}`);
        
        // Trigger reload or callback if provided
        if (onImport) {
          onImport(project);
        }
      } else {
        addNotification("warning", "No saved project found! Create a new project and save it first.");
      }
    } catch (error) {
      console.error('Load failed:', error);
      addNotification("error", "Failed to load project: " + error.message);
    }
  };

  // Notifications System
  const addNotification = (type, message) => {
    const newNotification = {
      id: Date.now() + Math.random(),
      type,
      message,
      timestamp: new Date().toLocaleTimeString(),
      read: false
    };
    
    setNotifications(prev => [newNotification, ...prev.slice(0, 9)]); // Keep last 10
    setShowNotifications(true);
    
    // Auto-hide success/info notifications after 5 seconds
    if (type === "success" || type === "info") {
      setTimeout(() => {
        setShowNotifications(false);
      }, 5000);
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
    setShowNotifications(false);
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Logout Handler
  const handleLogout = () => {
    addNotification("info", "Logging out...");
    
    setTimeout(() => {
      if (onLogout) {
        onLogout();
      } else {
        // Default logout behavior
        localStorage.removeItem("cyberstudio_token");
        localStorage.removeItem("cyberstudio_user");
        navigate("/login");
      }
    }, 1000);
  };

  // Navigation Handlers
  const openStandaloneIDE = () => {
    navigate("/standalone-ide");
    addNotification("info", "Opening standalone IDE...");
  };

  const openDashboard = () => {
    navigate("/dashboard");
    addNotification("info", "Opening dashboard...");
  };

  const goHome = () => {
    navigate("/");
    addNotification("info", "Returning to home...");
  };

  // Import/Export Handlers
  const handleImportClick = () => {
    if (onImport) {
      try {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json,.cyberstudio,.zip";
        input.onchange = (e) => {
          if (e.target.files && e.target.files[0]) {
            onImport(e.target.files[0]);
          }
        };
        input.click();
        addNotification("info", "Select a project file to import...");
      } catch (error) {
        addNotification("error", "Import failed: " + error.message);
      }
    } else {
      loadProject(); // Fallback to localStorage load
    }
  };

  const handleExportClick = () => {
    if (onExport) {
      try {
        onExport();
        addNotification("success", "Project exported successfully!");
      } catch (error) {
        addNotification("error", "Export failed: " + error.message);
      }
    } else {
      saveProject(); // Fallback to localStorage save
    }
  };

  // Quick Actions
  const handleQuickRun = () => {
    if (onRunCode) {
      onRunCode();
      addNotification("info", "Running code...");
    } else {
      addNotification("warning", "Run code functionality not available");
    }
  };

  // Theme toggle with persistence
  const handleThemeToggle = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    if (onThemeToggle) {
      onThemeToggle(newTheme);
    }
    // Save theme preference
    localStorage.setItem("cyberstudio-theme", newTheme);
    addNotification("info", `Switched to ${newTheme} theme`);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey)) {
        switch (event.key) {
          case 's':
            event.preventDefault();
            saveProject();
            break;
          case 'o':
            event.preventDefault();
            handleImportClick();
            break;
          case 'e':
            event.preventDefault();
            handleExportClick();
            break;
          case 'r':
            event.preventDefault();
            handleQuickRun();
            break;
          default:
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header
      className={`flex items-center justify-between px-6 py-3 border-b shadow-lg transition-all duration-300 sticky top-0 z-40 ${
        theme === "dark"
          ? "bg-gray-800 border-gray-700 text-white"
          : "bg-white border-gray-200 text-gray-900"
      }`}
    >
      {/* LEFT SECTION */}
      <div className="flex items-center space-x-4 flex-1">
        {/* Back button */}
        {onBack && (
          <button
            onClick={onBack}
            className={`flex items-center space-x-2 transition-colors rounded-lg px-3 py-2 ${
              theme === "dark"
                ? "text-gray-300 hover:text-white hover:bg-gray-700"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <FaArrowLeft />
            <span className="hidden sm:inline">Back</span>
          </button>
        )}

        {/* Home button */}
        <button
          onClick={goHome}
          className={`flex items-center space-x-2 transition-colors rounded-lg px-3 py-2 ${
            theme === "dark"
              ? "text-gray-300 hover:text-white hover:bg-gray-700"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
          title="Go Home"
        >
          <FaHome />
          <span className="hidden sm:inline">Home</span>
        </button>

        {/* Logo */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <div
            className={`p-2 rounded-lg ${
              theme === "dark" ? "bg-blue-600" : "bg-blue-600"
            }`}
          >
            <FaCode
              className={`text-xl ${
                theme === "dark" ? "text-white" : "text-white"
              }`}
            />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold">Cyber Studio</h1>
            <p className="text-xs opacity-75">Browser-Based IDE</p>
          </div>
        </div>

        {/* Project name */}
        {projectName && (
          <div
            className={`px-3 py-1 text-sm rounded-lg border hidden md:block ${
              theme === "dark"
                ? "text-blue-300 bg-blue-900/30 border-blue-700"
                : "text-blue-700 bg-blue-100 border-blue-300"
            }`}
          >
            {projectName}
            {hasUnsavedChanges && (
              <span className="ml-2 text-yellow-400 animate-pulse" title="Unsaved changes">
                ●
              </span>
            )}
          </div>
        )}

        {/* Online status */}
        <div className={`flex items-center space-x-2 text-xs ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
        </div>
      </div>

      {/* CENTER SECTION - Status */}
      <div className="flex items-center space-x-4 flex-shrink-0">
        {/* Save status */}
        <div className="flex items-center space-x-2">
          <div
            className={`text-sm hidden md:block ${
              theme === "dark" ? "text-gray-300" : "text-gray-600"
            }`}
          >
            {isSaving ? "Saving..." : hasUnsavedChanges ? "Unsaved" : "Saved"}
          </div>
          <div
            className={`w-2 h-2 rounded-full animate-pulse ${
              isSaving ? "bg-yellow-500" : hasUnsavedChanges ? "bg-orange-500" : "bg-green-500"
            }`}
            title={isSaving ? "Saving..." : hasUnsavedChanges ? "Unsaved changes" : "All changes saved"}
          ></div>
        </div>

        {/* Last saved time */}
        {lastSaved && (
          <div
            className={`px-2 py-1 text-xs rounded hidden lg:block ${
              theme === "dark"
                ? "text-gray-400 bg-gray-700"
                : "text-gray-600 bg-gray-200"
            }`}
            title={`Last saved: ${new Date(lastSaved).toLocaleString()}`}
          >
            Saved: {new Date(lastSaved).toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* RIGHT SECTION */}
      <div className="flex items-center space-x-3 flex-1 justify-end">
        {/* User Info */}
        {user && (
          <div
            className={`flex items-center space-x-2 text-sm ${
              theme === "dark" ? "text-gray-300" : "text-gray-600"
            }`}
          >
            <FaUser
              className={theme === "dark" ? "text-blue-400" : "text-blue-600"}
            />
            <span className="hidden sm:inline">{user.username || user.email}</span>
          </div>
        )}

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2 rounded-lg transition-colors relative ${
              theme === "dark"
                ? "hover:bg-gray-700 text-gray-300"
                : "hover:bg-gray-100 text-gray-600"
            }`}
            title="Notifications"
          >
            <FaBell />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div
              className={`absolute right-0 top-12 w-80 rounded-lg shadow-xl border z-50 ${
                theme === "dark"
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <div
                className={`p-3 border-b ${
                  theme === "dark" ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Notifications</h3>
                  <div className="flex space-x-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className={`text-xs ${
                          theme === "dark"
                            ? "text-gray-400 hover:text-white"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        Mark all read
                      </button>
                    )}
                    <button
                      onClick={clearNotifications}
                      className={`text-xs ${
                        theme === "dark"
                          ? "text-gray-400 hover:text-white"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div
                    className={`p-4 text-center ${
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    No notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 border-b last:border-b-0 transition-colors ${
                        theme === "dark"
                          ? "border-gray-700"
                          : "border-gray-200"
                      } ${
                        n.read ? 'opacity-70' : ''
                      } ${
                        n.type === "error"
                          ? "bg-red-900/20 border-l-4 border-l-red-500"
                          : n.type === "success"
                          ? "bg-green-900/20 border-l-4 border-l-green-500"
                          : n.type === "warning"
                          ? "bg-yellow-900/20 border-l-4 border-l-yellow-500"
                          : n.type === "info"
                          ? "bg-blue-900/20 border-l-4 border-l-blue-500"
                          : ""
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-start space-x-2">
                            {n.type === "error" && <FaExclamationCircle className="text-red-400 mt-0.5 flex-shrink-0" />}
                            {n.type === "success" && <FaSave className="text-green-400 mt-0.5 flex-shrink-0" />}
                            {n.type === "warning" && <FaExclamationCircle className="text-yellow-400 mt-0.5 flex-shrink-0" />}
                            {n.type === "info" && <FaBell className="text-blue-400 mt-0.5 flex-shrink-0" />}
                            <p className="text-sm flex-1">{n.message}</p>
                          </div>
                          <span
                            className={`text-xs block mt-1 ${
                              theme === "dark"
                                ? "text-gray-400"
                                : "text-gray-500"
                            }`}
                          >
                            {n.timestamp}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Run Button */}
        {onRunCode && (
          <button
            onClick={handleQuickRun}
            disabled={isRunning}
            className={`flex items-center px-3 py-2 space-x-2 text-sm font-medium rounded-lg ${
              isRunning
                ? "bg-yellow-600 cursor-not-allowed"
                : theme === "dark"
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-green-600 hover:bg-green-700 text-white"
            } transform hover:scale-105 transition-transform`}
            title="Run Code (Ctrl+R)"
          >
            {isRunning ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <FaRocket className="text-xs" />
            )}
            <span className="hidden sm:inline">{isRunning ? "Running..." : "Run"}</span>
          </button>
        )}

        {/* Export / Import */}
        {showExport && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportClick}
              className={`flex items-center px-3 py-2 space-x-2 text-sm font-medium rounded-lg ${
                theme === "dark"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-green-600 hover:bg-green-700 text-white"
              } transform hover:scale-105 transition-transform`}
              title="Export Project (Ctrl+E)"
            >
              <FaDownload className="text-xs" />
              <span className="hidden sm:inline">Export</span>
            </button>

            <button
              onClick={handleImportClick}
              className={`flex items-center px-3 py-2 space-x-2 text-sm font-medium rounded-lg ${
                theme === "dark"
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              } transform hover:scale-105 transition-transform`}
              title="Import Project (Ctrl+O)"
            >
              <FaUpload className="text-xs" />
              <span className="hidden sm:inline">Import</span>
            </button>
          </div>
        )}

        {/* Save Button */}
        {onSave && (
          <button
            onClick={saveProject}
            disabled={isSaving}
            className={`flex items-center px-4 py-2 space-x-2 text-sm font-medium rounded-lg ${
              isSaving
                ? "bg-gray-500 cursor-not-allowed"
                : theme === "dark"
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            } transform hover:scale-105 transition-transform`}
            title="Save Project (Ctrl+S)"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="hidden sm:inline">Saving...</span>
              </>
            ) : (
              <>
                <FaSave />
                <span className="hidden sm:inline">Save</span>
              </>
            )}
          </button>
        )}

        {/* Quick IDE */}
        {user && (
          <button
            onClick={openStandaloneIDE}
            className="flex items-center px-3 py-2 space-x-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transform hover:scale-105 transition-transform"
            title="Open Standalone IDE"
          >
            <FaRocket />
            <span className="hidden sm:inline">Quick IDE</span>
          </button>
        )}

        {/* Dashboard */}
        {user && (
          <button
            onClick={openDashboard}
            className={`flex items-center px-3 py-2 space-x-2 text-sm font-medium rounded-lg ${
              theme === "dark"
                ? "bg-gray-600 hover:bg-gray-700 text-white"
                : "bg-gray-200 hover:bg-gray-300 text-gray-700"
            } transform hover:scale-105 transition-transform`}
            title="Open Dashboard"
          >
            <FaProjectDiagram />
            <span className="hidden sm:inline">Dashboard</span>
          </button>
        )}

        {/* Demo Save/Load - shown when no user */}
        {showAuthButtons && !user && (
          <div className="flex items-center space-x-2">
            <button
              onClick={saveProject}
              className="flex items-center px-3 py-2 space-x-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transform hover:scale-105 transition-transform"
            >
              <FaSave />
              <span className="hidden sm:inline">Save</span>
            </button>
            <button
              onClick={loadProject}
              className="flex items-center px-3 py-2 space-x-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transform hover:scale-105 transition-transform"
            >
              <FaFolderOpen />
              <span className="hidden sm:inline">Load</span>
            </button>
          </div>
        )}

        {/* Settings */}
        <button
          className={`flex items-center p-2 rounded-lg ${
            theme === "dark"
              ? "bg-gray-600 text-white hover:bg-gray-700"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          } transform hover:scale-105 transition-transform`}
          title="Settings"
        >
          <FaCog />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={handleThemeToggle}
          className={`flex items-center p-2 rounded-lg ${
            theme === "dark"
              ? "bg-gray-600 text-white hover:bg-gray-700"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          } transform hover:scale-105 transition-transform`}
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === "dark" ? <FaSun /> : <FaMoon />}
        </button>

        {/* Logout */}
        {user && (
          <button
            onClick={handleLogout}
            className="flex items-center px-3 py-2 space-x-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transform hover:scale-105 transition-transform"
            title="Logout"
          >
            <FaSignOutAlt />
            <span className="hidden sm:inline">Logout</span>
          </button>
        )}
      </div>
    </header>
  );
};

// Default props for better error handling
Header.defaultProps = {
  theme: "dark",
  showAuthButtons: false,
  showExport: false,
  isSaving: false,
  isRunning: false,
  hasUnsavedChanges: false,
  user: null,
  lastSaved: null,
  projectName: "Untitled Project"
};

export default Header;