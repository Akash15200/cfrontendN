// Dashboard.js - Enhanced with better project management
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsAPI } from '../services/api';
import { FaPlus, FaCode, FaSignOutAlt, FaFolder, FaTrash, FaPlay, FaRocket, FaUser, FaClock, FaSearch, FaSun, FaMoon, FaDownload, FaUpload } from 'react-icons/fa';
import { toast } from 'react-toastify';

const Dashboard = ({ user, onLogout, theme, onThemeToggle }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ totalProjects: 0, recentProjects: [] });
  const [importing, setImporting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
    loadStats();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await projectsAPI.getAll();
      setProjects(response.data);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await projectsAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) {
      toast.error('Please enter a project name');
      return;
    }

    try {
      const response = await projectsAPI.create({
        name: newProjectName,
        description: 'A new React project',
        framework: 'react',
        files: [
          {
            name: 'App.js',
            path: '/App.js',
            type: 'file',
            content: `import React, { useState } from 'react';
import './App.css';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="App">
      <h1>Welcome to ${newProjectName}! 🚀</h1>
      <p>Start editing to see some magic happen!</p>
      
      <div className="counter">
        <button onClick={() => setCount(count - 1)}>-</button>
        <span>Count: {count}</span>
        <button onClick={() => setCount(count + 1)}>+</button>
      </div>
      
      <button 
        onClick={() => alert('Hello from CipherStudio!')}
        style={{
          padding: '12px 24px',
          backgroundColor: '#007acc',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          marginTop: '20px',
          fontSize: '16px'
        }}
      >
        Click Me
      </button>
    </div>
  );
}

export default App;`
          },
          {
            name: 'App.css',
            path: '/App.css',
            type: 'file',
            content: `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

.App {
  text-align: center;
  padding: 40px 20px;
  color: white;
}

h1 {
  font-size: 2.5em;
  margin-bottom: 20px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

p {
  font-size: 1.2em;
  opacity: 0.9;
  margin-bottom: 30px;
}

.counter {
  margin: 30px 0;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
}

.counter button {
  padding: 10px 20px;
  font-size: 1.2em;
  background: #ff6b6b;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.counter button:hover {
  background: #ff5252;
  transform: scale(1.05);
}

.counter span {
  font-size: 1.5em;
  font-weight: bold;
  min-width: 100px;
}`
          },
          {
            name: 'index.html',
            path: '/index.html',
            type: 'file',
            content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${newProjectName}</title>
</head>
<body>
    <div id="root"></div>
</body>
</html>`
          },
          {
            name: 'src',
            path: '/src',
            type: 'folder',
            content: ''
          },
          {
            name: 'public',
            path: '/public',
            type: 'folder',
            content: ''
          }
        ]
      });

      const newProject = response.data;
      setProjects([newProject, ...projects]);
      setNewProjectName('');
      setShowCreateModal(false);
      
      toast.success(`Project "${newProjectName}" created successfully!`);
      
      // Navigate to the new project
      navigate(`/ide/${newProject._id}`);
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    }
  };

  const handleDeleteProject = async (projectId, projectName) => {
    if (!window.confirm(`Are you sure you want to delete "${projectName}"? This action cannot be undone.`)) return;

    try {
      await projectsAPI.delete(projectId);
      setProjects(projects.filter(p => p._id !== projectId));
      toast.success(`Project "${projectName}" deleted successfully`);
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const openProject = (projectId) => {
    navigate(`/ide/${projectId}`);
  };

  const openStandaloneIDE = () => {
    navigate('/standalone-ide');
  };

  const exportProject = async (projectId) => {
    try {
      const project = projects.find(p => p._id === projectId);
      if (!project) return;

      const projectData = {
        name: project.name,
        description: project.description,
        files: project.files,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };

      const dataStr = JSON.stringify(projectData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${project.name.replace(/\s+/g, '-')}.cipherstudio.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(`Project "${project.name}" exported successfully!`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export project');
    }
  };

  const importProject = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const projectData = JSON.parse(e.target.result);
        
        // Validate project file
        if (!projectData.name || !projectData.files) {
          throw new Error('Invalid project file format');
        }

        const response = await projectsAPI.create({
          name: `${projectData.name} (Imported)`,
          description: projectData.description || 'Imported project',
          files: projectData.files
        });

        setProjects([response.data, ...projects]);
        toast.success(`Project "${projectData.name}" imported successfully!`);
        
        // Navigate to imported project
        navigate(`/ide/${response.data._id}`);
      } catch (error) {
        console.error('Import error:', error);
        toast.error('Failed to import project');
      } finally {
        setImporting(false);
        event.target.value = ''; // Reset file input
      }
    };
    
    reader.readAsText(file);
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading your projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Header */}
      <header className={`border-b transition-colors duration-300 ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } shadow-lg`}>
        <div className="container px-6 py-4 mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${
                theme === 'dark' ? 'bg-blue-600' : 'bg-blue-600'
              }`}>
                <FaCode className="text-2xl text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">CipherStudio</h1>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>Your Browser-Based React IDE</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={onThemeToggle}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? <FaSun /> : <FaMoon />}
              </button>
              <div className={`flex items-center space-x-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <FaUser className={theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} />
                <span>Welcome, {user?.username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 space-x-2 transition-colors bg-red-600 rounded-lg hover:bg-red-700 transform hover:scale-105 text-white"
              >
                <FaSignOutAlt />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container px-6 py-8 mx-auto">
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className={`p-6 rounded-lg border transition-colors duration-300 ${
            theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>Total Projects</p>
                <p className="text-3xl font-bold">{stats.totalProjects}</p>
              </div>
              <FaFolder className={`text-3xl ${
                theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
              }`} />
            </div>
          </div>
          
          <div className={`p-6 rounded-lg border transition-colors duration-300 ${
            theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>Active Projects</p>
                <p className="text-3xl font-bold">{projects.length}</p>
              </div>
              <FaCode className={`text-3xl ${
                theme === 'dark' ? 'text-green-400' : 'text-green-600'
              }`} />
            </div>
          </div>
          
          <div className={`p-6 rounded-lg border transition-colors duration-300 ${
            theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>Last Active</p>
                <p className="text-lg font-bold">
                  {projects[0] ? formatDate(projects[0].updatedAt) : 'Never'}
                </p>
              </div>
              <FaClock className={`text-3xl ${
                theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
              }`} />
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 space-y-4 md:space-y-0">
          <div>
            <h2 className="text-3xl font-bold">Your Projects</h2>
            <p className={`mt-1 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>Manage and organize your React projects</p>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full md:w-auto">
            <div className="relative">
              <FaSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`} />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>
            
            <label className={`flex items-center justify-center px-6 py-2 space-x-2 transition-colors rounded-lg cursor-pointer ${
              theme === 'dark' 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            } transform hover:scale-105`}>
              <FaUpload className="text-sm" />
              <span>{importing ? 'Importing...' : 'Import'}</span>
              <input
                type="file"
                accept=".json,.cipherstudio"
                onChange={importProject}
                className="hidden"
                disabled={importing}
              />
            </label>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center justify-center px-6 py-2 space-x-2 transition-colors bg-green-600 rounded-lg hover:bg-green-700 transform hover:scale-105 text-white whitespace-nowrap"
            >
              <FaPlus />
              <span>New Project</span>
            </button>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Standalone IDE Card */}
          <div className={`p-6 transition-all rounded-lg border transform hover:scale-105 ${
            theme === 'dark'
              ? 'bg-gradient-to-br from-purple-800 to-purple-600 border-purple-700 hover:border-purple-500 hover:shadow-2xl hover:shadow-purple-500/25'
              : 'bg-gradient-to-br from-purple-600 to-purple-400 border-purple-500 hover:border-purple-400 hover:shadow-2xl hover:shadow-purple-500/25 text-white'
          }`}>
            <div className="flex items-start justify-between mb-4">
              <FaRocket className="text-2xl text-purple-300" />
              <div className="px-2 py-1 text-xs font-semibold text-purple-100 bg-purple-700 rounded-full">
                NEW
              </div>
            </div>
            <h3 className="mb-2 text-xl font-semibold">Standalone IDE</h3>
            <p className="mb-4 text-sm text-purple-200">
              Quick HTML/CSS/JS editor for fast prototyping and testing
            </p>
            <div className="flex items-center justify-between text-sm text-purple-300 mb-4">
              <span>No setup required</span>
              <span>Instant access</span>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={openStandaloneIDE}
                className="flex items-center justify-center flex-1 px-4 py-2 space-x-2 transition-colors bg-white text-purple-700 rounded hover:bg-purple-100 font-semibold transform hover:scale-105"
              >
                <FaRocket />
                <span>Launch IDE</span>
              </button>
            </div>
          </div>

          {/* User Projects */}
          {filteredProjects.length === 0 ? (
            <div className={`col-span-1 md:col-span-2 lg:col-span-3 py-16 text-center rounded-lg border transition-colors ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <FaFolder className={`mx-auto mb-4 text-6xl ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-300'
              }`} />
              <h3 className={`mb-2 text-xl ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>No projects found</h3>
              <p className={`mb-6 ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              }`}>
                {searchTerm ? 'No projects match your search' : 'Create your first project to start coding'}
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 transform hover:scale-105 text-white"
              >
                Create Your First Project
              </button>
            </div>
          ) : (
            filteredProjects.map(project => (
              <div key={project._id} className={`p-6 transition-all rounded-lg border transform hover:scale-105 ${
                theme === 'dark'
                  ? 'bg-gray-800 border-gray-700 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/25'
                  : 'bg-white border-gray-200 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/25'
              }`}>
                <div className="flex items-start justify-between mb-4">
                  <FaFolder className={`text-2xl ${
                    theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                  }`} />
                  <div className="flex space-x-2">
                    <button
                      onClick={() => exportProject(project._id)}
                      className={`p-1 transition-colors rounded ${
                        theme === 'dark' 
                          ? 'text-gray-400 hover:text-green-400 hover:bg-gray-700' 
                          : 'text-gray-500 hover:text-green-600 hover:bg-gray-100'
                      }`}
                      title="Export project"
                    >
                      <FaDownload />
                    </button>
                    <button
                      onClick={() => handleDeleteProject(project._id, project.name)}
                      className={`p-1 transition-colors rounded ${
                        theme === 'dark' 
                          ? 'text-gray-400 hover:text-red-400 hover:bg-gray-700' 
                          : 'text-gray-500 hover:text-red-600 hover:bg-gray-100'
                      } transform hover:scale-110`}
                      title="Delete project"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
                <h3 className="mb-2 text-xl font-semibold truncate">{project.name}</h3>
                <p className={`mb-4 text-sm min-h-[40px] ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {project.description || 'No description'}
                </p>
                <div className={`flex items-center justify-between text-sm mb-4 ${
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  <span className="flex items-center space-x-1">
                    <FaClock className="text-xs" />
                    <span>{formatDate(project.updatedAt)}</span>
                  </span>
                  <span>{project.files?.length || 0} files</span>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => openProject(project._id)}
                    className="flex items-center justify-center flex-1 px-4 py-2 space-x-2 transition-colors bg-green-600 rounded hover:bg-green-700 transform hover:scale-105 text-white"
                  >
                    <FaPlay />
                    <span>Open</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70">
          <div className={`w-full max-w-md p-6 rounded-lg border transform scale-100 animate-fadeIn ${
            theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <h3 className="mb-4 text-xl font-bold">Create New Project</h3>
            <form onSubmit={handleCreateProject}>
              <div className="mb-4">
                <label className={`block mb-2 text-sm font-medium ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Project Name *
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                  placeholder="Enter project name"
                  autoFocus
                  maxLength={100}
                />
                <p className={`mt-1 text-xs ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {newProjectName.length}/100 characters
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className={`px-4 py-2 transition-colors rounded ${
                    theme === 'dark' 
                      ? 'text-gray-300 hover:text-white' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 transition-colors bg-blue-600 rounded hover:bg-blue-700 text-white"
                  disabled={!newProjectName.trim()}
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;