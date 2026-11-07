# Interfaces and handoffs

What each workstream provides to, and needs from, the others. Each workstream owns its own section and keeps it current; this file is edited in place (history is in git and [AUDIT.md](AUDIT.md)). Nothing here is a plan; it only records what the teams agree on.

Workstreams: **UI** (front end), **Model** (optimization / engineering model), **Data** (data prep), **Infra** (repo, hosting, deploys).

## How to use

- When you start producing something another workstream will consume, add it under **Provides** (file/function/URL, format or schema, units, location in repo, status).
- When you need something from another workstream, add it under **Needs**, naming who it's from.
- When an interface changes, update the entry, add an [AUDIT.md](AUDIT.md) row, and add a [DECISIONS.md](DECISIONS.md) entry if it was a decision.
- Status values: `proposed` · `agreed` · `delivered` · `changed` · `dropped`.

Entry format:

```
- **Name** · from → to · status
  - What / where: file path, function, or URL
  - Format: columns or fields, units, time resolution
  - Owner: person · Updated: YYYY-MM-DD
  - Notes:
```

## Data

**Provides**

- **Heating degree-days by census division** · Data → Model · delivered (raw upload)
  - What / where: `Table_1.11_Heating_Degree-Days_by_Census_Division.xlsx` (repo root)
  - Format: as uploaded; not yet documented
  - Owner: Matteo-P58 · Updated: 2026-11-07
- **data.zip (Minneapolis–St. Paul data pack)** · Data → Model · delivered (raw upload)
  - What / where: `data.zip` (repo root); its own `data/README.md` describes contents
  - Contents: TMYx weather (`.epw` + other formats, `scripts/epw_to_csv.py`), ASHRAE design conditions PDF, EIA MN electricity and natural gas prices (CSV), Xcel MN TOU rates, emission factors (CSV), MN rebates 2026, EIA heating degree-days table
  - Format: per file; schemas not yet documented here
  - Owner: sharvis3 · Updated: 2026-11-07
- **Candidate source list** · Data → all · delivered
  - What / where: `DATASETS.md`

**Needs**

- _(add)_

## Model

**Provides**

- _(add)_

**Needs**

- _(add)_

## UI

**Provides**

- **Test sizing page** · UI → all · delivered
  - What / where: `index.html`, live at https://heatpump-hackathon.vercel.app
  - Format: static page; inputs and outputs currently placeholder values from the team sketch

**Needs**

- _(add)_

## Infra

**Provides**

- **Production site** · Infra → all · delivered
  - What / where: https://heatpump-hackathon.vercel.app; manual deploys only, see `docs/local-and-deploy.md`
- **Local preview** · Infra → all · delivered
  - What / where: `run-local-windows.bat`, `run-local-mac.command`
