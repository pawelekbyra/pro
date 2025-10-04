const OFFLINE_PAGE_HTML = `
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Jesteś offline</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #121212;
            color: #ffffff;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            text-align: center;
            padding: 20px;
        }
        svg {
            width: 80px;
            height: 80px;
            color: #ffc107;
            margin-bottom: 24px;
        }
        h1 {
            font-size: 24px;
            margin-bottom: 8px;
        }
        p {
            font-size: 16px;
            color: rgba(255, 255, 255, 0.8);
        }
    </style>
</head>
<body>
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
    <h1>Jesteś offline</h1>
    <p>Połącz się z internetem, aby kontynuować korzystanie z Ting Tong.</p>
</body>
</html>
`;

self.addEventListener('fetch', (event) => {
  // We only want to handle navigation requests, not requests for images, scripts, etc.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(OFFLINE_PAGE_HTML, {
          headers: { 'Content-Type': 'text/html' },
        });
      })
    );
  }
});
