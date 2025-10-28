import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsAPI, filesAPI } from '../services/api';
import FileExplorer from '../components/FileExplorer';
import CodeEditor from '../components/CodeEditor';
import LivePreview from '../components/LivePreview';
import Header from '../components/Header';
import { toast } from 'react-toastify';

const AloneIDE = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [files, setFiles] = useState({});
  const [activeFile, setActiveFile] = useState('/App.js');
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isStandalone, setIsStandalone] = useState(!projectId);

  // Load project if projectId exists (regular IDE mode)
  const loadProject = useCallback(async () => {
    if (!projectId) {
      // Standalone mode - use default files
      setFiles({
        '/index.html': {
          code: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My CipherStudio App</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div id="app">
        <h1>Welcome to CipherStudio IDE! 🚀</h1>
        <p>Edit this code and click "Run Code" to see changes.</p>
        <div id="output"></div>
        <button onclick="showMessage()">Click Me!</button>
    </div>
    <script src="script.js"></script>
</body>
</html>`,
          hidden: false,
          active: false,
          type: 'file',
          name: 'index.html',
          path: '/index.html'
        },
        '/styles.css': {
          code: `body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    text-align: center;
}

#app {
    max-width: 800px;
    margin: 0 auto;
    padding: 40px 20px;
}

h1 {
    font-size: 2.5em;
    margin-bottom: 20px;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

p {
    font-size: 1.2em;
    margin-bottom: 30px;
    opacity: 0.9;
}

button {
    background: #ff6b6b;
    color: white;
    border: none;
    padding: 12px 24px;
    font-size: 1.1em;
    border-radius: 25px;
    cursor: pointer;
    transition: all 0.3s ease;
}

button:hover {
    background: #ff5252;
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
}

#output {
    margin: 20px 0;
    padding: 20px;
    background: rgba(255,255,255,0.1);
    border-radius: 10px;
    min-height: 50px;
}`,
          hidden: false,
          active: false,
          type: 'file',
          name: 'styles.css',
          path: '/styles.css'
        },
        '/script.js': {
          code: `function showMessage() {
    const output = document.getElementById('output');
    const messages = [
        "🎉 Amazing! You're using CipherStudio IDE!",
        "💡 Try editing the code and see live changes!",
        "🚀 Build something awesome today!",
        "✨ The power of coding is in your hands!",
        "🌟 Welcome to the future of learning!"
    ];
    
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    output.innerHTML = \`<div style="
        padding: 15px;
        background: rgba(255,255,255,0.2);
        border-radius: 8px;
        margin: 10px 0;
        animation: fadeIn 0.5s ease-in;
    ">\${randomMessage}</div>\`;
    
    // Add some dynamic styling
    output.style.background = 'rgba(255,255,255,0.1)';
    output.style.border = '2px solid rgba(255,255,255,0.3)';
}

// Add some interactive features
document.addEventListener('DOMContentLoaded', function() {
    console.log('CipherStudio IDE is ready! 🎯');
    
    // Create a simple counter
    let count = 0;
    const app = document.getElementById('app');
    
    const counterBtn = document.createElement('button');
    counterBtn.textContent = \`Count: \${count}\`;
    counterBtn.style.marginLeft = '10px';
    counterBtn.style.background = '#4ecdc4';
    
    counterBtn.onclick = function() {
        count++;
        counterBtn.textContent = \`Count: \${count}\`;
    };
    
    app.appendChild(counterBtn);
});

// Add CSS animation
const style = document.createElement('style');
style.textContent = \`
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }
\`;
document.head.appendChild(style);`,
          hidden: false,
          active: false,
          type: 'file',
          name: 'script.js',
          path: '/script.js'
        }
      });
      setActiveFile('/index.html');
      setLoading(false);
      return;
    }

    // Regular IDE mode - load project from API
    try {
      const response = await projectsAPI.getById(projectId);
      const projectData = response.data;
      setProject(projectData);

      if (projectData.files && projectData.files.length > 0) {
        const filesObj = {};
        projectData.files.forEach(file => {
          filesObj[file.path] = {
            code: file.content,
            hidden: false,
            active: file.path === '/App.js',
            type: file.type,
            name: file.name,
            path: file.path,
            fileId: file._id,
            parent: file.parentId || '/'
          };
        });
        setFiles(filesObj);
        
        if (!filesObj['/App.js'] && projectData.files.length > 0) {
          setActiveFile(projectData.files[0].path);
        }
      }
    } catch (error) {
      console.error('Error loading project:', error);
      toast.error('Failed to load project');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [projectId, navigate]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  // Auto-save for regular IDE mode
  useEffect(() => {
    if (projectId && Object.keys(files).length > 0 && !saving) {
      const autoSave = setTimeout(async () => {
        await saveAllFiles();
      }, 3000);

      return () => clearTimeout(autoSave);
    }
  }, [files, projectId, saving]);

  // Save a single file (regular IDE mode only)
  const saveFile = async (filePath, content) => {
    if (!projectId) return true; // No saving in standalone mode

    try {
      const file = files[filePath];
      if (!file || !file.fileId) return false;

      await filesAPI.update(file.fileId, {
        content: content,
        name: file.name
      });
      
      return true;
    } catch (error) {
      console.error('Error saving file:', error);
      toast.error(`Failed to save ${filePath}`);
      return false;
    }
  };

  // Save all files (regular IDE mode only)
  const saveAllFiles = async () => {
    if (!projectId || saving) return;
    
    setSaving(true);
    try {
      const savePromises = Object.keys(files).map(async (filePath) => {
        const file = files[filePath];
        if (file.type === 'file' && file.fileId) {
          return await filesAPI.update(file.fileId, {
            content: file.code,
            name: file.name
          });
        }
        return Promise.resolve();
      });

      await Promise.all(savePromises);
      toast.success('All files saved successfully!');
    } catch (error) {
      console.error('Error saving files:', error);
      toast.error('Failed to save files');
    } finally {
      setSaving(false);
    }
  };

  // Manual save trigger
  const handleSaveProject = async () => {
    if (projectId) {
      await saveAllFiles();
    } else {
      toast.info('Standalone mode - files are saved locally in this session');
    }
  };

  // Update file content when edited
  const updateFileContent = (filePath, newContent) => {
    setFiles(prevFiles => ({
      ...prevFiles,
      [filePath]: {
        ...prevFiles[filePath],
        code: newContent
      }
    }));
  };

  // File operations (regular IDE mode only)
  const handleCreateFile = async (fileData) => {
    if (!projectId) {
      // Standalone mode - local creation
      const fullPath = fileData.path;
      setFiles(prevFiles => ({
        ...prevFiles,
        [fullPath]: {
          code: fileData.content || '',
          hidden: false,
          active: false,
          type: fileData.type,
          name: fileData.name,
          path: fullPath
        }
      }));
      return fullPath;
    }

    // Regular IDE mode - API creation
    try {
      const response = await filesAPI.create({
        ...fileData,
        projectId: projectId
      });

      const newFile = response.data;
      
      setFiles(prevFiles => ({
        ...prevFiles,
        [newFile.path]: {
          code: newFile.content,
          hidden: false,
          active: false,
          type: newFile.type,
          name: newFile.name,
          path: newFile.path,
          fileId: newFile._id,
          parent: newFile.parentId || '/'
        }
      }));

      setProject(prevProject => ({
        ...prevProject,
        files: [...prevProject.files, newFile._id]
      }));

      toast.success(`File ${newFile.name} created successfully!`);
      return newFile.path;
    } catch (error) {
      console.error('Error creating file:', error);
      toast.error('Failed to create file');
      return null;
    }
  };

  const handleDeleteFile = async (filePath) => {
    const file = files[filePath];
    
    if (projectId && file.fileId) {
      // Regular IDE mode - API deletion
      try {
        await filesAPI.delete(file.fileId);
      } catch (error) {
        console.error('Error deleting file:', error);
        toast.error('Failed to delete file');
        return;
      }
    }

    // Update local state for both modes
    setFiles(prevFiles => {
      const newFiles = { ...prevFiles };
      delete newFiles[filePath];
      return newFiles;
    });

    if (activeFile === filePath) {
      const remainingFiles = Object.keys(files).filter(path => 
        path !== filePath && files[path].type === 'file'
      );
      if (remainingFiles.length > 0) {
        setActiveFile(remainingFiles[0]);
      }
    }

    toast.success(`File ${file.name} deleted successfully!`);
  };

  const handleRenameFile = async (oldPath, newPath, newName) => {
    const file = files[oldPath];
    
    if (projectId && file.fileId) {
      // Regular IDE mode - API rename
      try {
        await filesAPI.update(file.fileId, {
          name: newName,
          path: newPath
        });
      } catch (error) {
        console.error('Error renaming file:', error);
        toast.error('Failed to rename file');
        return;
      }
    }

    // Update local state for both modes
    setFiles(prevFiles => {
      const newFiles = { ...prevFiles };
      newFiles[newPath] = {
        ...newFiles[oldPath],
        name: newName,
        path: newPath
      };
      delete newFiles[oldPath];
      return newFiles;
    });

    if (activeFile === oldPath) {
      setActiveFile(newPath);
    }

    toast.success(`File renamed to ${newName}`);
  };

  const handleBackToDashboard = () => {
    if (projectId) {
      saveAllFiles().finally(() => {
        navigate('/dashboard');
      });
    } else {
      navigate('/dashboard');
    }
  };

  const getProjectName = () => {
    if (isStandalone) return "Standalone IDE";
    return project?.name || "CipherStudio Project";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-xl text-white">Loading IDE...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen text-white bg-gray-900">
      <Header 
        onBack={handleBackToDashboard} 
        projectName={getProjectName()}
        onSave={handleSaveProject}
        isSaving={saving}
      />
      <div className="flex flex-1 overflow-hidden">
        <FileExplorer 
          files={files} 
          setFiles={setFiles}
          activeFile={activeFile}
          setActiveFile={setActiveFile}
          projectId={projectId}
          onCreateFile={handleCreateFile}
          onDeleteFile={handleDeleteFile}
          onRenameFile={handleRenameFile}
          projectName={getProjectName()}
        />
        <CodeEditor 
          files={files}
          activeFile={activeFile}
          projectId={projectId}
          onFileChange={updateFileContent}
          onSaveFile={saveFile}
        />
        <LivePreview files={files} />
      </div>
      
      {/* Saving Indicator */}
      {saving && (
        <div className="fixed bottom-4 right-4 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg">
          Saving...
        </div>
      )}
    </div>
  );
};

export default AloneIDE;