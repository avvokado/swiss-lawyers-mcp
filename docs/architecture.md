# Architektur-Notiz

## Zielbild des MVP

`swiss-lawyers-mcp by avvokado.ch` ist ein kleines, oeffentlich ausrichtbares MCP-Produkt fuer `Swiss Lawyer Discovery`.

Das MVP fokussiert auf:
- sehr einfachen AI-Einstieg
- read-only Discovery
- nachvollziehbare Suche
- schnelle lokale und spaetere remote Nutzung

Der Server ist absichtlich kein Monolith fuer das bestehende Verzeichnis, sondern ein separates Produkt-Repo mit einer klaren fachlichen Oberflaeche.

Repo-Einordnung:
- `swiss-lawyers-mcp` ist das oeffentliche Produkt-Repo.
- Das bestehende Avvokado-Quellsystem und spaetere interne Live-Provider bleiben privat.
- Das oeffentliche Repo ist fuer Distribution, Integrationen, MCP-Vertraege und die leichtgewichtige Referenzimplementierung gedacht.

## Warum diese Struktur

Die Struktur trennt vier Dinge sauber, ohne komplex zu werden:

1. MCP/Transport
- `src/server/`
- nur Bootstrapping, keine Business-Logik

2. Tool-Schicht
- `src/tools/`
- Schemas, Beschreibungen, Handler
- AI-freundliche MCP-Vertraege

3. Fachliche Logik
- `src/domain/` und `src/search/`
- Discovery-Service, Mapper, Suchlogik, Fallbacks

4. Datenzugriff
- `src/data/`
- Repository-Vertrag plus Seed-Implementierung

Das ist fuer ein MVP klein genug, aber spaeter nicht verbaut.

## Datenfluss

1. HTTP oder stdio startet denselben `createAppContext()`.
2. `createMcpServer()` registriert exakt zwei Tools.
3. Tool-Handler rufen `LawyerDirectoryService` auf.
4. `LawyerDirectoryService` spricht nur mit:
   - `LawyerRepository`
   - `LawyerSearchService`
5. Responses werden als kompakte Search- oder ausfuehrliche Profile-DTOs zurueckgegeben.

## Suchansatz im MVP

Der Search-Ansatz ist bewusst transparent:
- Freitext zuerst
- strukturierte Filter optional
- additive Scores
- keine magische Blackbox

Ranking-Komponenten:
- Query-Relevanz
- Filter-Matches
- Soft-Boosts fuer:
  - `verified`
  - `curated`
  - Profilvollstaendigkeit
  - Aktualitaet

Fallback-Reihenfolge:
1. starke/exakte Treffer
2. verwandte Fachgebiete
3. nahe Region oder Kanton
4. allgemein relevante Treffer

## Wie spaeter erweitert werden kann

### Echte DB / Live-Provider

Der zentrale Erweiterungspunkt ist `LawyerRepository`.

Moegliche spaetere Implementierungen:
- `DatabaseLawyerRepository`
- `ApiLawyerRepository`
- `AvvokadoReadOnlyRepository`

Dadurch koennen Seed-Daten ersetzt werden, ohne die MCP-Tool-Vertraege zu brechen.

### Search Index

Spaeter kann hinter dem Search-Service ein dedizierter Index eingefuehrt werden:
- OpenSearch / Elasticsearch
- Meilisearch
- PostgreSQL Full-Text

Empfehlung:
- Tool-Vertraege unveraendert lassen
- Search-Service intern auf Index-Backends umschalten

### Auth

Im MVP bewusst nicht aktiv.

Spaeter moeglich:
- API-Key auf HTTP
- Partner-Keying
- Rate-Limit-Tiers

Das passt gut, weil HTTP und Tool-Schicht bereits sauber getrennt sind.

### Rate Limiting

Im MVP nicht eingebaut.

Spaeter sinnvoll:
- Reverse Proxy oder Edge-Layer
- leichtgewichtiges Middleware-Layer im HTTP-Entrypoint

### API-Layer

Der MCP-Server kann spaeter um eine klassische REST- oder JSON-API erweitert werden.

Wichtig:
- dieselbe Domain-Schicht weiterverwenden
- kein zweites Suchsystem bauen

### White Label / Multi Tenant

Noch nicht im Runtime-Pfad.

Spaeter moeglich ueber:
- mandantenfaehige Repository-Implementierungen
- tenant-spezifische Branding-/Visibility-Konfiguration
- getrennte Search-Profile oder Ranking-Regeln

### Analytics

Im MVP nur minimale Logs.

Spaeter sinnvoll:
- Query-Analytics
- Zero-result/Fallback-Tracking
- beliebtesten Fachgebiete/Orte/Sprachen
- Ranking-Feedback fuer Kuration

### Mehrsprachige Erweiterung

Im MVP:
- German-centered Normalisierung
- pragmatische DE/FR/IT/EN-Aliases

Spaeter moeglich:
- getrennte Synonym-Dictionaries
- sprachspezifische Query-Pipelines
- mehrsprachige Profilfelder
- lokalisierte Tool-Beschreibungen

## Bewusste Vereinfachungen

- keine Persistenz
- keine Background-Jobs
- keine DB
- keine Auth
- keine Geo-Distanzberechnung
- keine Volltext-Engine
- keine Embeddings

Das ist absichtlich so, damit der MVP schnell publizierbar bleibt und trotzdem eine saubere Kernarchitektur hat.
