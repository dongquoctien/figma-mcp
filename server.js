const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Configuration
const PORT = process.env.PORT || 6969;
const TARGET_URL = process.env.TARGET_URL || 'http://127.0.0.1:3845';

// Enable CORS for all origins
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Cache-Control']
}));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    target: TARGET_URL,
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// Configure proxy middleware for MCP
const proxyOptions = {
  target: TARGET_URL,
  changeOrigin: true,
  ws: true, // Enable WebSocket proxying
  logLevel: 'debug',
  
  // Preserve headers
  onProxyReq: (proxyReq, req, res) => {
    console.log(`Proxying ${req.method} ${req.path} -> ${TARGET_URL}${req.path}`);
    
    // Preserve important headers
    if (req.headers['content-type']) {
      proxyReq.setHeader('Content-Type', req.headers['content-type']);
    }
    if (req.headers['accept']) {
      proxyReq.setHeader('Accept', req.headers['accept']);
    }
  },
  
  // Handle streaming responses (important for SSE/MCP)
  onProxyRes: (proxyRes, req, res) => {
    // Don't buffer streaming responses
    proxyRes.headers['X-Proxied-By'] = 'Figma-MCP-Proxy';
    
    console.log(`Response from target: ${proxyRes.statusCode}`);
  },
  
  // Error handling
  onError: (err, req, res) => {
    console.error('Proxy Error:', err.message);
    res.status(500).json({
      error: 'Proxy Error',
      message: err.message,
      target: TARGET_URL
    });
  }
};

// Apply proxy middleware to all routes
app.use('/', createProxyMiddleware(proxyOptions));

// Start the server
const server = app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('Figma MCP Reverse Proxy Server Started');
  console.log('='.repeat(60));
  console.log(`Local:            http://localhost:${PORT}`);
  console.log(`Network:          http://0.0.0.0:${PORT}`);
  console.log(`Target MCP:       ${TARGET_URL}`);
  console.log('='.repeat(60));
  console.log('Ready to accept MCP connections from Cursor, VSCode, Claude, etc.');
  console.log('Press Ctrl+C to stop the server');
  console.log('='.repeat(60));
});

// Handle WebSocket upgrades
server.on('upgrade', (req, socket, head) => {
  console.log(`WebSocket upgrade request: ${req.url}`);
  proxyOptions.ws = true;
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nReceived SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

