const http = require('http');
const https = require('https');

// Render backend health endpoint URL
const RENDER_URL = process.env.RENDER_BACKEND_URL || 'https://tulsi-mart-backend.onrender.com/api/health/light';
const INTERVAL_MS = (parseInt(process.env.PING_INTERVAL, 10) || 60) * 1000; // Default 60 seconds

function pingServer() {
  const client = RENDER_URL.startsWith('https') ? https : http;
  const startTime = Date.now();

  const req = client.get(RENDER_URL, (res) => {
    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] PING SUCCESS: Status ${res.statusCode} (${duration}ms)`);
  });

  req.on('error', (err) => {
    console.error(`[${new Date().toISOString()}] PING FAILED: ${err.message}`);
  });

  req.setTimeout(10000, () => {
    req.destroy();
    console.error(`[${new Date().toISOString()}] PING TIMEOUT after 10s`);
  });
}

console.log('====================================================');
console.log('🚀 Tulsi Mart Keep-Alive Auto-Ping Service Started');
console.log(`Target URL  : ${RENDER_URL}`);
console.log(`Interval    : Every ${INTERVAL_MS / 1000} seconds`);
console.log('====================================================');

// Initial Ping & Schedule interval
pingServer();
setInterval(pingServer, INTERVAL_MS);
