import type { NextApiRequest, NextApiResponse } from 'next';

const CLOSE_WINDOW_DELAY = 2000;
const REDIRECT_DELAY = 2000;
const FALLBACK_REDIRECT_DELAY = 1000;

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Contentful Authentication</title>
      <script>
        const CLOSE_WINDOW_DELAY = ${CLOSE_WINDOW_DELAY};
        const REDIRECT_DELAY = ${REDIRECT_DELAY};
        const FALLBACK_REDIRECT_DELAY = ${FALLBACK_REDIRECT_DELAY};
        
        function getTokenFromHash() {
          const hash = window.location.hash.substring(1);
          const params = new URLSearchParams(hash);
          return params.get('access_token');
        }
        
        function getErrorMessage() {
          const searchParams = new URLSearchParams(window.location.search);
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          return searchParams.get('error_description') || 
                 hashParams.get('error_description') ||
                 'No token received';
        }
        
        function closeWindow() {
          try {
            window.close();
          } catch (e) {
          }
        }
        
        function redirectWithToken(token) {
          window.location.href = '/?token=' + encodeURIComponent(token);
        }
        
        function updateMessage(text) {
          const messageEl = document.getElementById('message');
          if (messageEl) {
            messageEl.innerText = text;
          }
        }
        
        window.onload = function() {
          try {
            const token = getTokenFromHash();
            
            if (token) {
              if (window.opener && !window.opener.closed) {
                try {
                  window.opener.postMessage({ type: 'CONTENTFUL_AUTH_SUCCESS', token }, '*');
                  updateMessage('Authentication successful! You can close this window.');
                  setTimeout(closeWindow, CLOSE_WINDOW_DELAY);
                } catch (err) {
                  updateMessage('Authentication successful, but could not communicate with main window. Redirecting...');
                  setTimeout(() => redirectWithToken(token), REDIRECT_DELAY);
                }
              } else {
                updateMessage('Authentication successful! Redirecting to main page...');
                setTimeout(() => redirectWithToken(token), FALLBACK_REDIRECT_DELAY);
              }
            } else {
              const errorMsg = getErrorMessage();
              updateMessage('Authentication failed: ' + errorMsg);
            }
          } catch (err) {
            const errorText = err instanceof Error ? err.message : String(err);
            updateMessage('An error occurred while processing authentication: ' + errorText);
          }
        };
      </script>
      <style>
        body {
          font-family: Arial, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          background-color: #f5f5f5;
        }
        .container {
          text-align: center;
          padding: 2rem;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Contentful Authentication</h2>
        <p id="message">Processing authentication...</p>
        <p>This window should close automatically. If it doesn't, you can close it manually.</p>
      </div>
    </body>
    </html>
  `;
  
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
} 