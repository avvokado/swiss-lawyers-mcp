# Hostinger Deployment Notes

Minimal deployment target for `swiss-lawyers-mcp by avvokado.ch`.

Target host:
- `mcp.avvokado.ch`

Recommended Hostinger app settings:
- Node.js version: `20+`
- Install command: `npm install`
- Build command: `npm run build`
- Start command: `npm start`

Recommended environment variables:

```env
HOST=127.0.0.1
PORT=8080
MCP_SERVER_NAME=swiss-lawyers-mcp by avvokado.ch
MCP_SERVER_VERSION=0.1.0
DEFAULT_RESULT_LIMIT=5
MAX_RESULT_LIMIT=10
```

Reverse proxy:
- Point `mcp.avvokado.ch` to the Node.js app.
- Forward requests to the internal app port.
- Expose the MCP endpoint at `/mcp`.
- Keep `/health` available for uptime checks.
- Apply rate limiting at the reverse proxy or platform edge.

Smoke check after deploy:

```text
GET  https://mcp.avvokado.ch/health
POST https://mcp.avvokado.ch/mcp
```

Expected public MCP base URL:

```text
https://mcp.avvokado.ch/mcp
```
