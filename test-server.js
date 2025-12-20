// Serveur HTTP simple pour tester la connectivité MetaTrader
const http = require('http');

const server = http.createServer((req, res) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);

  let body = '';
  req.on('data', (chunk) => {
    body += chunk.toString();
  });

  req.on('end', () => {
    if (body) {
      console.log('Body:', body);
    }

    // Réponse CORS
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });

    res.end(
      JSON.stringify({
        status: 'ok',
        message: 'Serveur de test accessible',
        method: req.method,
        url: req.url,
        timestamp: new Date().toISOString()
      })
    );
  });
});

const PORT = 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Serveur de test démarré sur http://0.0.0.0:${PORT}`);
  console.log(`   Testez avec: http://127.0.0.1:${PORT}/test`);
  console.log(`   Ou: http://localhost:${PORT}/test`);
});
