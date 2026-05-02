# Launch Checklist

Minimal checklist for the public MCP launch of `swiss-lawyers-mcp by avvokado.ch`.

## Public URLs

- MCP URL: `https://mcp.avvokado.ch/mcp`
- Health URL: `https://mcp.avvokado.ch/health`
- Public repo: `https://github.com/avvokado/swiss-lawyers-mcp`

## Runtime

- Build command: `npm run build`
- Start command: `npm start`
- Node.js: `20+`

## Environment

- `HOST=0.0.0.0`
- `PORT=8080`
- `MCP_SERVER_NAME=swiss-lawyers-mcp by avvokado.ch`
- `MCP_SERVER_VERSION=0.1.0`
- `DEFAULT_RESULT_LIMIT=5`
- `MAX_RESULT_LIMIT=10`

## Smoke Tests

```bash
curl https://mcp.avvokado.ch/health
```

```bash
npm run build
MCP_URL=https://mcp.avvokado.ch/mcp node dist/scripts/http-smoke.js
```

## Minimum Operations Check

- `/health` returns `200`
- `find_lawyer` returns structured results
- `get_lawyer_profile` returns a profile
- invalid input returns `INVALID_INPUT`
