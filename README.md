# Figma MCP Reverse Proxy

A Node.js reverse proxy server that enables multiple clients (Cursor, VSCode, Claude Desktop, etc.) to connect to a shared Figma MCP endpoint.

## Overview

This proxy server acts as a bridge between MCP clients and the local Figma MCP server, allowing you to:
- Share your Figma MCP connection with team members
- Connect multiple MCP clients to the same Figma instance
- Access Figma MCP from any device on your network

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Figma MCP server running on `http://127.0.0.1:3845/mcp`

## Installation

1. Clone or download this repository

2. Install dependencies:
```bash
npm install
```

3. (Optional) Create a `.env` file to customize configuration:
```bash
PORT=6969
TARGET_URL=http://127.0.0.1:3845
```

## Usage

### Start the Proxy Server

```bash
npm start
```

You should see output like:
```
============================================================
Figma MCP Reverse Proxy Server Started
============================================================
Local:            http://localhost:6969
Network:          http://0.0.0.0:6969
Target MCP:       http://127.0.0.1:3845
============================================================
Ready to accept MCP connections from Cursor, VSCode, Claude, etc.
Press Ctrl+C to stop the server
============================================================
```

### Check Server Health

Visit `http://localhost:6969/health` to verify the server is running.

## Connecting MCP Clients

### Cursor

1. Open Cursor Settings
2. Navigate to "Composer" or "MCP Settings"
3. Add a new MCP server configuration:

```json
{
  "mcpServers": {
    "figma": {
      "url": "http://localhost:6969/mcp"
    }
  }
}
```

If connecting from another machine on the network, replace `localhost` with your machine's IP address:
```json
{
  "mcpServers": {
    "figma": {
      "url": "http://192.168.1.100:6969/mcp"
    }
  }
}
```

### Visual Studio Code

1. Install the MCP extension
2. Open VSCode settings (`.vscode/settings.json` or global settings)
3. Add the MCP server:

```json
{
  "mcp.servers": {
    "figma": {
      "url": "http://localhost:6969/mcp"
    }
  }
}
```

### Claude Desktop

1. Open Claude Desktop configuration file:
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Linux: `~/.config/Claude/claude_desktop_config.json`

2. Add the Figma MCP server:

```json
{
  "mcpServers": {
    "figma": {
      "url": "http://localhost:6969/mcp"
    }
  }
}
```

3. Restart Claude Desktop

## Configuration

The proxy server can be configured via environment variables or a `.env` file:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `6969` | Port for the proxy server to listen on |
| `TARGET_URL` | `http://127.0.0.1:3845` | URL of the Figma MCP server |

## Network Access

### Local Network Sharing

To allow other devices on your local network to connect:

1. Find your machine's local IP address:
   - Windows: `ipconfig`
   - macOS/Linux: `ifconfig` or `ip addr`

2. Make sure your firewall allows incoming connections on port 6969

3. Share the URL with your team: `http://YOUR_IP:6969/mcp`

### Public Internet Sharing (Advanced)

To share over the internet, you'll need one of these solutions:

1. **Port Forwarding**: Configure your router to forward port 6969 to your machine
2. **Tunneling Service**: Use ngrok, Cloudflare Tunnel, or similar
3. **VPN**: Set up a VPN for secure team access

⚠️ **Security Warning**: This proxy has no authentication. Only use it in trusted networks or add authentication if exposing to the internet.

## Troubleshooting

### Connection Refused

- Verify the Figma MCP server is running on `http://127.0.0.1:3845`
- Check if port 6969 is already in use: Change the `PORT` in `.env`

### MCP Client Can't Connect

- Verify the proxy server is running
- Check firewall settings
- Ensure the URL is correct (use IP address for network sharing)
- Look at proxy server logs for error messages

### 502 Bad Gateway

- The Figma MCP server at `http://127.0.0.1:3845` is not responding
- Verify the Figma MCP is running and accessible

### WebSocket Connection Issues

- Some MCP features use WebSockets, which are supported by this proxy
- Check if your network/firewall allows WebSocket connections

## Features

- ✅ Full MCP protocol support
- ✅ Server-Sent Events (SSE) streaming
- ✅ WebSocket support
- ✅ CORS enabled for all origins
- ✅ Request/response logging
- ✅ Health check endpoint
- ✅ Graceful shutdown
- ✅ Zero authentication (open access)

## Technical Details

The proxy uses:
- **Express.js** - Web server framework
- **http-proxy-middleware** - Reverse proxy functionality
- **CORS** - Cross-origin resource sharing
- Supports MCP's Server-Sent Events (SSE) for streaming responses
- WebSocket upgrade support for real-time features

## License

MIT

## Support

If you encounter issues:
1. Check the proxy server logs for errors
2. Verify the Figma MCP server is accessible at `http://127.0.0.1:3845`
3. Test the health endpoint: `http://localhost:6969/health`
