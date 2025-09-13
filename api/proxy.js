const { Readable } = require('stream');

module.exports = async (request, response) => {
  const targetUrl = request.query.url;

  if (!targetUrl) {
    return response.status(400).send('Error: "url" query parameter is required.');
  }

  // Handle OPTIONS preflight request for CORS
  if (request.method === 'OPTIONS') {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    return response.status(200).end();
  }

  try {
    const fetchResponse = await fetch(targetUrl, {
      headers: { 'User-Agent': 'TingTongVercelProxy/1.0' },
      redirect: 'follow'
    });

    if (!fetchResponse.ok) {
      const errorText = await fetchResponse.text();
      return response.status(fetchResponse.status).send(`Error from target server: ${errorText}`);
    }

    // Set CORS headers for all successful responses.
    response.setHeader('Access-Control-Allow-Origin', '*');

    const contentType = fetchResponse.headers.get('content-type') || '';

    // Check if the content is an HLS manifest.
    if (contentType.includes('application/vnd.apple.mpegurl') || contentType.includes('application/x-mpegurl')) {
      // It's a manifest file, so we need to read it as text and rewrite URLs.
      const manifestText = await fetchResponse.text();
      const manifestBaseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);

      const rewrittenManifest = manifestText.split('\n').map(line => {
        line = line.trim();
        if (line && !line.startsWith('#')) {
          let absoluteUrl;
          if (line.startsWith('http')) {
            absoluteUrl = line;
          } else {
            absoluteUrl = new URL(line, manifestBaseUrl).href;
          }
          return `/api/proxy?url=${encodeURIComponent(absoluteUrl)}`;
        }
        return line;
      }).join('\n');

      response.setHeader('Content-Type', contentType);
      return response.status(200).send(rewrittenManifest);

    } else {
      // It's a video segment (.ts) or another binary file. Stream it directly.
      // Forward all headers from the target response.
      fetchResponse.headers.forEach((value, name) => {
        if (name.toLowerCase() !== 'access-control-allow-origin') {
          response.setHeader(name, value);
        }
      });

      // Convert the Web Stream to a Node.js Stream and pipe it.
      const bodyStream = fetchResponse.body;
      Readable.fromWeb(bodyStream).pipe(response);
    }

  } catch (error) {
    console.error('Proxy Error:', error);
    return response.status(500).send(`Proxy Error: ${error.message}`);
  }
};
