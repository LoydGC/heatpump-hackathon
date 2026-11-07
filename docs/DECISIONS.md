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
| D-011 | 2026-11-07 | UI | Replace single dashboard with a gated 4-step guided flow | active |
| D-012 | 2026-11-07 | UI | Rebates section: cost effect and sources, with verify caveats | active |
| D-013 | 2026-11-07 | UI | Installer report via browser print, no library | active |
| D-014 | 2026-11-07 | UI | Smart meter is a simple toggle for now; flesh out later | active |

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

### D-011 · 2026-11-07 · Replace single dashboard with a gated 4-step guided flow
- **Workstream:** UI
- **Decision:** `index.html` is now a wizard: 1 location ("Where is your home for a heat pump?"), 2 plain-language climate summary with a heat pump illustration, 3 home details (optional; location alone gives a typical synthetic home for the region), 4 results separated into Carbon, Money and Bigger-or-smaller sections with charts. Back navigation works; forward only through completed steps; changing an earlier answer updates later pages. Supported regions: Boston, Minneapolis–St. Paul, Montréal, Fairbanks (typed city/ZIP is matched to these; no geocoding service, so other places are unsupported). Results come from a placeholder model behind `window.HeatPumpModel`; the handoff shape is in `docs/INTERFACES.md`. Still static, no build step; same four light themes via `?theme=`.
- **Why:** Gavin wanted a human-friendly, guided experience instead of an inputs-and-chart dashboard.
- **Decided by:** Gavin.
- **Refs:** branch `claude/project-thread-ez6q50`.
- **Status:** active (numbers are placeholders until the Model workstream plugs in)

### D-012 · 2026-11-07 · Rebates section: show cost effect and explain sources, with verify caveats
- **Workstream:** UI
- **Decision:** Results page gets a Rebates section: a With/Without rebates toggle that re-runs the model (the toggle drives the whole page), an always-visible side-by-side table (upfront, break-even, lifetime cost, saved vs today), a plain-language "where rebates come from" explainer, and per-region program cards (Mass Save, Xcel/CenterPoint, Hydro-Québec LogisVert, AHFC) with official links. Content lives in `ui/rebates.js` as snapshots dated 2026-11-07. Findings flagged: federal 25C ended 12/31/2025; DOE reportedly ended fuel-switching use of IRA home rebates (June 2026, trade press); Alaska's program not launched; CenterPoint page showed $400 vs $1,100 in data.zip. Calculator rebate defaults were NOT changed.
- **Why:** Gavin wanted rebate effects on cost metrics and a qualitative explanation of where rebates come from.
- **Decided by:** Gavin (request); Claude (content and layout).
- **Refs:** branch `claude/project-thread-6h36e8`.
- **Status:** active (Data workstream should verify and own the figures)

### D-013 · 2026-11-07 · Installer report via browser print, no library
- **Workstream:** UI
- **Decision:** "Download your report (PDF)" fills a hidden `#report` element and calls `window.print()`; a `@media print` stylesheet hides everything else, so "Save as PDF" in the print dialog gives a clean Letter-size document. No PDF library, CDN, secrets or server. Report covers location and design temp, home details tagged typical vs user-entered, load and size range, backup heat, rebates and paperwork, cost and CO2 with/without rebates, installer questions, document checklist, and a not-a-Manual-J disclaimer.
- **Why:** Static-site constraint (Vercel Hobby), no paid services, smallest dependency footprint. Tradeoff: user must choose "Save as PDF" in the dialog.
- **Decided by:** Gavin (request); Claude (approach).
- **Refs:** branch `claude/project-thread-6h36e8`.
- **Status:** active

### D-014 · 2026-11-07 · Smart meter stays a simple toggle for now
- **Workstream:** UI
- **Decision:** The smart meter is a visible checkbox on the Your home step (`inputs.prices.timeOfUse`; the stub applies 10% cheaper electricity). No usage-data upload or Green Button support yet. **TODO (needs fleshing out):** define what a smart meter changes (real time-of-use rates per utility from the Data pack, hourly usage to calibrate heat loss, optional upload of Green Button/CSV or monthly totals), and have the Model use hourly prices instead of the flat 10%.
- **Why:** Gavin: not ready for the upload idea; just a toggle for now.
- **Decided by:** Gavin.
- **Refs:** branch `claude/project-thread-6h36e8`.
- **Update (same day):** Gavin wants the framing "heat pump + meter vs heat pump + no meter" (you're already doing this, why not add a meter). Results now have an "Add a smart meter?" side-by-side (bill, break-even, lifetime cost) and a toggle that applies it page-wide; the home-step checkbox means "I already have one". Still the flat 10% placeholder, meter cost assumed zero.
- **Status:** active (open TODO)
