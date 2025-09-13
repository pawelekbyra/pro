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

    const manifestText = await fetchResponse.text();
    const manifestBaseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);

    const rewrittenManifest = manifestText.split('\n').map(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        // This line is a URL. It could be for a segment (.ts) or another manifest (.m3u8).
        let absoluteUrl;
        if (line.startsWith('http')) {
          // It's already an absolute URL.
          absoluteUrl = line;
        } else {
          // It's a relative URL, resolve it against the manifest's base URL.
          absoluteUrl = new URL(line, manifestBaseUrl).href;
        }
        // Rewrite the URL to point back to our proxy.
        return `/api/proxy?url=${encodeURIComponent(absoluteUrl)}`;
      }
      // If it's a comment or empty line, return it as is.
      return line;
    }).join('\n');

    // Set CORS and Content-Type headers.
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Content-Type', fetchResponse.headers.get('content-type') || 'application/vnd.apple.mpegurl');

    // Send the rewritten manifest text as the response.
    return response.status(200).send(rewrittenManifest);

  } catch (error) {
    console.error('Proxy Error:', error);
    return response.status(500).send(`Proxy Error: ${error.message}`);
  }
};
