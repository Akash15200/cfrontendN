import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaPlay, FaSave, FaExpand, FaCompress, FaGripLines } from 'react-icons/fa';
import { toast } from 'react-toastify';

const CodeEditor = ({ files, activeFile, projectId, onFileChange, onSaveFile, onRunCode }) => {
  const [localContent, setLocalContent] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [isFloating, setIsFloating] = useState(false);
  
  const textareaRef = useRef(null);
  const preRef = useRef(null);
  const lineNumbersRef = useRef(null);
  const editorRef = useRef(null);
  const dragHandleRef = useRef(null);
  const lastSavedContentRef = useRef('');
  const lastSelectionRef = useRef({ start: 0, end: 0 });

  // Safe handling of activeFile with proper fallbacks
  const safeActiveFile = activeFile || '/App.js';
  const fileName = safeActiveFile.split('/').pop() || 'App.js';
  const currentFile = files?.[safeActiveFile];

  // Initialize content when file changes
  useEffect(() => {
    if (currentFile && currentFile.type === 'file') {
      const fileContent = currentFile.code || getDefaultContent(fileName);
      
      if (fileContent !== localContent) {
        setLocalContent(fileContent);
        lastSavedContentRef.current = fileContent;
        setHasUnsavedChanges(false);
        
        // Focus and reset cursor after content load
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.setSelectionRange(0, 0);
            updateCursorPosition(textareaRef.current);
          }
        }, 100);
      }
    } else if (!currentFile) {
      // If no current file, set default content
      const defaultContent = getDefaultContent(fileName);
      setLocalContent(defaultContent);
      lastSavedContentRef.current = defaultContent;
      setHasUnsavedChanges(false);
    }
  }, [safeActiveFile, currentFile?.code, fileName]);

  // Get default content based on file type
  const getDefaultContent = (filename) => {
    if (!filename) return '// Start coding here...';
    
    if (filename.endsWith('.js') || filename.endsWith('.jsx')) {
      return `import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <h1>Welcome to Cyber Studio! 🚀</h1>
      <p>Start editing to see some magic happen!</p>
    </div>
  );
}

export default App;`;
    } else if (filename.endsWith('.css')) {
      return `/* Welcome to Cyber Studio! */
.App {
  text-align: center;
  padding: 20px;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}`;
    } else if (filename.endsWith('.html')) {
      return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cyber Studio App</title>
</head>
<body>
    <div id="root"></div>
</body>
</html>`;
    }
    return '// Start coding here...';
  };

  // Save cursor position
  const saveCursorPosition = useCallback(() => {
    if (textareaRef.current) {
      lastSelectionRef.current = {
        start: textareaRef.current.selectionStart,
        end: textareaRef.current.selectionEnd
      };
    }
  }, []);

  // Restore cursor position
  const restoreCursorPosition = useCallback(() => {
    if (textareaRef.current && lastSelectionRef.current) {
      const { start, end } = lastSelectionRef.current;
      textareaRef.current.setSelectionRange(start, end);
      updateCursorPosition(textareaRef.current);
    }
  }, []);

  // Update cursor position
  const updateCursorPosition = useCallback((textarea) => {
    if (!textarea) return;
    
    const text = textarea.value;
    const selectionStart = textarea.selectionStart;
    const lines = text.substr(0, selectionStart).split('\n');
    const line = lines.length;
    const column = lines[lines.length - 1].length + 1;
    setCursorPosition({ line, column });
  }, []);

  // Handle content changes
  const handleContentChange = useCallback((e) => {
    if (!e.target) return;
    
    saveCursorPosition();
    
    const newContent = e.target.value;
    setLocalContent(newContent);
    
    const hasChanged = newContent !== lastSavedContentRef.current;
    setHasUnsavedChanges(hasChanged);
    
    updateCursorPosition(e.target);
    
    if (onFileChange && hasChanged) {
      onFileChange(safeActiveFile, newContent);
    }
  }, [onFileChange, safeActiveFile, updateCursorPosition, saveCursorPosition]);

  // Restore cursor after content updates
  useEffect(() => {
    if (textareaRef.current && localContent) {
      restoreCursorPosition();
    }
  }, [localContent, restoreCursorPosition]);

  // Handle file save
  const handleFileSave = useCallback(async () => {
    if (!currentFile && !hasUnsavedChanges) return;
    
    try {
      let success = true;
      if (onSaveFile && projectId) {
        success = await onSaveFile(safeActiveFile, localContent);
      } else if (onSaveFile) {
        success = await onSaveFile(safeActiveFile, localContent);
      }
      
      if (success !== false) {
        lastSavedContentRef.current = localContent;
        setHasUnsavedChanges(false);
        toast.success(`Saved ${fileName}`);
        return true;
      }
    } catch (error) {
      console.error('Save failed:', error);
      toast.error(`Failed to save ${fileName}`);
    }
    return false;
  }, [currentFile, hasUnsavedChanges, onSaveFile, projectId, safeActiveFile, localContent, fileName]);

  // Handle run code - FIXED VERSION
  const handleRunCode = useCallback(async () => {
    if (!currentFile && !localContent) {
      toast.error('No content to run');
      return;
    }
    
    setIsRunning(true);
    toast.info('Running code...');
    
    try {
      // Save if there are unsaved changes
      if (hasUnsavedChanges) {
        await handleFileSave();
      }
      
      // Create updated files object
      const updatedFiles = { ...files };
      if (updatedFiles[safeActiveFile]) {
        updatedFiles[safeActiveFile] = {
          ...updatedFiles[safeActiveFile],
          code: localContent
        };
      }
      
      // If parent component provided onRunCode prop, use it
      if (onRunCode) {
        await onRunCode(updatedFiles, safeActiveFile, localContent);
      } else {
        // Otherwise dispatch event for LivePreview to listen to
        const event = new CustomEvent('codeRun', { 
          detail: { 
            files: updatedFiles,
            activeFile: safeActiveFile,
            content: localContent,
            timestamp: Date.now()
          }
        });
        window.dispatchEvent(event);
      }
      
      toast.success('Code executed successfully!');
      
    } catch (error) {
      console.error('Run code error:', error);
      toast.error('Failed to run code');
    } finally {
      // Reset running state
      setTimeout(() => {
        setIsRunning(false);
      }, 1000);
    }
  }, [currentFile, hasUnsavedChanges, handleFileSave, files, safeActiveFile, localContent, onRunCode]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // Toggle floating mode
  const toggleFloating = useCallback(() => {
    setIsFloating(!isFloating);
    if (!isFloating) {
      setDragPosition({ x: 100, y: 100 });
    }
  }, [isFloating]);

  // Drag functionality
  const handleDragStart = useCallback((e) => {
    if (!isFloating) return;
    
    setIsDragging(true);
    const startX = e.clientX - dragPosition.x;
    const startY = e.clientY - dragPosition.y;
    
    const handleDrag = (moveEvent) => {
      if (!isDragging) return;
      const newX = moveEvent.clientX - startX;
      const newY = moveEvent.clientY - startY;
      setDragPosition({ x: newX, y: newY });
    };
    
    const handleDragEnd = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('mouseup', handleDragEnd);
    };
    
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', handleDragEnd);
  }, [isDragging, dragPosition, isFloating]);

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        handleFileSave();
        return;
      }
      
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        handleRunCode();
        return;
      }

      if (event.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
        return;
      }
      
      if (event.key === 'Tab' && textareaRef.current) {
        event.preventDefault();
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        
        const newValue = localContent.substring(0, start) + '  ' + localContent.substring(end);
        
        saveCursorPosition();
        setLocalContent(newValue);
        
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
            updateCursorPosition(textareaRef.current);
          }
        }, 0);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [localContent, isFullscreen, handleFileSave, handleRunCode, updateCursorPosition, saveCursorPosition]);

  // Handle textarea events
  const handleTextareaClick = useCallback((e) => {
    updateCursorPosition(e.target);
  }, [updateCursorPosition]);

  const handleTextareaKeyUp = useCallback((e) => {
    updateCursorPosition(e.target);
  }, [updateCursorPosition]);

  const handleTextareaKeyDown = useCallback((e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
    }
  }, []);

  // Get file language
  const getFileLanguage = useCallback(() => {
    if (safeActiveFile.endsWith('.js') || safeActiveFile.endsWith('.jsx')) {
      return 'javascript';
    } else if (safeActiveFile.endsWith('.css')) {
      return 'css';
    } else if (safeActiveFile.endsWith('.html')) {
      return 'html';
    } else if (safeActiveFile.endsWith('.json')) {
      return 'json';
    } else {
      return 'text';
    }
  }, [safeActiveFile]);

  // Scroll handler to sync editor elements
  const handleScroll = useCallback((e) => {
    const { scrollTop, scrollLeft } = e.target;
    
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = scrollTop;
    }
    if (preRef.current) {
      preRef.current.scrollTop = scrollTop;
      preRef.current.scrollLeft = scrollLeft;
    }
  }, []);

  // Generate line numbers
  const generateLineNumbers = useCallback(() => {
    if (!localContent) return [1];
    const lineCount = localContent.split('\n').length;
    return Array.from({ length: Math.max(lineCount, 1) }, (_, i) => i + 1);
  }, [localContent]);

  // Show loading or no file state
  if (!files || Object.keys(files).length === 0) {
    return (
      <div className="flex flex-col flex-1 bg-gray-900 items-center justify-center">
        <div className="text-center text-gray-400">
          <p className="text-lg mb-2">Loading files...</p>
          <p className="text-sm">Please wait while files are loading</p>
        </div>
      </div>
    );
  }

  if (!currentFile || currentFile.type !== 'file') {
    return (
      <div className="flex flex-col flex-1 bg-gray-900 items-center justify-center">
        <div className="text-center text-gray-400">
          <p className="text-lg mb-2">No file selected</p>
          <p className="text-sm">Select a file from the file explorer to start editing</p>
        </div>
      </div>
    );
  }

  const lineNumbers = generateLineNumbers();

  // Editor container styles
  const editorContainerStyle = isFloating ? {
    position: 'fixed',
    left: `${dragPosition.x}px`,
    top: `${dragPosition.y}px`,
    width: '600px',
    height: '400px',
    zIndex: 1000,
    borderRadius: '8px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
    border: '2px solid #374151'
  } : {};

  return (
    <div 
      ref={editorRef}
      className={`bg-gray-900 ${isFullscreen ? 'fixed inset-0 z-50' : isFloating ? '' : 'flex-1'}`}
      style={editorContainerStyle}
    >
      {/* Editor Header */}
      <div 
        ref={dragHandleRef}
        className={`flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700 ${
          isFloating ? 'cursor-move rounded-t-lg' : ''
        }`}
        onMouseDown={isFloating ? handleDragStart : undefined}
      >
        <div className="flex items-center space-x-2">
          {isFloating && (
            <FaGripLines className="text-gray-400 mr-2 cursor-move" />
          )}
          <span className="text-sm font-medium text-gray-300">Editor</span>
          <span className="px-2 py-1 text-xs text-gray-300 bg-gray-700 rounded border border-gray-600">
            {fileName}
          </span>
          <span className="text-xs text-gray-400 max-w-xs truncate">
            {safeActiveFile}
          </span>
          {hasUnsavedChanges && (
            <span className="text-xs text-yellow-400 animate-pulse">● Unsaved</span>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-xs text-gray-500">
            {getFileLanguage().toUpperCase()}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleFloating}
              className={`flex items-center p-2 text-gray-400 transition-all rounded hover:bg-gray-700 hover:text-white transform hover:scale-105 ${
                isFloating ? 'bg-blue-600 text-white' : ''
              }`}
              title={isFloating ? 'Dock Editor' : 'Float Editor'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
              </svg>
            </button>
            <button
              onClick={handleRunCode}
              disabled={isRunning}
              className={`flex items-center px-3 py-2 space-x-2 text-sm text-white transition-all rounded ${
                isRunning 
                  ? 'bg-yellow-600 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700 transform hover:scale-105'
              }`}
              title="Run Code (Ctrl+Enter)"
            >
              {isRunning ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <FaPlay className="text-xs" />
                  <span>Run</span>
                </>
              )}
            </button>
            <button
              onClick={handleFileSave}
              disabled={!hasUnsavedChanges}
              className={`flex items-center px-3 py-2 space-x-2 text-sm text-white transition-all rounded ${
                hasUnsavedChanges
                  ? 'bg-blue-600 hover:bg-blue-700 transform hover:scale-105'
                  : 'bg-gray-600 cursor-not-allowed opacity-50'
              }`}
              title="Save File (Ctrl+S)"
            >
              <FaSave className="text-xs" />
              <span>Save</span>
            </button>
            <button
              onClick={toggleFullscreen}
              className="flex items-center p-2 text-gray-400 transition-all rounded hover:bg-gray-700 hover:text-white transform hover:scale-105"
              title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <FaCompress /> : <FaExpand />}
            </button>
          </div>
        </div>
      </div>

      {/* Code Editor */}
      <div className={`${isFloating ? 'h-[calc(100%-49px)]' : 'h-[calc(100vh-150px)]'} relative overflow-auto bg-gray-900`}>
        <div className="flex min-h-full">
          {/* Line numbers */}
          <div 
            ref={lineNumbersRef}
            className="w-12 bg-gray-800 text-gray-500 text-right py-2 overflow-hidden select-none border-r border-gray-700 font-mono text-xs flex-shrink-0"
            style={{ lineHeight: '1.5' }}
          >
            {lineNumbers.map((lineNum) => (
              <div key={lineNum} className="px-2 hover:text-gray-300" style={{ lineHeight: '1.5' }}>
                {lineNum}
              </div>
            ))}
          </div>
          
          {/* Text area */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={localContent}
              onChange={handleContentChange}
              onClick={handleTextareaClick}
              onKeyUp={handleTextareaKeyUp}
              onKeyDown={handleTextareaKeyDown}
              onScroll={handleScroll}
              className="absolute inset-0 font-mono text-sm bg-gray-900 text-white resize-none outline-none py-2 px-4 whitespace-pre overflow-auto border-none caret-white leading-relaxed"
              style={{ 
                fontFamily: '"Fira Code", "Cascadia Code", "Source Code Pro", "Monaco", "Consolas", monospace',
                tabSize: 2,
                lineHeight: '1.5'
              }}
              spellCheck="false"
              placeholder={`Start coding in ${getFileLanguage()}...`}
            />
          </div>
        </div>
      </div>

      {/* Editor Footer */}
      <div className="flex items-center justify-between px-4 py-2 text-xs bg-gray-800 border-t border-gray-700 text-gray-400">
        <div className="flex items-center space-x-4">
          <span>UTF-8</span>
          <span>{getFileLanguage()}</span>
          <span>Lines: {lineNumbers.length}</span>
          <span>Size: {((localContent?.length || 0) / 1024).toFixed(2)} KB</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>Ln {cursorPosition.line}, Col {cursorPosition.column}</span>
          <span>Ctrl+S to save • Ctrl+Enter to run</span>
          {hasUnsavedChanges && (
            <span className="text-yellow-400 animate-pulse">Unsaved changes</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;