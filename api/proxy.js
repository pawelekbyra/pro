module.exports = async (request, response) => {
  const targetUrl = request.query.url;

  if (!targetUrl) {
    return response.status(400).send('Error: "url" query parameter is required.');
  }

  // Preflight-Anfrage für CORS abhandeln
  if (request.method === 'OPTIONS') {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    return response.status(200).end();
  }

  try {
    const fetchResponse = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'TingTongVercelProxy/1.0',
      },
      redirect: 'follow' // HLS-Manifeste können Weiterleitungen enthalten
    });

    if (!fetchResponse.ok) {
      // Den Fehlertext vom Zielserver an den Client weiterleiten
      const errorText = await fetchResponse.text();
      return response.status(fetchResponse.status).send(`Error from target server: ${errorText}`);
    }

    // Setze die CORS-Header für die eigentliche Antwort
    response.setHeader('Access-Control-Allow-Origin', '*');

    // Leite die Header vom Zielserver an den Client weiter
    // Wichtig für Content-Type, Content-Length etc.
    fetchResponse.headers.forEach((value, name) => {
      // Überschreibe den CORS-Header nicht, falls er vom Zielserver kommt
      if (name.toLowerCase() !== 'access-control-allow-origin') {
        response.setHeader(name, value);
      }
    });

    // Leite den Body als Stream weiter
    // PATCH: Konvertiere den Web-Stream (von fetch) in einen Node.js-Stream, um ihn korrekt an die Antwort zu pipen.
    // Die direkte Verwendung von .pipe() ist bei Web-Streams nicht mit Node-Server-Antworten kompatibel.
    const { Readable } = require('stream');
    const bodyStream = fetchResponse.body;
    Readable.fromWeb(bodyStream).pipe(response);

  } catch (error) {
    console.error('Proxy-Fehler:', error);
    response.status(500).send(`Proxy Error: ${error.message}`);
  }
};
