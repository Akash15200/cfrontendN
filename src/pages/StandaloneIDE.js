import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const StandaloneIDE = () => {
  const navigate = useNavigate();
  const [isInitialized, setIsInitialized] = useState(false);
  const iframeRef = useRef(null);

  useEffect(() => {
    // Initialize the IDE after component mounts
    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  // Standalone IDE HTML content
  const standaloneIDEHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CipherStudio IDE</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #1e1e1e;
            color: #fff;
            height: 100vh;
            overflow: hidden;
        }

        .ide-container {
            display: flex;
            height: 100vh;
        }

        /* File Explorer */
        .file-explorer {
            width: 250px;
            background: #252526;
            border-right: 1px solid #3e3e42;
            display: flex;
            flex-direction: column;
        }

        .explorer-header {
            padding: 15px;
            background: #2d2d30;
            border-bottom: 1px solid #3e3e42;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .file-tree {
            flex: 1;
            padding: 10px;
            overflow-y: auto;
        }

        .file-item {
            padding: 8px 10px;
            cursor: pointer;
            border-radius: 3px;
            margin: 2px 0;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s ease;
        }

        .file-item:hover {
            background: #2a2d2e;
        }

        .file-item.active {
            background: #094771;
        }

        /* Editor Area */
        .editor-area {
            flex: 1;
            display: flex;
            flex-direction: column;
        }

        .editor-tabs {
            display: flex;
            background: #2d2d30;
            border-bottom: 1px solid #3e3e42;
        }

        .editor-tab {
            padding: 10px 20px;
            background: #2d2d30;
            border-right: 1px solid #3e3e42;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s ease;
            min-width: 120px;
        }

        .editor-tab.active {
            background: #1e1e1e;
            border-bottom: 2px solid #007acc;
        }

        .code-editor {
            flex: 1;
            background: #1e1e1e;
            position: relative;
            display: flex;
        }

        .editor-container {
            flex: 1;
            display: none;
            position: relative;
        }

        .editor-container.active {
            display: block;
        }

        .editor {
            width: 100%;
            height: 100%;
            background: #1e1e1e;
            color: #d4d4d4;
            border: none;
            padding: 20px;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 14px;
            line-height: 1.5;
            resize: none;
            outline: none;
            tab-size: 4;
            white-space: pre;
            overflow: auto;
        }

        .line-numbers {
            position: absolute;
            left: 0;
            top: 0;
            width: 40px;
            height: 100%;
            background: #1e1e1e;
            border-right: 1px solid #3e3e42;
            color: #6e7681;
            text-align: right;
            padding: 20px 5px;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 14px;
            line-height: 1.5;
            user-select: none;
            overflow: hidden;
        }

        /* Preview Area */
        .preview-area {
            width: 45%;
            background: white;
            display: flex;
            flex-direction: column;
        }

        .preview-header {
            padding: 15px;
            background: #007acc;
            color: white;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .preview-content {
            flex: 1;
            color: #333;
            overflow: hidden;
            position: relative;
        }

        #preview-frame {
            width: 100%;
            height: 100%;
            border: none;
        }

        .console-panel {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 150px;
            background: #1e1e1e;
            border-top: 1px solid #3e3e42;
            display: none;
            flex-direction: column;
        }

        .console-panel.active {
            display: flex;
        }

        .console-header {
            padding: 8px 15px;
            background: #2d2d30;
            color: #ccc;
            font-size: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .console-content {
            flex: 1;
            padding: 10px;
            overflow-y: auto;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 12px;
            color: #d4d4d4;
        }

        .console-log {
            margin-bottom: 4px;
            padding: 2px 0;
        }

        .console-log.error {
            color: #f44747;
        }

        .console-log.warn {
            color: #ffcc02;
        }

        .console-log.info {
            color: #75beff;
        }

        .run-button {
            background: #28a745;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            transition: background 0.2s ease;
        }

        .run-button:hover {
            background: #218838;
        }

        .run-button:disabled {
            background: #6c757d;
            cursor: not-allowed;
        }

        /* Icons */
        .icon {
            width: 16px;
            height: 16px;
            display: inline-block;
        }

        .js-icon { color: #f7df1e; }
        .html-icon { color: #e34f26; }
        .css-icon { color: #1572b6; }
        .file-icon { color: #d4d4d4; }
        .folder-icon { color: #d7ba7d; }

        /* Action buttons */
        .action-buttons {
            display: flex;
            gap: 5px;
        }

        .action-btn {
            background: none;
            border: none;
            color: #ccc;
            cursor: pointer;
            padding: 4px;
            border-radius: 3px;
            transition: all 0.2s ease;
        }

        .action-btn:hover {
            background: #3e3e42;
            color: #fff;
        }

        /* Status bar */
        .status-bar {
            padding: 8px 15px;
            background: #007acc;
            color: white;
            font-size: 12px;
            display: flex;
            justify-content: space-between;
        }

        .toggle-console {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 12px;
        }

        .toggle-console:hover {
            background: rgba(255,255,255,0.1);
        }
    </style>
</head>
<body>
    <div class="ide-container">
        <!-- File Explorer -->
        <div class="file-explorer">
            <div class="explorer-header">
                <h3>EXPLORER</h3>
                <div class="action-buttons">
                    <button class="action-btn" onclick="createNewFile()" title="New File">📄+</button>
                    <button class="action-btn" onclick="createNewFolder()" title="New Folder">📁+</button>
                </div>
            </div>
            <div class="file-tree">
                <div class="file-item active" data-file="html" onclick="switchTab('html')">
                    <span class="icon html-icon">📄</span>
                    <span>index.html</span>
                </div>
                <div class="file-item" data-file="css" onclick="switchTab('css')">
                    <span class="icon css-icon">📄</span>
                    <span>styles.css</span>
                </div>
                <div class="file-item" data-file="js" onclick="switchTab('js')">
                    <span class="icon js-icon">📄</span>
                    <span>script.js</span>
                </div>
            </div>
        </div>

        <!-- Editor Area -->
        <div class="editor-area">
            <div class="editor-tabs">
                <div class="editor-tab active" data-tab="html" onclick="switchTab('html')">
                    <span class="icon html-icon">📄</span>
                    <span>index.html</span>
                </div>
                <div class="editor-tab" data-tab="css" onclick="switchTab('css')">
                    <span class="icon css-icon">📄</span>
                    <span>styles.css</span>
                </div>
                <div class="editor-tab" data-tab="js" onclick="switchTab('js')">
                    <span class="icon js-icon">📄</span>
                    <span>script.js</span>
                </div>
            </div>
            <div class="code-editor">
                <div class="editor-container active" data-editor="html">
                    <div class="line-numbers" id="html-line-numbers"></div>
                    <textarea id="html-editor" class="editor" oninput="updateLineNumbers('html')">&lt;!DOCTYPE html&gt;
&lt;html lang="en"&gt;
&lt;head&gt;
    &lt;meta charset="UTF-8"&gt;
    &lt;meta name="viewport" content="width=device-width, initial-scale=1.0"&gt;
    &lt;title&gt;My CipherStudio App&lt;/title&gt;
    &lt;link rel="stylesheet" href="styles.css"&gt;
&lt;/head&gt;
&lt;body&gt;
    &lt;div id="app"&gt;
        &lt;h1&gt;Welcome to CipherStudio IDE! 🚀&lt;/h1&gt;
        &lt;p&gt;Edit this code and click "Run Code" to see changes.&lt;/p&gt;
        &lt;div id="output"&gt;&lt;/div&gt;
        &lt;button onclick="showMessage()"&gt;Click Me!&lt;/button&gt;
    &lt;/div&gt;
    &lt;script src="script.js"&gt;&lt;/script&gt;
&lt;/body&gt;
&lt;/html&gt;</textarea>
                </div>
                <div class="editor-container" data-editor="css">
                    <div class="line-numbers" id="css-line-numbers"></div>
                    <textarea id="css-editor" class="editor" oninput="updateLineNumbers('css')">body {
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
}</textarea>
                </div>
                <div class="editor-container" data-editor="js">
                    <div class="line-numbers" id="js-line-numbers"></div>
                    <textarea id="js-editor" class="editor" oninput="updateLineNumbers('js')">function showMessage() {
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
document.head.appendChild(style);</textarea>
                </div>
            </div>
        </div>

        <!-- Preview Area -->
        <div class="preview-area">
            <div class="preview-header">
                <h3>LIVE PREVIEW</h3>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <button class="toggle-console" onclick="toggleConsole()">📋 Console</button>
                    <button class="run-button" onclick="runCode()">▶ Run Code</button>
                </div>
            </div>
            <div class="preview-content">
                <iframe id="preview-frame"></iframe>
                <div class="console-panel" id="console-panel">
                    <div class="console-header">
                        <span>Console</span>
                        <button class="toggle-console" onclick="clearConsole()">Clear</button>
                    </div>
                    <div class="console-content" id="console-content"></div>
                </div>
            </div>
        </div>
    </div>

    <div class="status-bar">
        <div id="status-message">Ready</div>
        <div>CipherStudio IDE v1.0 • Press Ctrl+Enter to run code</div>
    </div>

    <script>
        // Current state
        let currentTab = 'html';
        let isRunning = false;
        let consoleVisible = false;

        // Initialize the IDE
        function initializeIDE() {
            // Set up the preview frame
            const previewFrame = document.getElementById('preview-frame');
            previewFrame.style.width = '100%';
            previewFrame.style.height = '100%';
            
            // Initialize line numbers
            updateLineNumbers('html');
            updateLineNumbers('css');
            updateLineNumbers('js');
            
            // Run code on startup
            runCode();
            
            // Add keyboard shortcuts
            document.addEventListener('keydown', function(e) {
                // Ctrl+Enter or Cmd+Enter to run code
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    runCode();
                }
                
                // Ctrl+S or Cmd+S to save
                if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                    e.preventDefault();
                    saveCode();
                }
            });
            
            console.log('CipherStudio IDE initialized successfully!');
            addConsoleLog('info', 'CipherStudio IDE initialized successfully!');
        }

        // Update line numbers
        function updateLineNumbers(editorType) {
            const editor = document.getElementById(\`\${editorType}-editor\`);
            const lineNumbers = document.getElementById(\`\${editorType}-line-numbers\`);
            const lines = editor.value.split('\\n').length;
            
            let numbersHTML = '';
            for (let i = 1; i <= lines; i++) {
                numbersHTML += \`<div>\${i}</div>\`;
            }
            lineNumbers.innerHTML = numbersHTML;
        }

        // Switch between tabs
        function switchTab(tabName) {
            // Update tabs
            document.querySelectorAll('.editor-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            document.querySelector(\`[data-tab="\${tabName}"]\`).classList.add('active');
            
            // Update file items
            document.querySelectorAll('.file-item').forEach(item => {
                item.classList.remove('active');
            });
            document.querySelector(\`[data-file="\${tabName}"]\`).classList.add('active');
            
            // Update editors
            document.querySelectorAll('.editor-container').forEach(container => {
                container.classList.remove('active');
            });
            document.querySelector(\`[data-editor="\${tabName}"]\`).classList.add('active');
            
            currentTab = tabName;
        }

        // Toggle console visibility
        function toggleConsole() {
            consoleVisible = !consoleVisible;
            const consolePanel = document.getElementById('console-panel');
            const previewFrame = document.getElementById('preview-frame');
            
            if (consoleVisible) {
                consolePanel.classList.add('active');
                previewFrame.style.height = 'calc(100% - 150px)';
            } else {
                consolePanel.classList.remove('active');
                previewFrame.style.height = '100%';
            }
        }

        // Add console log
        function addConsoleLog(type, message) {
            const consoleContent = document.getElementById('console-content');
            const logElement = document.createElement('div');
            logElement.className = \`console-log \${type}\`;
            logElement.textContent = \`[\${new Date().toLocaleTimeString()}] \${message}\`;
            consoleContent.appendChild(logElement);
            consoleContent.scrollTop = consoleContent.scrollHeight;
        }

        // Clear console
        function clearConsole() {
            document.getElementById('console-content').innerHTML = '';
        }

        // Save code
        function saveCode() {
            const codeData = {
                html: document.getElementById('html-editor').value,
                css: document.getElementById('css-editor').value,
                js: document.getElementById('js-editor').value,
                lastSaved: new Date().toISOString()
            };
            
            localStorage.setItem('cipherstudio-code', JSON.stringify(codeData));
            updateStatus('Code saved to browser storage');
            addConsoleLog('info', 'Code saved successfully');
        }

        // Load code
        function loadCode() {
            const saved = localStorage.getItem('cipherstudio-code');
            if (saved) {
                const codeData = JSON.parse(saved);
                document.getElementById('html-editor').value = codeData.html;
                document.getElementById('css-editor').value = codeData.css;
                document.getElementById('js-editor').value = codeData.js;
                
                updateLineNumbers('html');
                updateLineNumbers('css');
                updateLineNumbers('js');
                
                updateStatus('Code loaded from browser storage');
                addConsoleLog('info', 'Code loaded successfully');
                runCode();
            }
        }

        // Update status
        function updateStatus(message) {
            document.getElementById('status-message').textContent = message;
        }

        // Run the code
        function runCode() {
            if (isRunning) return;
            
            isRunning = true;
            const runButton = document.querySelector('.run-button');
            const originalText = runButton.textContent;
            runButton.textContent = '🔄 Running...';
            runButton.disabled = true;
            
            try {
                const htmlCode = document.getElementById('html-editor').value;
                const cssCode = document.getElementById('css-editor').value;
                const jsCode = document.getElementById('js-editor').value;
                
                const previewFrame = document.getElementById('preview-frame');
                const previewDocument = previewFrame.contentDocument || previewFrame.contentWindow.document;
                
                // Clear console
                clearConsole();
                addConsoleLog('info', 'Running code...');
                
                const fullCode = \`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>CipherStudio App</title>
                        <style>
                            /* Basic reset */
                            * { margin: 0; padding: 0; box-sizing: border-box; }
                            \${cssCode}
                        </style>
                    </head>
                    <body>
                        \${htmlCode}
                        <script>
                            // Enhanced console redirection
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
                                            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
                                        ).join(' '),
                                        timestamp: new Date().toISOString()
                                    }, '*');
                                } catch (e) {}
                            }

                            console.log = function(...args) {
                                originalConsole.log.apply(console, args);
                                sendToParent('log', args);
                            };

                            console.error = function(...args) {
                                originalConsole.error.apply(console, args);
                                sendToParent('error', args);
                            };

                            console.warn = function(...args) {
                                originalConsole.warn.apply(console, args);
                                sendToParent('warn', args);
                            };

                            console.info = function(...args) {
                                originalConsole.info.apply(console, args);
                                sendToParent('info', args);
                            };

                            // Error handling
                            window.addEventListener('error', function(e) {
                                console.error('Runtime error:', e.error);
                            });

                            \${jsCode}
                        <\\/script>
                    </body>
                    </html>
                \`;
                
                previewDocument.open();
                previewDocument.write(fullCode);
                previewDocument.close();
                
                // Show console by default when there might be output
                if (!consoleVisible) {
                    toggleConsole();
                }
                
                updateStatus('Code executed successfully');
                addConsoleLog('info', 'Code executed successfully');
                
            } catch (error) {
                console.error('Error running code:', error);
                updateStatus('Error: ' + error.message);
                addConsoleLog('error', 'Error running code: ' + error.message);
            } finally {
                // Reset button after a short delay
                setTimeout(() => {
                    runButton.textContent = originalText;
                    runButton.disabled = false;
                    isRunning = false;
                }, 500);
            }
        }

        // Listen for console messages from iframe
        window.addEventListener('message', function(event) {
            if (event.data && event.data.type) {
                const type = event.data.type.toLowerCase().replace('console_', '');
                const message = event.data.data || 'No message';
                addConsoleLog(type, message);
            }
        });

        // Create new file (placeholder)
        function createNewFile() {
            const fileName = prompt('Enter file name (e.g., newfile.js):');
            if (fileName) {
                addConsoleLog('info', \`New file "\${fileName}" would be created here!\`);
                // Implementation would add new tab and editor
            }
        }

        // Create new folder (placeholder)
        function createNewFolder() {
            const folderName = prompt('Enter folder name:');
            if (folderName) {
                addConsoleLog('info', \`New folder "\${folderName}" would be created here!\`);
                // Implementation would add folder to file tree
            }
        }

        // Auto-save functionality
        function setupAutoSave() {
            let saveTimeout;
            document.querySelectorAll('.editor').forEach(editor => {
                editor.addEventListener('input', function() {
                    clearTimeout(saveTimeout);
                    saveTimeout = setTimeout(() => {
                        updateStatus('Auto-saved');
                        setTimeout(() => {
                            updateStatus('Ready');
                        }, 2000);
                    }, 2000);
                });
            });
        }

        // Initialize when page loads
        window.addEventListener('DOMContentLoaded', function() {
            initializeIDE();
            setupAutoSave();
            
            // Try to load saved code
            loadCode();
        });
    </script>
</body>
</html>`;

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Simple Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <span className="text-white text-xl">💻</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">CipherStudio</h1>
            <p className="text-xs text-gray-400">Standalone HTML/CSS/JS IDE</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBackToDashboard}
            className="px-4 py-2 text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {/* Standalone IDE Container - Using iframe instead of innerHTML */}
      <div className="flex-1" style={{ height: 'calc(100vh - 80px)' }}>
        {isInitialized ? (
          <iframe
            ref={iframeRef}
            srcDoc={standaloneIDEHTML}
            title="CipherStudio Standalone IDE"
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-white">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p>Loading Standalone IDE...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StandaloneIDE;