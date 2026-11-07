# Audit trail

Chronological record of changes to the repo, deploys, and settings changed outside the repo (Vercel, GitHub). Append-only: add new rows at the bottom, never rewrite old ones.

For *why* a change was made, see [DECISIONS.md](DECISIONS.md).

## How to add an entry

Add one row per change, in the same push as the change (for repo changes, put the SHA of the commit being logged, or "this push" and fill it in next time). Log things git can't show:

- Production deploys (who, which commit).
- Vercel / GitHub settings changes (deploy settings, protection, env var *names* only, never values).
- Branch merges to `main`, PRs opened or closed.
- Files uploaded by teammates.

Columns: **Date** (YYYY-MM-DD, UTC) · **Type** (`repo`, `merge`, `deploy`, `settings`, `upload`, `pr`) · **What** · **Who** (person, and Claude thread if one did it) · **Ref** (commit SHA, PR, or link) · **Decision** (D-NNN, if any).

Full git history: `git log --oneline --graph --all`.

| Date | Type | What | Who | Ref | Decision |
|---|---|---|---|---|---|
| 2026-11-07 | repo | Initial Python project scaffold | Claude | `4c21a35` | |
| 2026-11-07 | repo | Stripped repo to challenge statement only | Claude, for Gavin | `0d88668` | D-001 |
| 2026-11-07 | repo | Added DATASETS.md | Claude, for Gavin | `84f27d4` | D-002 |
| 2026-11-07 | pr | PR #1 (DATASETS.md) closed unmerged; work kept on branch `claude/project-thread-qsvufv` | Gavin | PR #1 | D-004 |
| 2026-11-07 | upload | Heating degree-days table (Table_1.11 .xlsx) | Matteo-P58 | `5a0a89b` | |
| 2026-11-07 | repo | Frontend-design plugin config and toolkit notes | Claude | `753bf4e` | |
| 2026-11-07 | repo | Test heat pump sizing page from team whiteboard sketch | Claude, for Gavin | `167c755` | |
| 2026-11-07 | repo | Organic/natural restyle of sizing page | Claude, for Gavin | `b6aee66` | D-005 |
| 2026-11-07 | pr | PR #2 closed unmerged; work kept on branch `claude/project-thread-fr56yz` | Gavin | PR #2 | D-004 |
| 2026-11-07 | repo | Dark mode replaced with four light themes | Claude, for Gavin | `a62fe09` | D-005 |
| 2026-11-07 | repo | Vercel Hobby guardrails doc; `.gitignore` for secrets | Claude, for Gavin | `664e88d` | D-003, D-006 |
| 2026-11-07 | merge | Merged qsvufv, 73yxqe, fr56yz into `main` | Claude, for Gavin | `418e623` | D-007 |
| 2026-11-07 | deploy | Production deploy of `main` to https://heatpump-hackathon.vercel.app | Claude, for Gavin | `418e623` | D-006 |
| 2026-11-07 | upload | `data.zip` | sharvis3 | `b7e8b32` | |
| 2026-11-07 | repo | Git auto-deploys off (`vercel.json`); localhost launchers; deploy docs | Claude, for Gavin | `c83833f` | D-008 |
| 2026-11-07 | settings | Vercel: preview deployments disabled; Ignored Build Step skips preview builds | Claude, for Gavin | `a7f7cae` (docs) | D-008 |
| 2026-11-07 | repo | Added DECISIONS.md and AUDIT.md | Claude, for Gavin | this push | D-009 |
