# Audit trail

Chronological record of changes to the repo, deploys, and settings changed outside the repo (Vercel, GitHub). Append-only: add new rows at the bottom, never rewrite old ones.

For *why* a change was made, see [DECISIONS.md](DECISIONS.md).

## How to add an entry

Add one row per change, in the same push as the change (for repo changes, put the SHA of the commit being logged, or "this push" and fill it in next time). Log things git can't show:

- Production deploys (who, which commit).
- Vercel / GitHub settings changes (deploy settings, protection, env var *names* only, never values).
- Branch merges to `main`, PRs opened or closed.
- Files uploaded by teammates.

Columns: **Date** (YYYY-MM-DD, UTC) · **Type** (`repo`, `merge`, `deploy`, `settings`, `upload`, `pr`) · **Workstream** (`UI`, `Model`, `Data`, `Infra` for cross-cutting) · **What** · **Who** (person, and Claude thread if one did it) · **Ref** (commit SHA, PR, or link) · **Decision** (D-NNN, if any).

To filter by workstream: search the page for `| UI |`, `| Model |`, `| Data |` or `| Infra |`. Automatic per-workstream/author/branch digest: [ACTIVITY.md](ACTIVITY.md). Full git history: `git log --oneline --graph --all`.

| Date | Type | Workstream | What | Who | Ref | Decision |
|---|---|---|---|---|---|---|
| 2026-11-07 | repo | Infra | Initial Python project scaffold | Claude | `4c21a35` | |
| 2026-11-07 | repo | Infra | Stripped repo to challenge statement only | Claude, for Gavin | `0d88668` | D-001 |
| 2026-11-07 | repo | Data | Added DATASETS.md | Claude, for Gavin | `84f27d4` | D-002 |
| 2026-11-07 | pr | Data | PR #1 (DATASETS.md) closed unmerged; work kept on branch `claude/project-thread-qsvufv` | Gavin | PR #1 | D-004 |
| 2026-11-07 | upload | Data | Heating degree-days table (Table_1.11 .xlsx) | Matteo-P58 | `5a0a89b` | |
| 2026-11-07 | repo | UI | Frontend-design plugin config and toolkit notes | Claude | `753bf4e` | |
| 2026-11-07 | repo | UI | Test heat pump sizing page from team whiteboard sketch | Claude, for Gavin | `167c755` | |
| 2026-11-07 | repo | UI | Organic/natural restyle of sizing page | Claude, for Gavin | `b6aee66` | D-005 |
| 2026-11-07 | pr | UI | PR #2 closed unmerged; work kept on branch `claude/project-thread-fr56yz` | Gavin | PR #2 | D-004 |
| 2026-11-07 | repo | UI | Dark mode replaced with four light themes | Claude, for Gavin | `a62fe09` | D-005 |
| 2026-11-07 | repo | Infra | Vercel Hobby guardrails doc; `.gitignore` for secrets | Claude, for Gavin | `664e88d` | D-003, D-006 |
| 2026-11-07 | merge | Infra | Merged qsvufv, 73yxqe, fr56yz into `main` | Claude, for Gavin | `418e623` | D-007 |
| 2026-11-07 | deploy | Infra | Production deploy of `main` to https://heatpump-hackathon.vercel.app | Claude, for Gavin | `418e623` | D-006 |
| 2026-11-07 | upload | Data | `data.zip` (Minneapolis data pack) | sharvis3 | `b7e8b32` | |
| 2026-11-07 | repo | Infra | Git auto-deploys off (`vercel.json`); localhost launchers; deploy docs | Claude, for Gavin | `c83833f` | D-008 |
| 2026-11-07 | settings | Infra | Vercel: preview deployments disabled; Ignored Build Step skips preview builds | Claude, for Gavin | `a7f7cae` (docs) | D-008 |
| 2026-11-07 | repo | Infra | Added DECISIONS.md, AUDIT.md and INTERFACES.md | Claude, for Gavin | this push | D-009 |
| 2026-11-07 | repo | Infra | Folder-to-workstream map, activity script and launchers, generated ACTIVITY.md | Claude, for Gavin | this push | D-010 |
| 2026-11-07 | merge | Infra | Fast-forwarded `claude/project-thread-5j68ss` (decision log, audit, interfaces, workstream map, activity digest) into `main` | Claude, for Gavin | `5a5d347` | D-009, D-010 |
| 2026-11-07 | repo | Infra | Added `.vercelignore`: deploys skip raw data, archives, model code, docs and tooling | Claude, for Gavin | this push | D-011 |
| 2026-11-07 | repo | Infra | Broadened `.gitignore` (deps, OS/editor, temp, *.mph, *.mp4, extra secret patterns); nothing untracked | Claude, for Gavin | this push | D-012 |
| 2026-11-07 | upload | Model | Model v1 (`model/`: simulation, sweep, plots, tests, `results/`) | sharvis3 | `5192e9e`, `03f1f59`, merged in `f5ce255` | |
| 2026-11-07 | upload | Data | Unpacked `data.zip` into `data/raw/` and removed the zip; `data/processed/`, `data/scripts/`, `data/README.md` were left out | sharvis3 | `49460e6` | D-013 |
| 2026-11-07 | repo | Data | Restored `data/processed/`, `data/scripts/`, `data/README.md` from the original zip (`b7e8b32`); `model/` tests pass and `sweep.py` reproduces `model/results/sweep.csv` exactly | Claude, for Gavin | this push | D-013 |
| 2026-11-07 | repo | Infra | `.vercelignore`: re-include `model/results/frontend_data.json`; updated INTERFACES, WORKSTREAMS, README (untested on Vercel) | Claude, for Gavin | this push | D-013 |
| 2026-11-07 | repo | UI | Rebuilt dashboard as gated 4-step wizard (location, climate, home, results); added `ui/` scripts and placeholder model stub; documented UI/Model handoff | Claude, for Gavin | this push (branch `claude/project-thread-ez6q50`) | D-014 |
| 2026-11-07 | repo | UI | Added Rebates section (with/without toggle, per-region program explainer with links) and printable "Download your report (PDF)" to results; new `ui/rebates.js` | Claude, for Gavin | this push (branch `claude/project-thread-6h36e8`) | D-015, D-016 |
| 2026-11-07 | repo | UI | Moved smart meter (time-of-use) toggle to main Your home form and into the report; flagged as placeholder to flesh out | Claude, for Gavin | this push | D-017 |
| 2026-11-07 | repo | UI | Results: "Add a smart meter?" section compares heat pump vs heat pump + smart meter (toggle applies it page-wide) | Claude, for Gavin | this push | D-017 |
| 2026-11-07 | repo | UI | Front page: headline "Let's get you a heat pump!" with the location question as subheader | Claude, for Gavin | this push | |
| 2026-11-07 | repo | UI | Results page split: headline numbers, what-if toggles (rebates, smart meter), PDF button first; CO2, money, tables and size trade-off folded; rebate explainer moved to its own `#rebates` page reached by a button | Claude, for Gavin | this push | D-018 |
| 2026-11-07 | repo | UI | Merged main (model v1); wired Minneapolis to `model/results/frontend_data.json` via `ui/model-v1.js`; added carbon-price dial (13 snapped $/t steps), winter and AC scenarios, dial sweep table; labeled model v1 vs placeholder regions; PDF report uses v1 numbers | Claude, for Gavin | this push | D-019 |
| 2026-11-07 | repo | UI | Step 2 climate page rewritten with per-region cited content (Minneapolis, Boston researched; Montréal limited; Fairbanks flagged for a specialist), climate-type overview, tagged claims and Sources footer; `climateStats` removed from model stub | Claude, for Gavin | this push (branch `claude/project-thread-ez6q50`) | D-012 |
| 2026-11-08 | repo | UI | Merged branches 6h36e8 and ez6q50 onto main; replaced sq ft box with ResStock home type and size dropdowns (7 fine / 3 coarse bins), ResStock reference figures, new `ui/resstock.js` and `tools/build_resstock_ui.py` | Claude, for Gavin | this push | D-021 |
| 2026-11-08 | repo | UI | Removed Montréal, footer paragraph, location-step disclaimer and two copy phrases; front page now has no location subheader and the lede ends "Just tell us where your home is." | Claude, for Gavin | this push | D-022 |
| 2026-11-08 | repo | UI | Reworded Boston cold-night card; removed repo / "data pack" wording from visible text | Claude, for Gavin | this push | D-023 |
| 2026-11-08 | repo | UI | Rewrote climate cards (all three regions) under the kicker+heading+body flow rule | Claude, for Gavin | this push | D-024 |
| 2026-11-07 | repo | Data | Added docs/COMPARABLES.md and docs/comparables.html: comparable heat pump products research (no PR, no deploy; docs/ excluded from deploys) | Claude, for Gavin | this push | |
| 2026-11-08 | merge | Infra | Merged dashboard branch (wizard, ResStock dropdowns, climate page) and comparables research into `main`; no deploy | Claude, for Gavin | this push | |
| 2026-11-08 | repo | UI | Fast-forwarded branch onto main (cf872ba); removed Size groups toggle; Boston typical home now built from the Boston ResStock extract | Claude, for Gavin | this push | D-025 |
| 2026-11-08 | repo | Data | Added `docs/REFERENCE_FACTS.md`: guaranteed facts from the ResStock extracts (Boston typical home, bins, medians) | Claude, for Gavin | this push | D-025 |
| 2026-11-08 | repo | UI | Removed theme switcher and sand/sage/paper themes; green lichen theme only | Claude, for Gavin | this push | D-005 |
| 2026-11-08 | repo | UI | Climate citations now link directly to sources; Sources list removed | Claude, for Gavin | this push | D-020 |
| 2026-11-08 | repo | UI | Results page: removed subtitle, placeholder/model banner and notes list | Claude, for Gavin | this push | D-018 |
