import React, { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import './App.css';

function App() {
  const [code, setCode] = useState(`<h1>Hello, World!</h1>
<script>
  console.log('test');
  alert('alerted');
</script>`);
  const [consoleMessages, setConsoleMessages] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const iframeRef = useRef(null);
  const processedMessages = useRef(new Set());

  const updateOutput = (newCode) => {
    setCode(newCode);
    setConsoleMessages([]);
    processedMessages.current.clear();
    
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      
      const wrappedCode = `
        <html>
          <head>
            <style>
              body { 
                background-color: #1e1e1e; 
                color: #d4d4d4; 
                margin: 0; 
                font-family: Consolas, monospace; 
              }
            </style>
          </head>
          <body>
            <script>
              (function(){
                var nativeConsoleLog = console.log;
                var nativeConsoleError = console.error;
                var nativeAlert = window.alert;
                
                console.log = function(...args){
                  nativeConsoleLog.apply(console, args);
                  parent.postMessage({
                    type: 'console',
                    level: 'log',
                    message: args.join(" ")
                  }, '*');
                };
                
                console.error = function(...args){
                  nativeConsoleError.apply(console, args);
                  parent.postMessage({
                    type: 'console',
                    level: 'error',
                    message: args.join(" ")
                  }, '*');
                };
                
                window.alert = function(...args){
                  parent.postMessage({
                    type: 'console',
                    level: 'alert',
                    message: args.join(" ")
                  }, '*');
                  return nativeAlert.apply(window, args);
                };
                
                window.alert.toString = function(){ 
                  return "alert\\nfunction alert()"; 
                };
                
                window.onerror = function(msg, url, lineNo, columnNo, error){
                  parent.postMessage({
                    type: 'console',
                    level: 'error',
                    message: msg + " (" + lineNo + ":" + columnNo + ")"
                  }, '*');
                };
              })();
            </script>
            ${newCode}
          </body>
        </html>
      `;
      
      iframeDoc.open();
      iframeDoc.write(wrappedCode);
      iframeDoc.close();
    }
  };

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'console') {
        const messageKey = `${event.data.level}:${event.data.message}`;
        
        // Проверяем, не обрабатывали ли мы уже это сообщение
        if (!processedMessages.current.has(messageKey)) {
          processedMessages.current.add(messageKey);
          
          setConsoleMessages(prev => [...prev, {
            id: Date.now() + Math.random(),
            level: event.data.level,
            message: event.data.message
          }]);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Инициализация iframe при первом рендере
  useEffect(() => {
    if (iframeRef.current && !isInitialized) {
      updateOutput(code);
      setIsInitialized(true);
    }
  }, [isInitialized]);

  const clearConsole = () => {
    setConsoleMessages([]);
    processedMessages.current.clear();
  };

  const handleEditorChange = (value) => {
    if (isInitialized) {
      updateOutput(value);
    }
  };

  return (
    <div className="App">
      <div className="container">
        <div className="editor-section">
          <Editor
            height="100vh"
            defaultLanguage="html"
            theme="vs-dark"
            value={code}
            onChange={handleEditorChange}
            options={{
              automaticLayout: true,
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              roundedSelection: false,
              scrollBeyondLastLine: false,
              readOnly: false,
              cursorStyle: 'line',
              automaticLayout: true,
            }}
          />
        </div>
        
        <div className="output-section">
          <div className="preview-container">
            <iframe
              ref={iframeRef}
              title="preview"
              sandbox="allow-scripts allow-same-origin"
              className="preview-iframe"
            />
          </div>
          
          <div className="console-container">
            <div className="console-header">
              <h3>Console</h3>
              <button onClick={clearConsole} className="clear-btn">
                Clear
              </button>
            </div>
            <div className="console-messages">
              {consoleMessages.map((msg) => (
                <div key={msg.id} className={`console-message console-${msg.level}`}>
                  <span className="message-level">{msg.level}:</span>
                  <span className="message-text">{msg.message}</span>
                </div>
              ))}
              {consoleMessages.length === 0 && (
                <div className="console-empty">No console output yet</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App; 