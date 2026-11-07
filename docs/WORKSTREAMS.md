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

## Proposed folder layout (not applied)

Nothing has been moved. If the team wants cleaner tracking, this is a suggested layout; the map above already recognises these folders, so files placed there are tagged automatically.

| Folder | Workstream | Would hold | Existing files that could move there |
|---|---|---|---|
| repo root | UI | `index.html` (must stay at root for Vercel unless config changes) | — |
| `ui/` | UI | extra pages, scripts, styles, images | — |
| `model/` | Model | model code, notebooks, COMSOL files, model outputs for the UI | — |
| `data/` | Data | raw and processed data, prep scripts | contents of `data.zip` (it already unpacks to `data/raw/...` and `data/scripts/...`); `Table_1.11_...xlsx` (already duplicated inside `data.zip` at `data/raw/eia/`) |
| `docs/` | Infra | decisions, audit, interfaces, how-tos | `DATASETS.md` could move here or to `data/` (currently tagged Data at the root) |
| `tools/` | Infra | repo helper scripts | — |
