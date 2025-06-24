import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Эта страница будет перенаправлять пользователя обратно в приложение
  // с токеном в URL-фрагменте
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Contentful Authentication</title>
      <script>
        // Извлекаем токен из URL-фрагмента
        function getTokenFromHash() {
          // URL будет иметь формат #access_token=TOKEN&token_type=Bearer
          const hash = window.location.hash.substring(1);
          console.log('Hash fragment:', hash);
          
          // Разбираем хэш-фрагмент
          const params = new URLSearchParams(hash);
          const token = params.get('access_token');
          
          console.log('Extracted token:', token ? 'Found (hidden for security)' : 'Not found');
          return token;
        }
        
        // Отправляем токен обратно в основное приложение
        window.onload = function() {
          try {
            // Добавляем отладочную информацию
            console.log('Callback page loaded');
            console.log('URL:', window.location.href);
            console.log('Hash:', window.location.hash);
            
            const token = getTokenFromHash();
            console.log('Token received:', token ? 'Yes (hidden for security)' : 'No');
            
            if (token) {
              // Отправляем сообщение родительскому окну
              if (window.opener && !window.opener.closed) {
                try {
                  console.log('Sending message to opener');
                  window.opener.postMessage({ type: 'CONTENTFUL_AUTH_SUCCESS', token }, '*');
                  document.getElementById('message').innerText = 'Authentication successful! You can close this window.';
                  
                  // Закрываем окно через 2 секунды
                  setTimeout(() => {
                    try {
                      window.close();
                    } catch (e) {
                      console.error('Could not close window:', e);
                    }
                  }, 2000);
                } catch (err) {
                  console.error('Error posting message to opener:', err);
                  // Если не удалось отправить сообщение, перенаправляем на главную
                  document.getElementById('message').innerText = 'Authentication successful, but could not communicate with main window. Redirecting...';
                  setTimeout(() => {
                    window.location.href = '/?token=' + encodeURIComponent(token);
                  }, 2000);
                }
              } else {
                console.log('No opener found or opener closed, redirecting');
                // Если нет родительского окна, перенаправляем на главную
                document.getElementById('message').innerText = 'Authentication successful! Redirecting to main page...';
                setTimeout(() => {
                  window.location.href = '/?token=' + encodeURIComponent(token);
                }, 1000);
              }
            } else {
              // Проверяем, есть ли ошибка в URL
              const errorMsg = new URLSearchParams(window.location.search).get('error_description') || 
                              new URLSearchParams(window.location.hash.substring(1)).get('error_description') ||
                              'No token received';
              
              console.error('Authentication failed:', errorMsg);
              document.getElementById('message').innerText = 'Authentication failed: ' + errorMsg;
            }
          } catch (err) {
            console.error('Error in callback processing:', err);
            document.getElementById('message').innerText = 'An error occurred while processing authentication: ' + (err instanceof Error ? err.message : String(err));
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