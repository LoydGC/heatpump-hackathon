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
- **Minneapolis–St. Paul data pack** · Data → Model · delivered (unpacked in repo)
  - What / where: `data/` (originally uploaded as `data.zip` in `b7e8b32`, then unpacked in `49460e6`; `data/processed/`, `data/scripts/` and `data/README.md` were missing from that unpack and restored from the zip, see D-013). Contents are described in [`data/README.md`](../data/README.md)
  - Model-ready (`data/processed/`): `model_inputs_minneapolis.json` (all scalar inputs: design temps, prices, emission factors, rebates, file pointers); `msp_weather_TMYx.2011-2025.csv` (main weather, 8,760 hourly rows); `msp_weather_TMYx.2009-2023.csv` and `msp_weather_TMY3.csv` (alternate / cold stress test); `hp_carrier_37MUHAQ_heating_curves.csv` (6 sizes, capacity and COP vs outdoor temp); `miso_hourly_grid_carbon_2025.csv` (8,760 hours of grid gCO2/kWh)
  - Raw (`data/raw/`): EPW weather, ASHRAE PDF, EIA prices, Xcel TOU notes, emission factors, rebates, NEEP heat pump tables, MISO grid chunks
  - Scripts (`data/scripts/`): `epw_to_csv.py` (EPW to hourly CSV), `extract_tool_text.py` (pulls text out of a tool-result JSON)
  - Flagged assumptions for Model/UI: grid CO2 is an average-emissions approach; TOU prices are assumed; CenterPoint hybrid rebate requires switchover at 40 °F or lower
  - Format: see [`data/README.md`](../data/README.md)
  - Owner: sharvis3 · Updated: 2026-11-07
- **Candidate source list** · Data → all · delivered
  - What / where: `DATASETS.md`

**Needs**

- _(add)_

## Model

**Provides**

- **Frontend data (model output)** · Model → UI · delivered
  - What / where: `model/results/frontend_data.json`, rebuilt by `python3 export_frontend.py` from `model/`. Also in `model/results/`: `sweep.csv`, `step5_*.csv`, `step6_preheat.csv`. Details in [`model/README.md`](../model/README.md)
  - Format: one static JSON, no Python needed to read it; the site fetches it as `model/results/frontend_data.json` (kept in the deploy by `.vercelignore`, untested on Vercel, see D-013)
  - Owner: sharvis3 · Updated: 2026-11-07

**Needs**

- **Processed Minneapolis data** · from Data · `data/processed/` (loaded by `model/data.py`, which resolves `<repo>/data/processed/`)

## UI

**Provides**

- **Test sizing page** · UI → all · delivered
  - What / where: `index.html`, live at https://heatpump-hackathon.vercel.app
  - Format: static page; inputs and outputs currently placeholder values from the team sketch

**Needs**

- `model/results/frontend_data.json` from Model (not wired into `index.html` yet)

## Infra

**Provides**

- **Production site** · Infra → all · delivered
  - What / where: https://heatpump-hackathon.vercel.app; manual deploys only, see `docs/local-and-deploy.md`
- **Local preview** · Infra → all · delivered
  - What / where: `run-local-windows.bat`, `run-local-mac.command`
