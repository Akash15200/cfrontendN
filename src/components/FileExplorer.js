import React, { useState } from 'react';
import { FaFileCode, FaFolder, FaFolderOpen, FaJs, FaCss3Alt, FaHtml5, FaChevronRight, FaChevronDown, FaCode, FaMarkdown, FaFile, FaFileImage, FaPython, FaDatabase } from 'react-icons/fa';

const FileExplorer = ({ 
  files = {}, 
  setFiles = () => {},
  activeFile = '/App.js',
  setActiveFile = () => {},
  projectName = "CyberStudio Project",
  projectId,
  onCreateFile,
  onDeleteFile,
  onRenameFile
}) => {
  const [expandedFolders, setExpandedFolders] = useState({
    '/': true,
    '/src': true,
    '/public': true,
    '/components': true
  });

  // Improved file icon mapping
  const getFileIcon = (fileName, isFolder = false) => {
    if (isFolder) {
      const folderPath = fileName.startsWith('/') ? fileName : `/${fileName}`;
      return expandedFolders[folderPath] ? <FaFolderOpen className="text-blue-400" /> : <FaFolder className="text-blue-400" />;
    }
    
    const extension = fileName.toLowerCase().split('.').pop();
    
    switch (extension) {
      case 'js':
      case 'jsx':
        return <FaJs className="text-yellow-400" />;
      case 'css':
        return <FaCss3Alt className="text-blue-400" />;
      case 'html':
      case 'htm':
        return <FaHtml5 className="text-orange-400" />;
      case 'json':
        return <FaFileCode className="text-green-400" />;
      case 'md':
      case 'markdown':
        return <FaMarkdown className="text-blue-300" />;
      case 'py':
        return <FaPython className="text-green-500" />;
      case 'sql':
      case 'db':
        return <FaDatabase className="text-gray-400" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg':
        return <FaFileImage className="text-purple-400" />;
      case 'txt':
      case 'text':
        return <FaFile className="text-gray-400" />;
      default:
        return <FaFileCode className="text-gray-400" />;
    }
  };

  const toggleFolder = (folderPath) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderPath]: !prev[folderPath]
    }));
  };

  // Improved file creation with better validation
  const createNewFile = async (parentPath = '') => {
    const fileName = prompt('Enter file name (e.g., Component.js, style.css):');
    if (!fileName) return;

    // Validate file name
    if (!fileName.trim()) {
      alert('Please enter a valid file name');
      return;
    }

    if (!fileName.includes('.')) {
      alert('Please include a file extension (e.g., .js, .css, .html)');
      return;
    }

    // Clean up file name
    const cleanFileName = fileName.trim().replace(/^\/+/, '');
    const fullPath = parentPath && parentPath !== '/' ? 
      `${parentPath}/${cleanFileName}` : `/${cleanFileName}`;
    
    // Check if file already exists
    if (files[fullPath]) {
      alert('A file with this name already exists!');
      return;
    }

    // Default content based on file type
    let defaultContent = '';
    const fileExtension = cleanFileName.toLowerCase().split('.').pop();
    const baseName = cleanFileName.split('.')[0].replace(/[^a-zA-Z0-9]/g, '');

    switch (fileExtension) {
      case 'js':
      case 'jsx':
        const componentName = baseName || 'Component';
        defaultContent = `import React from 'react';

function ${componentName}() {
  return (
    <div>
      <h2>${componentName} Component</h2>
      <p>This is the ${componentName} component.</p>
    </div>
  );
}

export default ${componentName};`;
        break;
      case 'css':
        defaultContent = `/* ${cleanFileName} styles */
.container {
  padding: 20px;
  font-family: Arial, sans-serif;
}

/* Add your styles here */`;
        break;
      case 'html':
        defaultContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${baseName || 'Document'}</title>
</head>
<body>
    <div id="root"></div>
</body>
</html>`;
        break;
      case 'json':
        defaultContent = `{
  "name": "${cleanFileName}",
  "version": "1.0.0",
  "description": ""
}`;
        break;
      case 'md':
        defaultContent = `# ${cleanFileName}\n\nStart writing your markdown here...`;
        break;
      case 'py':
        defaultContent = `# ${cleanFileName}\n\ndef main():\n    print("Hello from ${cleanFileName}")\n\nif __name__ == "__main__":\n    main()`;
        break;
      default:
        defaultContent = `// ${cleanFileName} file\n// Start coding here...`;
    }

    // Use backend API if available, otherwise update local state
    if (onCreateFile && projectId) {
      const newFilePath = await onCreateFile({
        name: cleanFileName,
        path: fullPath,
        type: 'file',
        content: defaultContent,
        parentId: parentPath && parentPath !== '/' ? getFileId(parentPath) : null
      });
      
      if (newFilePath) {
        setActiveFile(newFilePath);
      }
    } else {
      // Local state update (for demo/standalone mode)
      const newFile = {
        code: defaultContent,
        hidden: false,
        active: false,
        type: 'file',
        name: cleanFileName,
        path: fullPath,
        parent: parentPath || '/',
        language: getLanguageFromExtension(fileExtension)
      };

      setFiles(prev => ({
        ...prev,
        [fullPath]: newFile
      }));
      
      setActiveFile(fullPath);
    }
  };

  const createNewFolder = async (parentPath = '') => {
    const folderName = prompt('Enter folder name:');
    if (!folderName || !folderName.trim()) return;

    const cleanFolderName = folderName.trim().replace(/^\/+/, '').replace(/\/+$/, '');
    const fullPath = parentPath && parentPath !== '/' ? 
      `${parentPath}/${cleanFolderName}` : `/${cleanFolderName}`;

    // Check if folder already exists
    if (files[fullPath]) {
      alert('A folder with this name already exists!');
      return;
    }

    // Use backend API if available, otherwise update local state
    if (onCreateFile && projectId) {
      await onCreateFile({
        name: cleanFolderName,
        path: fullPath,
        type: 'folder',
        content: '',
        parentId: parentPath && parentPath !== '/' ? getFileId(parentPath) : null
      });
    } else {
      // Local state update (for demo/standalone mode)
      setFiles(prev => ({
        ...prev,
        [fullPath]: {
          code: '',
          hidden: false,
          active: false,
          type: 'folder',
          name: cleanFolderName,
          path: fullPath,
          parent: parentPath || '/'
        }
      }));
    }
    
    // Auto-expand the new folder
    setExpandedFolders(prev => ({
      ...prev,
      [fullPath]: true
    }));
  };

  const getLanguageFromExtension = (extension) => {
    switch (extension) {
      case 'js': return 'javascript';
      case 'jsx': return 'javascript';
      case 'css': return 'css';
      case 'html': return 'html';
      case 'json': return 'json';
      case 'md': return 'markdown';
      case 'py': return 'python';
      default: return 'text';
    }
  };

  const getFileId = (filePath) => {
    return files[filePath]?.fileId || filePath;
  };

  const renameFile = async (filePath, e) => {
    e.stopPropagation();
    const currentFile = files[filePath];
    if (!currentFile) return;

    const currentFileName = filePath.split('/').pop();
    const newName = prompt('Enter new name:', currentFileName);
    
    if (!newName || newName === currentFileName) return;

    const cleanNewName = newName.trim().replace(/^\/+/, '');
    if (!cleanNewName) return;

    const parentPath = filePath.split('/').slice(0, -1).join('/') || '/';
    const newFilePath = parentPath !== '/' ? `${parentPath}/${cleanNewName}` : `/${cleanNewName}`;
    
    // Check if new path already exists
    if (files[newFilePath]) {
      alert('A file/folder with this name already exists!');
      return;
    }

    // Use backend API if available
    if (onRenameFile && projectId) {
      await onRenameFile(filePath, newFilePath, cleanNewName);
    } else {
      // Local state update (for demo mode)
      setFiles(prev => {
        const newFiles = { ...prev };
        
        if (newFiles[filePath]) {
          // Update the file/folder
          newFiles[newFilePath] = {
            ...newFiles[filePath],
            name: cleanNewName,
            path: newFilePath,
            language: currentFile.type === 'file' ? 
              getLanguageFromExtension(cleanNewName.split('.').pop()) : 
              newFiles[filePath].language
          };
          delete newFiles[filePath];
          
          // Update paths for children if it's a folder
          if (currentFile.type === 'folder') {
            Object.keys(newFiles).forEach(path => {
              if (path.startsWith(filePath + '/')) {
                const newPath = path.replace(filePath, newFilePath);
                newFiles[newPath] = { 
                  ...newFiles[path],
                  path: newPath,
                  parent: newFilePath
                };
                delete newFiles[path];
              }
            });

            // Update expanded folders state
            setExpandedFolders(prev => {
              const newExpanded = { ...prev };
              newExpanded[newFilePath] = newExpanded[filePath];
              delete newExpanded[filePath];
              return newExpanded;
            });
          }
        }
        
        return newFiles;
      });
      
      // Update active file if needed
      if (activeFile === filePath || activeFile.startsWith(filePath + '/')) {
        const newActivePath = activeFile.replace(filePath, newFilePath);
        setActiveFile(newActivePath);
      }
    }
  };

  const deleteFile = async (filePath, e) => {
    e.stopPropagation();
    const fileToDelete = files[filePath];
    if (!fileToDelete) return;
    
    // Don't allow deleting the last file
    const fileCount = Object.values(files).filter(f => f.type === 'file').length;
    if (fileToDelete.type === 'file' && fileCount <= 1) {
      alert('Cannot delete the last file! Please create another file first.');
      return;
    }

    const fileType = fileToDelete.type === 'file' ? 'file' : 'folder';
    if (!window.confirm(`Are you sure you want to delete "${filePath}"? This action cannot be undone.`)) {
      return;
    }

    // Use backend API if available
    if (onDeleteFile && projectId) {
      await onDeleteFile(filePath);
    } else {
      // Local state update (for demo mode)
      setFiles(prev => {
        const newFiles = { ...prev };
        delete newFiles[filePath];
        
        // Delete children if it's a folder
        if (fileToDelete.type === 'folder') {
          Object.keys(newFiles).forEach(path => {
            if (path.startsWith(filePath + '/')) {
              delete newFiles[path];
            }
          });

          // Remove from expanded folders
          setExpandedFolders(prev => {
            const newExpanded = { ...prev };
            delete newExpanded[filePath];
            return newExpanded;
          });
        }
        
        return newFiles;
      });
      
      // Update active file if needed
      if (activeFile === filePath || activeFile.startsWith(filePath + '/')) {
        const remainingFiles = Object.keys(files).filter(path => 
          path !== filePath && 
          !path.startsWith(filePath + '/') && 
          files[path].type === 'file'
        );
        
        if (remainingFiles.length > 0) {
          // Try to find a similar file first
          const preferredFiles = remainingFiles.filter(path => 
            path.includes('.js') || path.includes('.jsx') || path.includes('.html')
          );
          setActiveFile(preferredFiles.length > 0 ? preferredFiles[0] : remainingFiles[0]);
        } else {
          // Create a default file if no files left
          const defaultPath = '/App.js';
          const defaultContent = getDefaultContent('App.js');
          setFiles(prev => ({
            ...prev,
            [defaultPath]: {
              code: defaultContent,
              type: 'file',
              name: 'App.js',
              path: defaultPath,
              parent: '/',
              language: 'javascript'
            }
          }));
          setActiveFile(defaultPath);
        }
      }
    }
  };

  const getDefaultContent = (filename) => {
    if (filename.endsWith('.js') || filename.endsWith('.jsx')) {
      return `import React from 'react';

function App() {
  return (
    <div>
      <h1>Welcome to Cyber Studio!</h1>
      <p>Start coding to see your app come to life.</p>
    </div>
  );
}

export default App;`;
    }
    return '// Start coding here...';
  };

  const startCreatingNewItem = (type, parentPath = '') => {
    if (type === 'file') {
      createNewFile(parentPath);
    } else if (type === 'folder') {
      createNewFolder(parentPath);
    }
  };

  // Improved file tree structure building
  const buildFileTree = () => {
    const root = { 
      name: projectName, 
      path: '/', 
      type: 'folder', 
      children: [],
      isRoot: true
    };
    
    // Sort paths by depth to ensure parent folders are created first
    const sortedPaths = Object.keys(files)
      .filter(path => path !== '/')
      .sort((a, b) => {
        const depthA = a.split('/').length;
        const depthB = b.split('/').length;
        return depthA - depthB;
      });

    sortedPaths.forEach(path => {
      const parts = path.split('/').filter(part => part !== '');
      let currentLevel = root;
      
      parts.forEach((part, index) => {
        const currentPath = '/' + parts.slice(0, index + 1).join('/');
        const isFile = index === parts.length - 1 && files[path]?.type === 'file';
        
        let existingNode = currentLevel.children.find(child => child.path === currentPath);
        
        if (!existingNode) {
          const newNode = {
            name: part,
            path: currentPath,
            type: isFile ? 'file' : 'folder',
            children: [],
            data: files[path]
          };
          currentLevel.children.push(newNode);
          existingNode = newNode;
        }
        
        currentLevel = existingNode;
      });
    });

    // Sort children: folders first, then files, both alphabetically
    const sortChildren = (node) => {
      if (node.children) {
        node.children.sort((a, b) => {
          if (a.type !== b.type) {
            return a.type === 'folder' ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        });
        node.children.forEach(sortChildren);
      }
    };
    
    sortChildren(root);
    return root;
  };

  // Recursive component to render file tree
  const renderFileTree = (node, depth = 0) => {
    const paddingLeft = depth * 16 + 8;
    const isExpanded = expandedFolders[node.path];
    const isRoot = node.isRoot;

    if (node.type === 'file') {
      return (
        <div
          key={node.path}
          className={`flex items-center justify-between group py-1 px-1 rounded cursor-pointer transition-all ${
            activeFile === node.path 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'hover:bg-gray-700 text-gray-300'
          }`}
          style={{ paddingLeft: `${paddingLeft}px` }}
          onClick={() => setActiveFile(node.path)}
          title={node.path}
        >
          <div className="flex items-center flex-1 min-w-0 space-x-2">
            {getFileIcon(node.name, false)}
            <span className="text-sm truncate flex-1">{node.name}</span>
          </div>
          
          <div className="flex items-center space-x-1 transition-opacity opacity-0 group-hover:opacity-100">
            <button
              onClick={(e) => renameFile(node.path, e)}
              className="p-1 text-gray-400 transition-colors hover:text-yellow-400 rounded hover:bg-gray-600 text-xs"
              title="Rename file"
            >
              ✏️
            </button>
            <button
              onClick={(e) => deleteFile(node.path, e)}
              className="p-1 text-gray-400 transition-colors hover:text-red-400 rounded hover:bg-gray-600 text-xs"
              title="Delete file"
            >
              ×
            </button>
          </div>
        </div>
      );
    }

    // It's a folder
    return (
      <div key={node.path}>
        <div
          className={`flex items-center justify-between group py-1 px-1 rounded cursor-pointer transition-all ${
            isRoot ? 'border-b border-gray-600 pb-2 mb-1 font-semibold' : 'hover:bg-gray-700 text-gray-300'
          }`}
          style={{ paddingLeft: `${isRoot ? 8 : paddingLeft}px` }}
          onClick={() => !isRoot && toggleFolder(node.path)}
          title={node.path}
        >
          <div className="flex items-center flex-1 space-x-2">
            {!isRoot && (
              <span className="text-gray-400 transition-transform w-3 flex-shrink-0">
                {isExpanded ? <FaChevronDown size={10} /> : <FaChevronRight size={10} />}
              </span>
            )}
            {isRoot ? (
              <FaCode className="text-blue-400 flex-shrink-0" />
            ) : (
              getFileIcon(node.name, true)
            )}
            <span className={`text-sm truncate flex-1 ${isRoot ? 'text-blue-300' : ''}`}>
              {node.name}
            </span>
          </div>
          
          {!isRoot && (
            <div className="flex items-center space-x-1 transition-opacity opacity-0 group-hover:opacity-100 flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startCreatingNewItem('file', node.path);
                }}
                className="p-1 text-gray-400 transition-colors hover:text-green-400 rounded hover:bg-gray-600 text-xs"
                title="New file in folder"
              >
                📄+
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startCreatingNewItem('folder', node.path);
                }}
                className="p-1 text-gray-400 transition-colors hover:text-blue-400 rounded hover:bg-gray-600 text-xs"
                title="New folder"
              >
                📁+
              </button>
            </div>
          )}
        </div>
        
        {isExpanded && node.children && node.children.length > 0 && (
          <div>
            {node.children.map(child => renderFileTree(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const fileTree = buildFileTree();

  return (
    <div className="flex flex-col w-64 bg-gray-800 border-r border-gray-700 h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <h3 className="text-sm font-semibold text-gray-300">EXPLORER</h3>
        <div className="flex space-x-1">
          <button 
            onClick={() => startCreatingNewItem('folder', '/')}
            className="p-1 text-xs transition-colors rounded hover:bg-gray-700 hover:text-white"
            title="New Folder"
          >
            📁+
          </button>
          <button 
            onClick={() => startCreatingNewItem('file', '/')}
            className="p-1 text-xs transition-colors rounded hover:bg-gray-700 hover:text-white"
            title="New File"
          >
            📄+
          </button>
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 p-2 overflow-y-auto">
        <div className="mb-2">
          <div className="px-2 mb-1 text-xs font-medium tracking-wider text-gray-400 uppercase">
            Project Files
          </div>
          <div className="space-y-0">
            {renderFileTree(fileTree)}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-2 text-xs text-center text-gray-500 border-t border-gray-700">
        {Object.keys(files).filter(path => files[path]?.type === 'file').length} files
        {projectId && ` • Project: ${projectId.slice(-6)}`}
      </div>
    </div>
  );
};

export default FileExplorer;