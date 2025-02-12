function updateOutput(code) {
    clearConsole();
    const previewContainer = document.getElementById('preview-container');
    previewContainer.innerHTML = "";
    const iframe = document.createElement('iframe');
    iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");
    previewContainer.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    const wrappedCode = `
    <html>
      <head>
        <style>
          body { background-color: #1e1e1e; color: #d4d4d4; margin: 0; font-family: Consolas, monospace; }
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
              parent.addConsole("log: " + args.join(" "));
            };
            console.error = function(...args){
              nativeConsoleError.apply(console, args);
              parent.addConsole("error: " + args.join(" "));
            };
            window.alert = function(...args){
              parent.addConsole("alert: " + args.join(" "));
              return nativeAlert.apply(window, args);
            };
            window.alert.toString = function(){ return "alert\\nfunction alert()"; };
            window.onerror = function(msg, url, lineNo, columnNo, error){
              parent.addConsole("error: " + msg + " (" + lineNo + ":" + columnNo + ")");
            };
          })();
        <\/script>
        ${code}
      </body>
    </html>
  `;
    iframeDoc.open();
    iframeDoc.write(wrappedCode);
    iframeDoc.close();
}

function clearConsole() {
    document.getElementById('console').innerHTML = "";
}

function addConsole(message) {
    const consoleDiv = document.getElementById('console');
    const msgEl = document.createElement('div');
    msgEl.textContent = message;
    consoleDiv.appendChild(msgEl);
    consoleDiv.scrollTop = consoleDiv.scrollHeight;
}

window.addConsole = addConsole;
