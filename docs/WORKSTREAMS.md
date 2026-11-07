# Workstreams and folder map

The project has three workstreams plus cross-cutting infrastructure:

| Tag | Workstream |
|---|---|
| **UI** | Front end / web page |
| **Model** | Optimization / engineering model |
| **Data** | Data prep |
| **Infra** | Cross-cutting: repo, hosting, deploys, docs, team process |

Every file in the repo belongs to a workstream through the map below. That lets anyone see who worked on what from git alone: run the activity script (see [ACTIVITY.md](ACTIVITY.md)) and it sorts every commit on every branch by workstream, author and branch. A commit touching files from several workstreams counts once for each.

## Map

The script reads this block. One rule per line: `Tag  pattern`. Patterns are relative to the repo root; `*` matches anything including `/`. **First match wins**, so put specific rules above general ones. Files that match nothing show up as **Other**, which is the signal to add a rule here.

```workstream-map
# --- UI ---
UI     index.html
UI     ui/*
UI     *.css
UI     *.js
UI     assets/*
UI     docs/frontend-toolkit.md

# --- Model ---
Model  model/*
Model  *.mph
Model  *.ipynb

# --- Data ---
Data   data/*
Data   data.zip
Data   DATASETS.md
Data   *.xlsx
Data   *.csv
Data   *.epw

# --- Infra (cross-cutting) ---
Infra  docs/*
Infra  tools/*
Infra  README.md
Infra  vercel.json
Infra  .gitignore
Infra  .vercelignore
Infra  .claude/*
Infra  run-local-*
Infra  update-activity-*

# --- removed initial scaffold (4c21a35, deleted in 0d88668) ---
Infra  src/*
Infra  tests/*
Infra  scripts/*
Infra  notebooks/*
Infra  results/*
Infra  comsol/*
Infra  pyproject.toml
Infra  CONTRIBUTING.md
```

Notes:

- `*.py` is deliberately not mapped: a Python file could be Model or Data, so put it under `model/` or `data/` (or add a specific rule) to tag it.
- `index.html` stays at the repo root because Vercel serves the root as the live site. Moving the page into `ui/` would need a Vercel config change.

## Folder layout

Most of this layout is now in use. `index.html` stays at the repo root because Vercel serves the root as the live site.

| Folder | Workstream | Holds | Status |
|---|---|---|---|
| repo root | UI | `index.html` (must stay at root for Vercel unless config changes) | in use |
| `ui/` | UI | extra pages, scripts, styles, images | not created yet |
| `model/` | Model | model code (`sweep.py`, `simulate.py`, `heatpump.py`, ...), tests, plots, README. Run scripts from inside `model/` | in use (`model_v1`, sharvis3) |
| `model/results/` | Model | model outputs; `frontend_data.json` is the UI input (the only file under `model/` that the deploy uploads) | in use |
| `data/` | Data | `README.md` describing everything below | in use |
| `data/raw/` | Data | original sources, untouched (EPW weather, ASHRAE, EIA, NEEP, prices, rebates, grid chunks) | in use |
| `data/processed/` | Data | model-ready inputs read by `model/data.py` (weather CSVs, heat pump curves, grid carbon, `model_inputs_minneapolis.json`) | restored 2026-11-07 (D-013) |
| `data/scripts/` | Data | small prep helpers (`epw_to_csv.py`, `extract_tool_text.py`) | restored 2026-11-07 (D-013) |
| `docs/` | Infra | decisions, audit, interfaces, how-tos | in use (`DATASETS.md` could move here or to `data/`; currently tagged Data at the root) |
| `tools/` | Infra | repo helper scripts | in use |
