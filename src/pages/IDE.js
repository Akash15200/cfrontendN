import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsAPI, filesAPI } from '../services/api';
import FileExplorer from '../components/FileExplorer';
import CodeEditor from '../components/CodeEditor';
import LivePreview from '../components/LivePreview';
import Header from '../components/Header';
import { toast } from 'react-toastify';

const IDE = ({ user, onLogout }) => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [files, setFiles] = useState({});
  const [activeFile, setActiveFile] = useState('/App.js');
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // Wrap loadProject in useCallback to fix useEffect dependency warning
  const loadProject = useCallback(async () => {
    try {
      const response = await projectsAPI.getById(projectId);
      const projectData = response.data;
      setProject(projectData);

      // Convert project files to our format
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
            fileId: file._id, // Store the file ID for updates
            parent: file.parentId || '/',
            language: file.language || 'javascript'
          };
        });
        setFiles(filesObj);
        
        // Set active file to the first file if App.js doesn't exist
        if (!filesObj['/App.js'] && projectData.files.length > 0) {
          const firstFile = projectData.files.find(f => f.type === 'file');
          if (firstFile) {
            setActiveFile(firstFile.path);
          }
        }
      }
      
      setLastSaved(new Date());
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

  // Auto-save functionality
  useEffect(() => {
    let autoSaveTimeout;
    
    const autoSave = async () => {
      if (Object.keys(files).length > 0 && !saving && projectId) {
        setSaving(true);
        try {
          await saveAllFiles();
        } catch (error) {
          console.error('Auto-save failed:', error);
        } finally {
          setSaving(false);
        }
      }
    };

    // Set a longer timeout to prevent excessive saving
    autoSaveTimeout = setTimeout(autoSave, 10000); // 10 seconds

    return () => {
      clearTimeout(autoSaveTimeout);
    };
  }, [files, projectId, saving]);

  // Save all files - FIXED VERSION
  const saveAllFiles = async () => {
    if (saving || !projectId) return false;
    
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
      setLastSaved(new Date());
      return true;
    } catch (error) {
      console.error('Error saving files:', error);
      toast.error('Failed to save files');
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Save a single file
  const saveFile = async (filePath, content) => {
    try {
      const file = files[filePath];
      if (!file || !file.fileId) return false;

      await filesAPI.update(file.fileId, {
        content: content,
        name: file.name
      });
      
      setLastSaved(new Date());
      return true;
    } catch (error) {
      console.error('Error saving file:', error);
      toast.error(`Failed to save ${filePath}`);
      return false;
    }
  };

  // Save all files
  // const saveAllFiles = async () => {
  //   if (saving || !projectId) return;
    
  //   setSaving(true);
  //   try {
  //     const savePromises = Object.keys(files).map(async (filePath) => {
  //       const file = files[filePath];
  //       if (file.type === 'file' && file.fileId) {
  //         return await filesAPI.update(file.fileId, {
  //           content: file.code,
  //           name: file.name
  //         });
  //       }
  //       return Promise.resolve();
  //     });

  //     await Promise.all(savePromises);
  //     setLastSaved(new Date());
  //     return true;
  //   } catch (error) {
  //     console.error('Error saving files:', error);
  //     toast.error('Failed to save files');
  //     return false;
  //   } finally {
  //     setSaving(false);
  //   }
  // };

  // Manual save trigger
  const handleSaveProject = async () => {
    const success = await saveAllFiles();
    if (success) {
      toast.success('All files saved successfully!');
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

  // Create new file
  const handleCreateFile = async (fileData) => {
    try {
      const response = await filesAPI.create({
        ...fileData,
        projectId: projectId
      });

      const newFile = response.data;
      
      // Update local state
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
          parent: newFile.parentId || '/',
          language: newFile.language || 'javascript'
        }
      }));

      // Update project files list
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

  // Delete file
  const handleDeleteFile = async (filePath) => {
    try {
      const file = files[filePath];
      if (!file || !file.fileId) return;

      await filesAPI.delete(file.fileId);
      
      // Update local state
      setFiles(prevFiles => {
        const newFiles = { ...prevFiles };
        delete newFiles[filePath];
        return newFiles;
      });

      // Update active file if needed
      if (activeFile === filePath) {
        const remainingFiles = Object.keys(files).filter(path => 
          path !== filePath && files[path].type === 'file'
        );
        if (remainingFiles.length > 0) {
          setActiveFile(remainingFiles[0]);
        } else {
          setActiveFile('/App.js');
        }
      }

      toast.success(`File ${file.name} deleted successfully!`);
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    }
  };

  // Rename file
  const handleRenameFile = async (oldPath, newPath, newName) => {
    try {
      const file = files[oldPath];
      if (!file || !file.fileId) return;

      await filesAPI.update(file.fileId, {
        name: newName,
        path: newPath
      });

      // Update local state
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

      // Update active file if needed
      if (activeFile === oldPath) {
        setActiveFile(newPath);
      }

      toast.success(`File renamed to ${newName}`);
    } catch (error) {
      console.error('Error renaming file:', error);
      toast.error('Failed to rename file');
    }
  };

  const handleBackToDashboard = () => {
    // Save before leaving
    saveAllFiles().finally(() => {
      navigate('/dashboard');
    });
  };

  // Format last saved time
  const formatLastSaved = () => {
    if (!lastSaved) return 'Never';
    const now = new Date();
    const diff = now - lastSaved;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    return lastSaved.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading project...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen text-white bg-gray-900">
      <Header 
        onBack={handleBackToDashboard} 
        projectName={project?.name}
        onSave={handleSaveProject}
        isSaving={saving}
        user={user}
        onLogout={onLogout}
        lastSaved={formatLastSaved()}
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
          projectName={project?.name}
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
      
      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 text-xs bg-gray-800 border-t border-gray-700 text-gray-400">
        <div className="flex items-center space-x-4">
          <span>Project: {project?.name}</span>
          <span>Files: {Object.keys(files).filter(path => files[path].type === 'file').length}</span>
          <span>Active: {activeFile.split('/').pop()}</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>Last saved: {formatLastSaved()}</span>
          <span>{saving ? 'Saving...' : 'All changes saved'}</span>
          <span>CipherStudio IDE v1.0</span>
        </div>
      </div>
    </div>
  );
};

export default IDE;