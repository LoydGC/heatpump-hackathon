# Decision log

Why things are the way they are. Append-only: add new entries at the bottom, never edit or delete old ones. To reverse a decision, add a new entry that says "Supersedes D-NNN".

For *what* changed and when, see [AUDIT.md](AUDIT.md). For what each workstream needs from or provides to the others, see [INTERFACES.md](INTERFACES.md).

## Workstreams

Every entry is tagged with one workstream (to filter: search the page for `Workstream:** UI`, etc.):

- **UI**: front end / web page.
- **Model**: optimization / engineering model.
- **Data**: data prep.
- **Infra**: cross-cutting (repo, hosting, deploys, team process).

If a decision changes what one workstream hands another, also update [INTERFACES.md](INTERFACES.md).

## Index

Add a row here with each new entry.

| ID | Date | Workstream | Title | Status |
|---|---|---|---|---|
| D-001 | 2026-11-07 | Infra | Repo holds the challenge only; no prescribed approach | active |
| D-002 | 2026-11-07 | Data | Curated dataset list in DATASETS.md | active |
| D-003 | 2026-11-07 | Infra | Never commit secrets | active |
| D-004 | 2026-11-07 | Infra | Work on branches; no PR per change | active |
| D-005 | 2026-11-07 | UI | Light organic/natural themes only | active |
| D-006 | 2026-11-07 | Infra | Host the site on Vercel Hobby at a stable URL | active |
| D-007 | 2026-11-07 | Infra | Get everything on main | active |
| D-008 | 2026-11-07 | Infra | Manual deploys only; no preview deploys | active |
| D-009 | 2026-11-07 | Infra | Keep a decision log and audit trail in the repo | active |
| D-010 | 2026-11-07 | Infra | Map folders to workstreams; auto-generate activity digest from git | active |
| D-011 | 2026-11-07 | Infra | Deploys upload only site files (`.vercelignore`) | active |
| D-012 | 2026-11-07 | Infra | Broaden `.gitignore` beyond secrets | active |
| D-013 | 2026-11-07 | Data | Restore data/processed and scripts; deploy `frontend_data.json` | active |
| D-014 | 2026-11-07 | UI | Replace single dashboard with a gated 4-step guided flow | active |
| D-015 | 2026-11-07 | UI | Rebates section: cost effect and sources, with verify caveats | active |
| D-016 | 2026-11-07 | UI | Installer report via browser print, no library | active |
| D-017 | 2026-11-07 | UI | Smart meter is a simple toggle for now; flesh out later | active |
| D-018 | 2026-11-07 | UI | Results show high-level answers first; rebate explainer on its own page | active |
| D-019 | 2026-11-07 | UI | Map the front end to model v1 for Minneapolis; add carbon-price dial | active |

## How to add an entry

Anyone (teammate or Claude thread) who makes a decision that affects the repo, the site, settings, or how the team works adds an entry in the same push as the change.

```
### D-NNN · YYYY-MM-DD · Short title
- **Workstream:** UI | Model | Data | Infra
- **Decision:** what was decided.
- **Why:** the reason or constraint.
- **Decided by:** person (and Claude thread, if one did the work).
- **Refs:** commit SHAs, files, links.
- **Status:** active | superseded by D-NNN
```

---

### D-001 · 2026-11-07 · Repo holds the challenge only; no prescribed approach
- **Workstream:** Infra
- **Decision:** Removed the initial Python scaffold (modules, placeholder parameters, workflow rules). README contains only the challenge statement plus pointers.
- **Why:** The team chooses its own approach; the repo should not prescribe methodology, structure or tooling.
- **Decided by:** Gavin.
- **Refs:** `4c21a35` (scaffold), `0d88668` (strip).
- **Status:** active

### D-002 · 2026-11-07 · Curated dataset list in DATASETS.md
- **Workstream:** Data
- **Decision:** Keep candidate data sources (weather, NREL home energy, fuel cost and emissions) in one reference file.
- **Why:** Shared starting point for data without committing to a method.
- **Decided by:** Gavin.
- **Refs:** `84f27d4`, `DATASETS.md`.
- **Status:** active

### D-003 · 2026-11-07 · Never commit secrets
- **Workstream:** Infra
- **Decision:** No API keys, tokens, passwords, keys, `.env` files or signed URLs in the repo. Secrets live in env vars / Vercel settings; only a `.env.example` with placeholders may be committed. `.gitignore` blocks common secret files.
- **Why:** The repo is public.
- **Decided by:** Gavin (standing project rule).
- **Refs:** `664e88d` (`.gitignore`).
- **Status:** active

### D-004 · 2026-11-07 · Work on branches; no PR per change
- **Workstream:** Infra
- **Decision:** Changes go to branches. No PR for each change; PRs only when Gavin asks. Gavin merges in big batches. Push to `main` only when he explicitly asks.
- **Why:** Too many small PRs; keep `main` controlled.
- **Decided by:** Gavin.
- **Refs:** PR #1 and PR #2 closed unmerged; work kept on branches.
- **Status:** active

### D-005 · 2026-11-07 · Light organic/natural themes only
- **Workstream:** UI
- **Decision:** Sizing page uses an organic/natural look. Dark mode removed; four light themes selectable via `?theme=lichen|sand|sage|paper`.
- **Why:** Gavin disliked dark backgrounds.
- **Decided by:** Gavin.
- **Refs:** `b6aee66`, `a62fe09`, `index.html`.
- **Status:** active

### D-006 · 2026-11-07 · Host the site on Vercel Hobby at a stable URL
- **Workstream:** Infra
- **Decision:** Vercel project `heatpump-hackathon` (team `cmu-tant-ninja-turtles`), production URL https://heatpump-hackathon.vercel.app. Stay within Hobby limits per the guardrails doc.
- **Why:** Free, simple static hosting with one link to share.
- **Decided by:** Gavin.
- **Refs:** `664e88d`, `docs/vercel-guardrails.md`.
- **Status:** active

### D-007 · 2026-11-07 · Get everything on main
- **Workstream:** Infra
- **Decision:** Merged branches `claude/project-thread-qsvufv`, `-73yxqe`, `-fr56yz` into `main`; branches kept. After that, be conservative with PRs.
- **Why:** Gavin asked for one consolidated `main`.
- **Decided by:** Gavin.
- **Refs:** `ffdc4b8`, `4c13511`, `418e623`.
- **Status:** active

### D-008 · 2026-11-07 · Manual deploys only; no preview deploys
- **Workstream:** Infra
- **Decision:** Pushing to GitHub does not deploy. `vercel.json` disables Git auto-deploys; preview deployments are disabled in Vercel settings plus an Ignored Build Step that skips preview builds. Deploy production from the Vercel dashboard on purpose. Test branches on localhost (launchers added).
- **Why:** Control what goes live and avoid burning Hobby build quota.
- **Decided by:** Gavin.
- **Refs:** `c83833f`, `a7f7cae`, `vercel.json`, `docs/local-and-deploy.md`.
- **Status:** active

### D-009 · 2026-11-07 · Keep a decision log and audit trail in the repo
- **Workstream:** Infra
- **Decision:** Add `docs/DECISIONS.md` (why), `docs/AUDIT.md` (what/when) and `docs/INTERFACES.md` (handoffs between workstreams). Decisions and audit rows are append-only and tagged UI / Model / Data / Infra, updated in the same push as the change.
- **Why:** Trace changes and interactions, and coordinate across the UI, Model and Data workstreams, teammates and Claude threads.
- **Decided by:** Gavin.
- **Refs:** this commit.
- **Status:** active

### D-010 · 2026-11-07 · Map folders to workstreams; auto-generate activity digest from git
- **Workstream:** Infra
- **Decision:** Each file maps to a workstream via the map in `docs/WORKSTREAMS.md`. `tools/activity.py` (double-click `update-activity-*`) reads all branches and writes `docs/ACTIVITY.md` by workstream, author and branch. A suggested folder layout is documented but no files were moved.
- **Why:** Trace teammates' manual work (uploads, edits) from git alone, without relying on everyone writing AUDIT.md rows.
- **Decided by:** Gavin (chose folder mapping).
- **Refs:** this push.
- **Status:** active

### D-011 · 2026-11-07 · Deploys upload only site files (`.vercelignore`)
- **Workstream:** Infra
- **Decision:** `.vercelignore` excludes raw data and archives (`*.zip`, `*.xlsx`, `data/raw/`, `data/scripts/`), model/analysis code (`model/`, `comsol/`, `notebooks/`, `*.py`, ...), docs, tooling, launchers and `*.md`. Kept: `index.html`, `vercel.json`, and anything else, such as `ui/`, `assets/`, `data/processed/`, `results/`, so the page can load processed data or model outputs. (Amended by D-013: `model/` is now excluded except `model/results/frontend_data.json`.) Denylist chosen over allowlist so new site folders deploy without config changes.
- **Why:** Smaller, faster deploys within Hobby limits; no raw data or internal files on the public site.
- **Decided by:** Gavin.
- **Refs:** this push, `.vercelignore`, `docs/local-and-deploy.md`.
- **Status:** active

### D-012 · 2026-11-07 · Broaden `.gitignore` beyond secrets
- **Workstream:** Infra
- **Decision:** `.gitignore` now also ignores dependencies and Python junk (`node_modules/`, `__pycache__/`, `.venv/`), OS and editor files, temp and Office lock files, large `*.mph` and `*.mp4` files, and more secret patterns (`*.p12`, `*.pfx`, `id_rsa*`, `secrets.*`, `.npmrc`). `data/raw/`, `*.zip` and `*.xlsx` are deliberately NOT ignored, because the team commits raw data there and the Model needs it; `.vercelignore` already keeps them off the live site. Nothing already tracked was untracked.
- **Why:** The repo is public and takes data uploads; guard against accidental huge or sensitive commits.
- **Decided by:** Gavin.
- **Refs:** this push, `.gitignore`.
- **Status:** active

### D-013 · 2026-11-07 · Restore `data/processed/`, and let the site load `frontend_data.json`
- **Workstream:** Data (with Model and Infra)
- **Decision:** Restored `data/processed/` (6 files), `data/scripts/` (2 small helpers, read and harmless: EPW-to-CSV conversion and JSON text extraction) and `data/README.md` from the original `data.zip` commit `b7e8b32`. The unzip in `49460e6` had only kept `data/raw/`, so `model/data.py` (which reads `data/processed/`) failed on a fresh clone. `.vercelignore` now excludes `model/*` but re-includes `model/results/frontend_data.json`, the Model output the UI loads. Stale references in INTERFACES, WORKSTREAMS and the README were updated.
- **Why:** The model could not run from the repo, and the old `.vercelignore` excluded all of `model/`, so the deployed page could not fetch its data.
- **Verified:** `pytest` in `model/` passes (6 tests); re-running `python3 sweep.py` reproduces the committed `model/results/sweep.csv` exactly (max difference 0.0). The `.vercelignore` re-include is **not tested on Vercel**: after the next manual deploy, check that `/model/results/frontend_data.json` returns 200.
- **Decided by:** Gavin.
- **Refs:** this push, `.vercelignore`, `data/README.md`.
### D-014 · 2026-11-07 · Replace single dashboard with a gated 4-step guided flow
- **Workstream:** UI
- **Decision:** `index.html` is now a wizard: 1 location ("Where is your home for a heat pump?"), 2 plain-language climate summary with a heat pump illustration, 3 home details (optional; location alone gives a typical synthetic home for the region), 4 results separated into Carbon, Money and Bigger-or-smaller sections with charts. Back navigation works; forward only through completed steps; changing an earlier answer updates later pages. Supported regions: Boston, Minneapolis–St. Paul, Montréal, Fairbanks (typed city/ZIP is matched to these; no geocoding service, so other places are unsupported). Results come from a placeholder model behind `window.HeatPumpModel`; the handoff shape is in `docs/INTERFACES.md`. Still static, no build step; same four light themes via `?theme=`.
- **Why:** Gavin wanted a human-friendly, guided experience instead of an inputs-and-chart dashboard.
- **Decided by:** Gavin.
- **Refs:** branch `claude/project-thread-ez6q50`.
- **Status:** active (numbers are placeholders until the Model workstream plugs in)

### D-015 · 2026-11-07 · Rebates section: show cost effect and explain sources, with verify caveats
- **Workstream:** UI
- **Decision:** Results page gets a Rebates section: a With/Without rebates toggle that re-runs the model (the toggle drives the whole page), an always-visible side-by-side table (upfront, break-even, lifetime cost, saved vs today), a plain-language "where rebates come from" explainer, and per-region program cards (Mass Save, Xcel/CenterPoint, Hydro-Québec LogisVert, AHFC) with official links. Content lives in `ui/rebates.js` as snapshots dated 2026-11-07. Findings flagged: federal 25C ended 12/31/2025; DOE reportedly ended fuel-switching use of IRA home rebates (June 2026, trade press); Alaska's program not launched; CenterPoint page showed $400 vs $1,100 in data.zip. Calculator rebate defaults were NOT changed.
- **Why:** Gavin wanted rebate effects on cost metrics and a qualitative explanation of where rebates come from.
- **Decided by:** Gavin (request); Claude (content and layout).
- **Refs:** branch `claude/project-thread-6h36e8`.
- **Status:** active (Data workstream should verify and own the figures)

### D-016 · 2026-11-07 · Installer report via browser print, no library
- **Workstream:** UI
- **Decision:** "Download your report (PDF)" fills a hidden `#report` element and calls `window.print()`; a `@media print` stylesheet hides everything else, so "Save as PDF" in the print dialog gives a clean Letter-size document. No PDF library, CDN, secrets or server. Report covers location and design temp, home details tagged typical vs user-entered, load and size range, backup heat, rebates and paperwork, cost and CO2 with/without rebates, installer questions, document checklist, and a not-a-Manual-J disclaimer.
- **Why:** Static-site constraint (Vercel Hobby), no paid services, smallest dependency footprint. Tradeoff: user must choose "Save as PDF" in the dialog.
- **Decided by:** Gavin (request); Claude (approach).
- **Refs:** branch `claude/project-thread-6h36e8`.
- **Status:** active

### D-017 · 2026-11-07 · Smart meter stays a simple toggle for now
- **Workstream:** UI
- **Decision:** The smart meter is a visible checkbox on the Your home step (`inputs.prices.timeOfUse`; the stub applies 10% cheaper electricity). No usage-data upload or Green Button support yet. **TODO (needs fleshing out):** define what a smart meter changes (real time-of-use rates per utility from the Data pack, hourly usage to calibrate heat loss, optional upload of Green Button/CSV or monthly totals), and have the Model use hourly prices instead of the flat 10%.
- **Why:** Gavin: not ready for the upload idea; just a toggle for now.
- **Decided by:** Gavin.
- **Refs:** branch `claude/project-thread-6h36e8`.
- **Update (same day):** Gavin wants the framing "heat pump + meter vs heat pump + no meter" (you're already doing this, why not add a meter). Results now have an "Add a smart meter?" side-by-side (bill, break-even, lifetime cost) and a toggle that applies it page-wide; the home-step checkbox means "I already have one". Still the flat 10% placeholder, meter cost assumed zero.
- **Status:** active (open TODO)

### D-018 · 2026-11-07 · Results: high level first; rebate explainer on a separate page
- **Workstream:** UI
- **Decision:** Results page shows only the suggestion, four headline tiles (yearly bill, upfront after rebates, break-even, CO2 cut per year), a "What if..." row (rebates on/off, smart meter on/off), the PDF button and a "Learn about rebates" button. Carbon, Money, the rebate/meter comparison tables and "Bigger or smaller?" are collapsed sections. The qualitative rebate content (sources, regional programs, links, caveat) is a separate sub-page `#rebates` reached only from results (it counts as step 4 in the nav; direct links fall back if results were not reached) with a back button.
- **Why:** Gavin: the results page was overwhelming; rebate details should be a page you choose to visit.
- **Decided by:** Gavin.
- **Refs:** branch `claude/project-thread-6h36e8`.
- **Status:** active

### D-019 · 2026-11-07 · Map the front end to model v1 (Minneapolis); carbon-price dial
- **Workstream:** UI
- **Decision:** For Minneapolis the results page reads `model/results/frontend_data.json` (adapter `ui/model-v1.js`); Boston, Montréal and Fairbanks keep the placeholder stub, and the page labels which is which. New "How much do you care about CO2?" dial on results snaps to the model's lambda grid ($0 to $1,000 per tonne) and shows the recommendation, whether a heat pump beats gas, and $/tonne; a table shows every setting. Smart meter toggle maps to flat vs time-of-use tariff; winter and AC-replacement toggles map to the weather and credit axes. The UI states everywhere (results banner, notes, footer, PDF, INTERFACES.md) that **v1 is not exactly what the end model will be, but is closer to what the team is thinking**, and lists its placeholder inputs: installed cost, rebates, TOU rates, AC credit, average (not marginal) grid intensity, discount rate 0, one fixed house. Field mapping is in INTERFACES.md ("Model v1 mapping"). Default dial position is $500/t (about where the heat pump starts to win), not the lowest setting.
- **Why:** Gavin: v1 is closer to the intended model; map the front end to it and add a slider.
- **Decided by:** Gavin (request); Claude (mapping).
- **Refs:** branch `claude/project-thread-6h36e8`; model by sharvis3.
- **Status:** active (supersede when the end model lands)
