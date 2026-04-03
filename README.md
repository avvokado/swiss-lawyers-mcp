# swiss-lawyers-mcp by avvokado.ch

The public MCP for Swiss lawyer discovery, built for AI assistants, marketing-driven discovery flows, directory integrations, and partner ecosystems.

`swiss-lawyers-mcp by avvokado.ch` helps AI systems find relevant lawyers in Switzerland through a simple, read-only MCP interface. Instead of relying on inconsistent web search results, clients can access structured lawyer profiles, specialties, locations, and languages through a public endpoint designed for discoverability and business use.

[Visit avvokado.ch](https://avvokado.ch)  
[Explore the public repo](https://github.com/avvokado/swiss-lawyers-mcp)  
[Open the live MCP endpoint](https://mcp.avvokado.ch/mcp)

## Warum das relevant ist

AI discovery is becoming a real acquisition and visibility channel. If law firms, legal directories, and partner platforms want to be found by AI assistants, they need a structured interface instead of hoping that generic search results happen to work.

`swiss-lawyers-mcp by avvokado.ch` is built to make Swiss lawyer discovery easier for:
- AI assistants
- discovery connectors
- legal directories
- partner ecosystems
- marketing and growth teams that want better visibility in AI-driven journeys

It gives clients a clear way to search by natural language, location, specialty, and language, while keeping the product surface intentionally simple.

## Für wen das ist

This repository is especially relevant for:
- marketers who want better AI discoverability for legal services
- platform and partnership teams building discovery integrations
- growth teams evaluating AI search visibility in Switzerland
- technical integrators who need a lightweight, read-only MCP endpoint

If your goal is Swiss legal discovery for AI assistants, referral flows, partner platforms, or structured lawyer search, this is the right product surface.

## Was das Produkt konkret liefert

`swiss-lawyers-mcp by avvokado.ch` exposes exactly two public tools:

### `find_lawyer`

The main discovery tool. It allows AI systems to find lawyers in Switzerland using natural language plus optional filters.

Business value:
- better matching for lawyer discovery
- cleaner AI assistant responses
- stronger visibility for structured legal profiles

### `get_lawyer_profile`

The detail tool. It loads the fuller profile for a specific lawyer after discovery.

Business value:
- richer legal profile retrieval
- cleaner follow-up responses from AI assistants
- better handoff from search result to profile detail

Technically, the product supports MCP over HTTP and stdio and is intentionally read-only.

## Business Use Cases

Typical use cases include:
- AI assistant lawyer discovery in Switzerland
- legal directory augmentation
- referral and partner discovery
- Swiss market visibility for structured legal profiles
- AI-ready legal search for websites, assistants, and partner tools

This is not a generic legal CRM or lead-routing product. It is a focused discovery layer for Swiss lawyer search and profile retrieval.

## Warum avvokado.ch

[avvokado.ch](https://avvokado.ch) stands behind this public MCP product and the broader Swiss legal directory vision around discoverability, structured profiles, and AI-ready distribution.

If you want to understand the broader context, evaluate a partnership angle, or review the business-facing positioning, start here:
- [avvokado.ch](https://avvokado.ch)
- [Public MCP repository](https://github.com/avvokado/swiss-lawyers-mcp)
- [Live MCP endpoint](https://mcp.avvokado.ch/mcp)

## Live Access

Public MCP URL:

```text
https://mcp.avvokado.ch/mcp
```

Health URL:

```text
https://mcp.avvokado.ch/health
```

Public repository:

```text
https://github.com/avvokado/swiss-lawyers-mcp
```

## Quick Start for Integrators

Prerequisites:
- Node.js 20+
- npm 10+

Setup:

```bash
git clone https://github.com/avvokado/swiss-lawyers-mcp.git
cd swiss-lawyers-mcp
copy .env.example .env
npm install
```

Local HTTP start:

```bash
npm run dev
```

Local MCP endpoint:

```text
http://127.0.0.1:8080/mcp
```

Local health endpoint:

```text
http://127.0.0.1:8080/health
```

Production-style start:

```bash
npm run build
npm start
```

stdio start:

```bash
npm run dev:stdio
```

For production usage, run behind a reverse proxy with rate limiting.

## Tool Reference

### `find_lawyer`

Primary discovery tool for Swiss lawyers.

Input:
- `query?: string`
- `location?: string`
- `specialty?: string`
- `language?: string`
- `limit?: number`

Output:
- `results`
- `total_results`
- `search_strategy`
- `applied_filters`
- `suggestions?`
- `source`

Example:

```json
{
  "name": "find_lawyer",
  "arguments": {
    "query": "employment zurich english",
    "limit": 3
  }
}
```

### `get_lawyer_profile`

Detail tool for a specific discovery result.

Input:
- `lawyer_id: string`

Output:
- `profile`
- `source`

Example:

```json
{
  "name": "get_lawyer_profile",
  "arguments": {
    "lawyer_id": "lawyer-zh-luca-keller"
  }
}
```

More technical examples:
- [Response examples](./docs/examples.md)
- [Launch checklist](./docs/launch-checklist.md)

## Operational Confidence

Minimum public operations check:
- `https://mcp.avvokado.ch/health` returns `200`
- `find_lawyer` returns structured results
- `get_lawyer_profile` returns a profile
- invalid input returns stable `INVALID_INPUT`

Live smoke command:

```bash
npm run build
MCP_URL=https://mcp.avvokado.ch/mcp node dist/scripts/http-smoke.js
```

Automated tests:

```bash
npm test
```

## Language Coverage

### Français

`swiss-lawyers-mcp by avvokado.ch` est un MCP public pour la découverte d'avocats en Suisse via des assistants IA et des intégrations de recherche structurée. Il permet de rechercher des profils d'avocats par requête libre, localisation, spécialité et langue.

[Découvrir avvokado.ch](https://avvokado.ch)

### Italiano

`swiss-lawyers-mcp by avvokado.ch` è un MCP pubblico per la scoperta di avvocati in Svizzera tramite assistenti AI e integrazioni di ricerca strutturata. Consente di trovare profili legali tramite query libera, località, specializzazione e lingua.

[Scopri avvokado.ch](https://avvokado.ch)

### English

`swiss-lawyers-mcp by avvokado.ch` is a public MCP for lawyer discovery in Switzerland. It is designed for AI assistants, directory integrations, and structured legal profile retrieval across specialties, locations, and languages.

[Visit avvokado.ch](https://avvokado.ch)

## About / Contact / CTA

If you want to evaluate Swiss lawyer discovery for AI assistants, legal marketing visibility, partner integrations, or structured legal search, start with:

- [avvokado.ch](https://avvokado.ch)
- [Public MCP repo](https://github.com/avvokado/swiss-lawyers-mcp)
- [Live MCP endpoint](https://mcp.avvokado.ch/mcp)
- [Health endpoint](https://mcp.avvokado.ch/health)

`swiss-lawyers-mcp` is the public product repository for distribution, documentation, and integrations. Internal source systems, private provider adapters, and internal operations remain separate from this public repo.
