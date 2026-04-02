# Beispiel-Responses

Illustrative examples; values may vary.

Alle Daten im MVP sind Demo-/Seed-Daten.

## 1. Exakter Treffer

Tool:

```json
{
  "name": "find_lawyer",
  "arguments": {
    "query": "employment zurich english",
    "limit": 2
  }
}
```

Antwort:

```json
{
  "results": [
    {
      "id": "lawyer-zh-luca-keller",
      "name": "Luca Keller",
      "law_firm": "Keller Employment Advisory",
      "city": "Zuerich",
      "canton": "ZH",
      "specialties": ["Arbeitsrecht", "Wirtschaftsrecht"],
      "languages": ["Deutsch", "Englisch", "Franzoesisch"],
      "profile_summary": "Beratung fuer Arbeitsvertraege, Kuendigungen und Management-Employment in Zuerich.",
      "match_metadata": {
        "score": 95,
        "matched_on": ["specialty", "city", "language", "tag"],
        "fallback_used": false
      },
      "source": "swiss-lawyers-mcp by avvokado.ch",
      "provider": "avvokado.ch"
    }
  ],
  "total_results": 1,
  "search_strategy": "exact",
  "applied_filters": {
    "query": "employment zurich english",
    "limit": 2
  },
  "source": "swiss-lawyers-mcp by avvokado.ch"
}
```

## 2. Gemischte Query + Filter

Tool:

```json
{
  "name": "find_lawyer",
  "arguments": {
    "query": "contracts",
    "location": "Geneva",
    "specialty": "tax",
    "language": "english",
    "limit": 3
  }
}
```

Antwort:

```json
{
  "results": [
    {
      "id": "lawyer-ge-julien-rochat",
      "name": "Julien Rochat",
      "law_firm": "Rochat Avocats",
      "city": "Genf",
      "canton": "GE",
      "specialties": ["Wirtschaftsrecht", "Steuerrecht"],
      "languages": ["Franzoesisch", "Englisch"],
      "profile_summary": "Conseil en droit commercial, contrats et structuration fiscale simple a Geneve.",
      "match_metadata": {
        "score": 101,
        "matched_on": ["tag", "location", "specialty_filter", "language_filter"],
        "fallback_used": false
      },
      "source": "swiss-lawyers-mcp by avvokado.ch",
      "provider": "avvokado.ch"
    }
  ],
  "total_results": 1,
  "search_strategy": "exact",
  "applied_filters": {
    "query": "contracts",
    "location": "Geneva",
    "specialty": "tax",
    "language": "english",
    "limit": 3
  },
  "source": "swiss-lawyers-mcp by avvokado.ch"
}
```

## 3. Fallback-Treffer

Tool:

```json
{
  "name": "find_lawyer",
  "arguments": {
    "location": "Chiasso",
    "specialty": "tax",
    "language": "english",
    "limit": 3
  }
}
```

Antwort:

```json
{
  "results": [
    {
      "id": "lawyer-ti-giulia-bernardi",
      "name": "Giulia Bernardi",
      "law_firm": "Bernardi Avvocati",
      "city": "Lugano",
      "canton": "TI",
      "specialties": ["Steuerrecht", "Wirtschaftsrecht"],
      "languages": ["Italienisch", "Deutsch", "Englisch"],
      "profile_summary": "Consulenza per imprese, asset planning e tax questions in Ticino.",
      "match_metadata": {
        "score": 68,
        "matched_on": ["nearby_location", "specialty_filter", "language_filter"],
        "fallback_used": true,
        "fallback_reason": "Nahe Region oder Kanton statt exaktem Ortsmatch."
      },
      "source": "swiss-lawyers-mcp by avvokado.ch",
      "provider": "avvokado.ch"
    }
  ],
  "total_results": 1,
  "search_strategy": "fallback",
  "applied_filters": {
    "location": "Chiasso",
    "specialty": "tax",
    "language": "english",
    "limit": 3
  },
  "suggestions": [
    "Nahe Regionen fuer Chiasso: lugano, bellinzona, ti."
  ],
  "source": "swiss-lawyers-mcp by avvokado.ch"
}
```

## 4. `get_lawyer_profile`

Tool:

```json
{
  "name": "get_lawyer_profile",
  "arguments": {
    "lawyer_id": "lawyer-zh-luca-keller"
  }
}
```

Antwort:

```json
{
  "profile": {
    "id": "lawyer-zh-luca-keller",
    "name": "Luca Keller",
    "law_firm": "Keller Employment Advisory",
    "city": "Zuerich",
    "canton": "ZH",
    "specialties": ["Arbeitsrecht", "Wirtschaftsrecht"],
    "languages": ["Deutsch", "Englisch", "Franzoesisch"],
    "profile_summary": "Beratung fuer Arbeitsvertraege, Kuendigungen und Management-Employment in Zuerich.",
    "match_metadata": {
      "score": 0,
      "matched_on": ["lawyer_id"],
      "fallback_used": false
    },
    "source": "swiss-lawyers-mcp by avvokado.ch",
    "provider": "avvokado.ch",
    "profile_text": "Luca Keller begleitet Arbeitgeber und Fachkraefte bei Arbeitsvertraegen, Bonusstreitigkeiten, Restrukturierungen und internen Untersuchungen mit arbeitsrechtlichem Bezug.",
    "verified": true,
    "curated": true,
    "contact_email": "hello@keller-employment.example",
    "phone": "+41 44 555 10 11",
    "website": "https://keller-employment.example",
    "address": "Talstrasse 42, 8001 Zuerich",
    "last_updated": "2026-03-25",
    "regions": ["Zuerich", "Zug", "Basel"],
    "tags": ["employment", "kuendigung", "bonus", "hr"]
  },
  "source": "swiss-lawyers-mcp by avvokado.ch"
}
```
