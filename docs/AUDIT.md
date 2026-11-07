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
<<<<<<< HEAD
| 2026-11-07 | repo | UI | Rebuilt dashboard as gated 4-step wizard (location, climate, home, results); added `ui/` scripts and placeholder model stub; documented UI/Model handoff | Claude, for Gavin | this push (branch `claude/project-thread-ez6q50`) | D-014 |
| 2026-11-07 | repo | UI | Added Rebates section (with/without toggle, per-region program explainer with links) and printable "Download your report (PDF)" to results; new `ui/rebates.js` | Claude, for Gavin | this push (branch `claude/project-thread-6h36e8`) | D-015, D-016 |
| 2026-11-07 | repo | UI | Moved smart meter (time-of-use) toggle to main Your home form and into the report; flagged as placeholder to flesh out | Claude, for Gavin | this push | D-017 |
| 2026-11-07 | repo | UI | Results: "Add a smart meter?" section compares heat pump vs heat pump + smart meter (toggle applies it page-wide) | Claude, for Gavin | this push | D-017 |
| 2026-11-07 | repo | UI | Front page: headline "Let's get you a heat pump!" with the location question as subheader | Claude, for Gavin | this push | |
| 2026-11-07 | repo | UI | Results page split: headline numbers, what-if toggles (rebates, smart meter), PDF button first; CO2, money, tables and size trade-off folded; rebate explainer moved to its own `#rebates` page reached by a button | Claude, for Gavin | this push | D-018 |
=======
| 2026-11-07 | repo | Infra | Added `.vercelignore`: deploys skip raw data, archives, model code, docs and tooling | Claude, for Gavin | this push | D-011 |
| 2026-11-07 | repo | Infra | Broadened `.gitignore` (deps, OS/editor, temp, *.mph, *.mp4, extra secret patterns); nothing untracked | Claude, for Gavin | this push | D-012 |
| 2026-11-07 | upload | Model | Model v1 (`model/`: simulation, sweep, plots, tests, `results/`) | sharvis3 | `5192e9e`, `03f1f59`, merged in `f5ce255` | |
| 2026-11-07 | upload | Data | Unpacked `data.zip` into `data/raw/` and removed the zip; `data/processed/`, `data/scripts/`, `data/README.md` were left out | sharvis3 | `49460e6` | D-013 |
| 2026-11-07 | repo | Data | Restored `data/processed/`, `data/scripts/`, `data/README.md` from the original zip (`b7e8b32`); `model/` tests pass and `sweep.py` reproduces `model/results/sweep.csv` exactly | Claude, for Gavin | this push | D-013 |
| 2026-11-07 | repo | Infra | `.vercelignore`: re-include `model/results/frontend_data.json`; updated INTERFACES, WORKSTREAMS, README (untested on Vercel) | Claude, for Gavin | this push | D-013 |
>>>>>>> origin/main
