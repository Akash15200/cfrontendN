import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  FaSync,
  FaExpand,
  FaCompress,
  FaCode,
  FaEye,
  FaTerminal,
  FaPlay,
  FaExclamationTriangle
} from "react-icons/fa";

const LivePreview = ({ files = {}, activeFile, onRunCode }) => {
  const iframeRef = useRef(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showCode, setShowCode] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [showConsole, setShowConsole] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isReactMode, setIsReactMode] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Enhanced React detection
  useEffect(() => {
    const checkReactMode = () => {
      const reactFiles = Object.values(files).filter(file => 
        file?.type === 'file' && 
        (file.name?.endsWith('.jsx') || 
         (file.name?.endsWith('.js') && 
          (file.code?.includes('import React') || 
           file.code?.includes('from "react"') ||
           file.code?.includes("from 'react'") ||
           file.code?.includes('React.createElement') ||
           file.code?.includes('function') && file.code?.includes('return (')) ||
          file.name === 'App.js' ||
          file.name === 'App.jsx'))
      );
      
      const hasReactContent = Object.values(files).some(file => 
        file?.code?.includes('React') || 
        file?.code?.includes('useState') ||
        file?.code?.includes('useEffect') ||
        file?.code?.includes('createElement') ||
        (file?.code?.includes('function') && file?.code?.includes('return ('))
      );

      setIsReactMode(reactFiles.length > 0 || hasReactContent);
      setIsLoading(false);
    };

    checkReactMode();
  }, [files]);

  // Enhanced error detection
  const detectCodeErrors = useCallback(() => {
    const jsCode = files["/App.js"]?.code || files["/App.jsx"]?.code || files["/script.js"]?.code || "";
    
    // Check for common syntax errors
    if (jsCode.includes("port default") && !jsCode.includes("export default")) {
      return "Syntax Error: Use 'export default App' instead of 'port default App'";
    }
    
    if (jsCode.includes("import React") && !jsCode.includes("from 'react'") && !jsCode.includes('from "react"')) {
      return "Syntax Error: Invalid import statement for React";
    }

    // Check for JSX syntax without proper React setup
    if ((jsCode.includes("<div>") || jsCode.includes("</div>")) && !jsCode.includes("import React") && !jsCode.includes('React')) {
      return "JSX Error: Make sure to import React when using JSX syntax";
    }
    
    return null;
  }, [files]);

  // Generate error HTML
  const generateErrorHTML = useCallback((error) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Code Error - Cyber Studio</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #1e1e1e;
            color: white;
            padding: 40px 20px;
            text-align: center;
          }
          .error-container {
            max-width: 600px;
            margin: 0 auto;
            background: #2d2d2d;
            padding: 30px;
            border-radius: 10px;
            border-left: 4px solid #ff4444;
          }
          .error-icon {
            font-size: 3em;
            margin-bottom: 20px;
          }
          pre {
            background: #1e1e1e;
            padding: 15px;
            border-radius: 5px;
            text-align: left;
            margin: 20px 0;
            overflow: auto;
          }
        </style>
      </head>
      <body>
        <div class="error-container">
          <div class="error-icon">🚨</div>
          <h1>Syntax Error Detected</h1>
          <p>Your code contains syntax errors that prevent execution:</p>
          <pre>${error}</pre>
          <p>Please fix the errors and try again.</p>
        </div>
      </body>
      </html>
    `;
  }, []);

  // Generate combined HTML content - FIXED REACT RENDERING
  const generateCode = useCallback(() => {
    const html = files["/index.html"]?.code || "";
    const css = files["/styles.css"]?.code || files["/App.css"]?.code || files["/style.css"]?.code || "";
    const js = files["/App.js"]?.code || files["/App.jsx"]?.code || files["/script.js"]?.code || files["/index.js"]?.code || "";

    // Check for syntax errors first
    const syntaxError = detectCodeErrors();
    if (syntaxError) {
      return generateErrorHTML(syntaxError);
    }

    // If we have React files or JSX, use React mode
    if (isReactMode) {
      console.log("🔧 React mode detected, generating React preview...");
      
      // Check if we have a proper React component
      const hasValidReactComponent = js.includes('function') && js.includes('return') && 
                                   (js.includes('export default') || js.includes('export'));

      const reactCode = hasValidReactComponent ? js : `
        // Default React App
        import React from 'react';
        
        function App() {
          return React.createElement('div', {
            style: {
              textAlign: 'center',
              padding: '50px 20px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              minHeight: '100vh',
              color: 'white',
              fontFamily: 'Arial, sans-serif'
            }
          }, [
            React.createElement('h1', {
              key: 'title',
              style: { fontSize: '2.5em', marginBottom: '20px' }
            }, '🚀 Welcome to Cyber Studio!'),
            React.createElement('p', {
              key: 'subtitle',
              style: { fontSize: '1.2em', marginBottom: '30px', opacity: 0.9 }
            }, 'Your React app is running successfully!'),
            React.createElement('button', {
              key: 'button',
              onClick: () => alert('Hello from Cyber Studio React! 🎉'),
              style: {
                padding: '12px 24px',
                background: '#007acc',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                marginTop: '20px'
              }
            }, 'Click Me!')
          ]);
        }
        
        export default App;
      `;

      return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>React App - Cyber Studio</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
              background: #1e1e1e;
              color: #333;
            }
            #root { 
              min-height: 100vh;
              width: 100%;
            }
            .loading {
              padding: 40px;
              text-align: center;
              color: #888;
              background: #f5f5f5;
              min-height: 100vh;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              font-family: Arial, sans-serif;
            }
            .error {
              background: #ff4444;
              color: white;
              padding: 20px;
              margin: 20px;
              border-radius: 8px;
              text-align: center;
            }
            .success {
              background: #4CAF50;
              color: white;
              padding: 10px;
              margin: 10px;
              border-radius: 5px;
              text-align: center;
            }
            ${css}
          </style>
        </head>
        <body>
          <div id="root">
            <div class="loading">
              <h2 style="color: #333; margin-bottom: 20px;">🚀 Loading Your React App...</h2>
              <div style="width: 40px; height: 40px; border: 4px solid #e0e0e0; border-top: 4px solid #007acc; border-radius: 50%; animation: spin 1s linear infinite;"></div>
              <p style="margin-top: 20px; color: #666;">Initializing React components...</p>
            </div>
          </div>
          
          <!-- React CDN -->
          <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
          <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
          
          <!-- Babel for JSX transformation -->
          <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
          
          <script type="text/babel">
            // Enhanced error handling
            window.addEventListener('error', function(e) {
              console.error('Runtime Error:', e.error);
              const root = document.getElementById('root');
              if (root) {
                root.innerHTML = '<div class="error"><h3>🚨 Runtime Error</h3><p>' + 
                  (e.error?.toString() || 'Unknown error occurred') + 
                  '</p><p>Check the console for more details.</p></div>';
              }
            });

            // Enhanced console logging
            const originalConsole = {
              log: console.log,
              error: console.error,
              warn: console.warn,
              info: console.info
            };

            function sendToParent(type, args) {
              try {
                window.parent.postMessage({
                  type: 'CONSOLE_' + type.toUpperCase(),
                  data: Array.from(args).map(arg => 
                    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                  ).join(' '),
                  timestamp: new Date().toISOString()
                }, '*');
              } catch (err) {
                // Silent fail
              }
            }

            ['log', 'error', 'warn', 'info'].forEach(method => {
              console[method] = function(...args) {
                originalConsole[method].apply(console, args);
                sendToParent(method, args);
              };
            });

            console.log('🔧 Starting React application...');
            console.log('React version:', React.version);
            console.log('ReactDOM version:', ReactDOM.version);

            try {
              // Transpile and execute the React code
              ${reactCode}
              
              // Render the app
              const rootElement = document.getElementById('root');
              if (typeof App !== 'undefined') {
                console.log('✅ App component found, rendering...');
                ReactDOM.render(React.createElement(App), rootElement);
                console.log('✅ React app rendered successfully!');
                
                // Show success message briefly
                setTimeout(() => {
                  const successMsg = document.createElement('div');
                  successMsg.className = 'success';
                  successMsg.style.cssText = 'position: fixed; top: 10px; right: 10px; z-index: 1000; padding: 8px 16px; background: #4CAF50; color: white; border-radius: 4px; font-size: 12px;';
                  successMsg.textContent = '✅ React App Loaded';
                  document.body.appendChild(successMsg);
                  setTimeout(() => successMsg.remove(), 3000);
                }, 100);
              } else {
                console.error('❌ App component not found or not exported properly');
                rootElement.innerHTML = '<div class="error"><h2>React Component Error</h2><p>Make sure you have an App component defined and exported.</p><p>Check that your component uses "export default App"</p></div>';
              }
            } catch (err) {
              console.error('❌ React initialization error:', err);
              document.getElementById('root').innerHTML = 
                '<div class="error"><h3>Initialization Error</h3><p>' + err.toString() + '</p><p>Check the developer console for details.</p></div>';
            }
          </script>
          
          <style>
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        </body>
        </html>
      `;
    }

    // Vanilla HTML/JS mode
    console.log("🌐 HTML mode detected, generating standard preview...");
    
    const defaultHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: white;
            text-align: center;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
          }
          h1 {
            font-size: 2.5em;
            margin-bottom: 20px;
          }
          p {
            font-size: 1.2em;
            opacity: 0.9;
            margin-bottom: 30px;
          }
          button {
            padding: 12px 24px;
            background: #007acc;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            margin: 10px;
          }
          button:hover {
            background: #005a9e;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🚀 Cyber Studio IDE</h1>
          <p>Edit your HTML, CSS, and JavaScript files to see live changes here!</p>
          <button onclick="alert('Hello from Cyber Studio! 🎉')">Click Me!</button>
          <button onclick="showTime()">Show Current Time</button>
          <div id="output" style="margin-top: 20px; padding: 20px; background: rgba(255,255,255,0.1); border-radius: 8px;"></div>
        </div>
        
        <script>
          function showTime() {
            document.getElementById('output').innerHTML = '<p>Current time: ' + new Date().toLocaleTimeString() + '</p>';
          }
          
          // Enhanced console for vanilla JS
          const originalConsole = {
            log: console.log,
            error: console.error,
            warn: console.warn,
            info: console.info
          };

          function sendToParent(type, args) {
            try {
              window.parent.postMessage({
                type: 'CONSOLE_' + type.toUpperCase(),
                data: Array.from(args).map(arg => 
                  typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                ).join(' '),
                timestamp: new Date().toISOString()
              }, '*');
            } catch (err) {}
          }

          ['log', 'error', 'warn', 'info'].forEach(method => {
            console[method] = function(...args) {
              originalConsole[method].apply(console, args);
              sendToParent(method, args);
            };
          });

          console.log('🔧 Live preview loaded successfully!');
          console.log('Running in HTML mode');

          try {
            ${js}
          } catch (err) {
            console.error('❌ JavaScript error:', err);
          }
        </script>
      </body>
      </html>
    `;

    // If custom HTML is provided, use it with enhanced styling
    if (html && html.trim()) {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <style>${css}</style>
        </head>
        ${html}
        <script>
          // Enhanced console for vanilla JS
          const originalConsole = {
            log: console.log,
            error: console.error,
            warn: console.warn,
            info: console.info
          };

          function sendToParent(type, args) {
            try {
              window.parent.postMessage({
                type: 'CONSOLE_' + type.toUpperCase(),
                data: Array.from(args).map(arg => 
                  typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                ).join(' '),
                timestamp: new Date().toISOString()
              }, '*');
            } catch (err) {}
          }

          ['log', 'error', 'warn', 'info'].forEach(method => {
            console[method] = function(...args) {
              originalConsole[method].apply(console, args);
              sendToParent(method, args);
            };
          });

          console.log('🔧 Custom HTML preview loaded successfully!');

          try {
            ${js}
          } catch (err) {
            console.error('❌ JavaScript error:', err);
          }
        </script>
        </html>
      `;
    }

    return defaultHTML;
  }, [files, isReactMode, detectCodeErrors, generateErrorHTML]);

  // Update error state
  useEffect(() => {
    const syntaxError = detectCodeErrors();
    if (syntaxError) {
      setHasError(true);
      setErrorMessage(syntaxError);
    } else {
      setHasError(false);
      setErrorMessage("");
    }
  }, [detectCodeErrors]);

  const codeToRender = generateCode();

  // Refresh manually
  const refreshPreview = () => {
    setIsRefreshing(true);
    setRefreshKey((prev) => prev + 1);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Capture console logs inside iframe
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && typeof event.data === 'object') {
        const timestamp = new Date().toLocaleTimeString();
        
        switch (event.data.type) {
          case 'CONSOLE_LOG':
            setConsoleLogs((prev) => [
              ...prev.slice(-49),
              { type: "log", message: event.data.data, time: timestamp }
            ]);
            break;
          case 'CONSOLE_ERROR':
            setConsoleLogs((prev) => [
              ...prev.slice(-49),
              { type: "error", message: event.data.data, time: timestamp }
            ]);
            break;
          case 'CONSOLE_WARN':
            setConsoleLogs((prev) => [
              ...prev.slice(-49),
              { type: "warn", message: event.data.data, time: timestamp }
            ]);
            break;
          case 'CONSOLE_INFO':
            setConsoleLogs((prev) => [
              ...prev.slice(-49),
              { type: "info", message: event.data.data, time: timestamp }
            ]);
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Listen for codeRun event from CodeEditor
  useEffect(() => {
    const handleCodeRun = (event) => {
      console.log('📢 Received codeRun event, refreshing preview...', event.detail);
      refreshPreview();
    };

    window.addEventListener('codeRun', handleCodeRun);
    
    return () => {
      window.removeEventListener('codeRun', handleCodeRun);
    };
  }, []);

  // Clear console logs
  const clearConsole = () => {
    setConsoleLogs([]);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border-l border-gray-700">
      {/* Preview Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-white">Live Preview</h2>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 text-xs rounded ${isReactMode ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'}`}>
              {isReactMode ? '⚛️ React Mode' : '🌐 HTML Mode'}
            </span>
            {hasError && (
              <span className="flex items-center px-2 py-1 text-xs bg-red-600 text-white rounded">
                <FaExclamationTriangle className="mr-1" />
                Error
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Code/Preview Toggle */}
          <div className="flex bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setShowCode(false)}
              className={`flex items-center px-3 py-1 text-sm rounded-md transition-colors ${
                !showCode ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'
              }`}
            >
              <FaEye className="mr-2" />
              Preview
            </button>
            <button
              onClick={() => setShowCode(true)}
              className={`flex items-center px-3 py-1 text-sm rounded-md transition-colors ${
                showCode ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'
              }`}
            >
              <FaCode className="mr-2" />
              Code
            </button>
          </div>

          {/* Console Toggle */}
          <button
            onClick={() => setShowConsole(!showConsole)}
            className={`flex items-center px-3 py-1 text-sm rounded transition-colors ${
              showConsole ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-300 hover:text-white'
            }`}
          >
            <FaTerminal className="mr-2" />
            Console {consoleLogs.length > 0 && `(${consoleLogs.length})`}
          </button>

          {/* Refresh Button */}
          <button
            onClick={refreshPreview}
            disabled={isRefreshing}
            className={`flex items-center px-3 py-1 text-sm bg-green-600 text-white rounded transition-all hover:bg-green-700 ${
              isRefreshing ? 'opacity-50 cursor-not-allowed' : 'transform hover:scale-105'
            }`}
          >
            <FaSync className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {hasError && (
        <div className="bg-red-600 text-white px-4 py-2 text-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FaExclamationTriangle className="mr-2" />
              <span>Syntax Error: {errorMessage}</span>
            </div>
            <button 
              onClick={() => setHasError(false)}
              className="text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Preview Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {showCode ? (
          <div className="flex-1 overflow-auto bg-gray-800 p-4">
            <pre className="text-gray-200 text-sm font-mono whitespace-pre-wrap">
              {codeToRender}
            </pre>
          </div>
        ) : (
          <div className="flex-1 relative bg-white">
            <iframe
              key={refreshKey}
              ref={iframeRef}
              title="live-preview"
              className="w-full h-full border-0"
              srcDoc={codeToRender}
              sandbox="allow-scripts allow-same-origin allow-modals allow-forms allow-popups"
              onLoad={() => {
                setIsRefreshing(false);
                console.log('✅ Iframe loaded successfully');
              }}
            />
            {isRefreshing && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
                <div className="text-center text-white">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p>Refreshing preview...</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Console Panel */}
        {showConsole && (
          <div className="h-64 border-t border-gray-700 bg-gray-900 flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
              <h3 className="text-sm font-medium text-white">Console</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={clearConsole}
                  className="px-2 py-1 text-xs text-gray-300 hover:text-white bg-gray-700 rounded"
                >
                  Clear
                </button>
                <span className="text-xs text-gray-400">
                  {consoleLogs.length} messages
                </span>
              </div>
            </div>
            <div className="flex-1 overflow-auto font-mono text-sm">
              {consoleLogs.length === 0 ? (
                <div className="p-4 text-gray-500 text-center">
                  No console messages. Run your code to see output here.
                </div>
              ) : (
                consoleLogs.map((log, index) => (
                  <div
                    key={index}
                    className={`px-4 py-1 border-b border-gray-800 ${
                      log.type === "error"
                        ? "text-red-400 bg-red-900/20"
                        : log.type === "warn"
                        ? "text-yellow-400"
                        : log.type === "info"
                        ? "text-blue-400"
                        : "text-gray-300"
                    }`}
                  >
                    <span className="text-gray-500 text-xs mr-3">
                      [{log.time}]
                    </span>
                    <span className="font-semibold mr-2">
                      {log.type.toUpperCase()}:
                    </span>
                    {log.message}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="px-4 py-2 bg-gray-800 border-t border-gray-700 text-xs text-gray-400 flex justify-between">
        <div>
          Status:{" "}
          <span className={hasError ? "text-red-400" : "text-green-400"}>
            {hasError ? "❌ Errors detected" : "✅ Ready"}
          </span>
        </div>
        <div>
          Mode: {isReactMode ? "React" : "HTML/CSS/JS"} • Auto-refresh: On
        </div>
      </div>
    </div>
  );
};

export default LivePreview;