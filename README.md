# swiss-lawyers-mcp by avvokado.ch

Ein leichtgewichtiges, oeffentlich ausrichtbares MCP-MVP fuer die Discovery von Anwaeltinnen und Anwaelten in der Schweiz.

Oeffentliches Produkt-Repo:
- `https://github.com/avvokado/swiss-lawyers-mcp`

Das Projekt ist bewusst AI-first gedacht:
- ein Haupttool fuer Discovery
- ein Detailtool fuer Profile
- read-only
- Seed-Daten statt Live-Anbindung
- saubere Trennung fuer spaetere echte Provider, API- und Partner-Erweiterungen

Wichtig:
- Das oeffentliche MCP-Produkt-Repo ist absichtlich getrennt vom bestehenden Avvokado-Quell- und Verzeichnissystem.
- Das interne Entwicklungs- und Quellsystem bleibt privat und ist nicht Teil dieses oeffentlichen Repos.

## Produktkontext

Ziel ist ein frueh live gehender MCP-Server fuer `Swiss Lawyer Discovery`.
Der MVP optimiert auf:
- schneller Marktstart
- extrem einfache AI-Integration
- nachvollziehbare Suchlogik
- saubere Basis fuer spaetere Live-Daten und Produktisierung

Nicht Teil des MVP:
- Auth
- Rate Limiting
- Lead-Submission
- Kontaktanfragen
- Schreiboperationen
- Vektorindex
- Embeddings
- LLM-Abhaengigkeit im Backend

## Features

- TypeScript + Node.js 20+
- MCP mit `stdio` und HTTP
- genau zwei oeffentliche Tools:
  - `find_lawyer`
  - `get_lawyer_profile`
- gemeinsame Domain- und Tool-Logik fuer beide Transporte
- transparenter Hybrid-Search-Ansatz:
  - Freitext
  - optionale Filter
  - additive Scores
  - Soft-Boosts
  - Fallback-Logik
- realistische Seed-Daten fuer mehrere Schweizer Kantone und Sprachen
- automatisierte Tests fuer Search, Validation und Transport-Wiring

## Installation

Voraussetzungen:
- Node.js 20+
- npm 10+

Setup:

```bash
git clone https://github.com/avvokado/swiss-lawyers-mcp.git
cd swiss-lawyers-mcp
copy .env.example .env
npm install
```

## Lokaler Start

HTTP-Server:

```bash
npm run dev
```

Der MCP-Endpoint laeuft dann standardmaessig unter:

```text
http://127.0.0.1:8080/mcp
```

Live MCP URL:

```text
https://mcp.avvokado.ch/mcp
```

For production usage, run behind a reverse proxy with rate limiting.

Health-Check:

```text
http://127.0.0.1:8080/health
```

Live Health-Check:

```text
https://mcp.avvokado.ch/health
```

stdio-Server:

```bash
npm run dev:stdio
```

Production-nahe Build-Starts:

```bash
npm run build
npm start
```

Oder fuer stdio:

```bash
npm run build
npm run start:stdio
```

## Projektstruktur

```text
src/
  config/    Env-Parsing und Defaults
  data/      Seed-Daten und SeedLawyerRepository
  domain/    Repository-Vertrag, Mapper, Directory-Service, Domain-Errors
  search/    Normalisierung, Aliases, Scoring, Fallback-Logik
  server/    MCP-Factory, HTTP, stdio, App-Context
  tools/     Schemas, Beschreibungen und Handler
  types/     oeffentliche DTOs und Metadaten
scripts/     Smoke-Runner und Test-Runner
docs/        Architektur und Beispiel-Responses
```

Kleine Abweichung von der urspruenglichen Skizze:
- `LawyerDirectoryService` sitzt in `src/domain/`, damit Tool-Handler und Transporte nur die fachliche Oberflaeche nutzen und nicht direkt Search/Repository zusammensetzen muessen.

## Verfuegbare MCP-Tools

### `find_lawyer`

Zentraler Einstieg fuer Discovery.

Input:
- `query?: string`
- `location?: string`
- `specialty?: string`
- `language?: string`
- `limit?: number`

Beispiele:
- `query: "arbeitsrecht zuerich englisch"`
- `query: "immigration geneva"`
- `specialty: "tax", location: "lugano", language: "english"`

Output:
- `results`
- `total_results`
- `search_strategy`
- `applied_filters`
- `suggestions?`
- `source`

### `get_lawyer_profile`

Detailansicht fuer einen konkreten Treffer.

Input:
- `lawyer_id: string`

Output:
- `profile`
- `source`

## Beispiel-Aufrufe

Per MCP-Client:

```json
{
  "name": "find_lawyer",
  "arguments": {
    "query": "employment zurich english",
    "limit": 3
  }
}
```

```json
{
  "name": "get_lawyer_profile",
  "arguments": {
    "lawyer_id": "lawyer-zh-luca-keller"
  }
}
```

Weitere Response-Beispiele stehen in [docs/examples.md](/C:/codex-local/swiss-lawyers-mcp/docs/examples.md).

## Manuelle Smoke-Schritte

1. Dependencies installieren:
   - `npm install`
2. HTTP-Server starten:
   - `npm run dev`
3. In einem zweiten Terminal den Smoke-Client ausfuehren:
   - `npm run smoke:http`
4. Optional stdio lokal starten:
   - `npm run dev:stdio`

## Live Smoke

Pflicht-Checks fuer den oeffentlichen Betrieb:

1. Health:
   - `https://mcp.avvokado.ch/health`
2. Oeffentlicher MCP-Endpoint:
   - `https://mcp.avvokado.ch/mcp`
3. Smoke-Client gegen die Live-URL:

```bash
npm run build
MCP_URL=https://mcp.avvokado.ch/mcp node dist/scripts/http-smoke.js
```

Der minimale Betriebscheck ist:
- `/health` antwortet mit `200`
- `find_lawyer` liefert Ergebnisse
- `get_lawyer_profile` liefert ein Profil
- invalides Input liefert stabil `INVALID_INPUT`

## Tests

Automatisierte Checks:

```bash
npm test
```

Abgedeckt sind:
- exakte Treffer
- Query + Filter
- Sprachsuche
- Orts-Fallback
- Specialty-Fallback
- Ranking-Boosts
- leere Query-Faelle
- Profil-Lookup
- Validation
- Tool-Registrierung
- HTTP-Wiring
- gemeinsamer Factory-Pfad fuer HTTP und stdio

## MVP-Grenzen

- Seed-/Mock-Daten statt Live-Provider
- kein Auth
- kein Rate Limiting
- keine Persistenz
- keine Geo-Distanzlogik
- keine Embeddings
- keine bezahlte Priorisierung
- keine Partner-/White-Label-Features im Runtime-Pfad

## Repo-Einordnung

- `swiss-lawyers-mcp` ist das oeffentliche Produkt-Repo fuer Distribution, Integrationen und Dokumentation.
- Das interne Avvokado-Entwicklungs-Repo bleibt getrennt und privat.
- Live-Daten, interne Provider, Betriebsdaten und internes Admin-/Ops-Handling gehoeren nicht in dieses oeffentliche Repo.

## Naechste sinnvolle Erweiterungen

1. Live-Read-Only-Adapter fuer das bestehende Avvokado-Verzeichnis hinter `LawyerRepository`.
2. Dedizierter Search-Index fuer bessere Recall/Ranking-Qualitaet bei groesseren Datenmengen.
3. Oeffentliche API- und Hosting-Haertung mit Auth, Rate Limiting und Observability.
4. Mehrsprachige Synonymik und Query-Normalisierung fuer DE/FR/IT/EN.
5. Analytics, Query-Logs und kuratierte Relevance-Feedback-Loops.
