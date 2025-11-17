const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();

// Parse cookies for session management
app.use(cookieParser());

// Configuration
const PORT = process.env.PORT || 6969;
const TARGET_URL = process.env.TARGET_URL || 'http://127.0.0.1:3845';

// Enable CORS for all origins with full header support
app.use(cors({
  origin: true, // Allow all origins with credentials
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: ['*'], // Allow all headers
  exposedHeaders: ['*']
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

// Configure proxy middleware for MCP with full session support
const proxyOptions = {
  target: TARGET_URL,
  changeOrigin: false, // Keep original host for session management
  ws: true, // Enable WebSocket proxying
  logLevel: 'debug',
  secure: false,
  autoRewrite: true,
  preserveHeaderKeyCase: true,
  
  // Preserve ALL headers and cookies for session management
  onProxyReq: (proxyReq, req, res) => {
    console.log(`Proxying ${req.method} ${req.path} -> ${TARGET_URL}${req.path}`);
    
    // Forward all original headers
    Object.keys(req.headers).forEach(key => {
      if (key.toLowerCase() !== 'host') {
        proxyReq.setHeader(key, req.headers[key]);
      }
    });
    
    // Ensure cookies are forwarded
    if (req.headers.cookie) {
      proxyReq.setHeader('Cookie', req.headers.cookie);
    }
    
    console.log('  Headers:', JSON.stringify(req.headers, null, 2));
  },
  
  // Handle streaming responses and preserve all response headers
  onProxyRes: (proxyRes, req, res) => {
    console.log(`Response from target: ${proxyRes.statusCode}`);
    
    // Forward all response headers including Set-Cookie
    Object.keys(proxyRes.headers).forEach(key => {
      res.setHeader(key, proxyRes.headers[key]);
    });
    
    // Add proxy identifier
    res.setHeader('X-Proxied-By', 'Figma-MCP-Proxy');
    
    console.log('  Response Headers:', JSON.stringify(proxyRes.headers, null, 2));
  },
  
  // Error handling
  onError: (err, req, res) => {
    console.error('Proxy Error:', err.message);
    console.error('Stack:', err.stack);
    
    if (!res.headersSent) {
      res.status(502).json({
        error: 'Proxy Error',
        message: err.message,
        target: TARGET_URL,
        hint: 'Make sure Figma MCP server is running at ' + TARGET_URL
      });
    }
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

