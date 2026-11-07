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
