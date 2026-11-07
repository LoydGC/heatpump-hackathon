#!/usr/bin/env python3
"""Generate docs/ACTIVITY.md: git activity by workstream, author and branch.

Reads the folder map in docs/WORKSTREAMS.md and the git history of every branch.
Standard library only. Run from anywhere: python tools/activity.py
"""
import fnmatch
import glob
import os
import shutil
import subprocess
import sys
from collections import defaultdict
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MAP_FILE = os.path.join(ROOT, "docs", "WORKSTREAMS.md")
OUT_FILE = os.path.join(ROOT, "docs", "ACTIVITY.md")
ORDER = ["UI", "Model", "Data", "Infra", "Other"]
RECENT = 40


def find_git():
    g = shutil.which("git")
    if g:
        return g
    # GitHub Desktop ships its own git; use it if git isn't on PATH.
    candidates = glob.glob(os.path.expandvars(
        r"%LOCALAPPDATA%\GitHubDesktop\app-*\resources\app\git\cmd\git.exe"))
    candidates += ["/Applications/GitHub Desktop.app/Contents/Resources/app/git/bin/git"]
    for c in sorted(candidates, reverse=True):
        if os.path.exists(c):
            return c
    sys.exit("git not found. Install Git or GitHub Desktop.")


GIT = find_git()


def git(*args, check=True):
    env = dict(os.environ, GIT_TERMINAL_PROMPT="0")  # never hang on a login prompt
    r = subprocess.run([GIT, *args], cwd=ROOT, capture_output=True, text=True,
                       encoding="utf-8", errors="replace", env=env)
    if check and r.returncode != 0:
        sys.exit(f"git {' '.join(args)} failed:\n{r.stderr}")
    return r.stdout


def load_map():
    rules, inside = [], False
    with open(MAP_FILE, encoding="utf-8") as f:
        for line in f:
            s = line.strip()
            if s.startswith("```workstream-map"):
                inside = True
                continue
            if inside and s.startswith("```"):
                break
            if inside and s and not s.startswith("#"):
                tag, pattern = s.split(None, 1)
                rules.append((tag, pattern.strip()))
    if not rules:
        sys.exit(f"No workstream-map block found in {MAP_FILE}")
    return rules


def classify(path, rules):
    for tag, pattern in rules:
        if fnmatch.fnmatchcase(path, pattern):
            return tag
    return "Other"


def branches():
    """Remote branches (origin/*) plus local-only branches, by short name."""
    refs = {}
    for line in git("for-each-ref", "--format=%(refname)", "refs/remotes/origin", "refs/heads").split():
        if line.endswith("/HEAD"):
            continue
        if line.startswith("refs/remotes/origin/"):
            refs[line[len("refs/remotes/origin/"):]] = line
        else:
            refs.setdefault(line[len("refs/heads/"):], line)
    return refs


def commits(rev_args, rules):
    """List of commits with author, date, subject, workstreams."""
    out = git("log", *rev_args, "--no-merges", "--name-only",
              "--format=\x1e%H\x1f%an\x1f%aI\x1f%s")
    result = []
    for block in out.split("\x1e")[1:]:
        head, _, files = block.partition("\n")
        sha, author, date, subject = head.split("\x1f", 3)
        paths = [p for p in files.splitlines() if p.strip()]
        ws = sorted({classify(p, rules) for p in paths}, key=ORDER.index) or ["Other"]
        result.append(dict(sha=sha, author=author, date=date[:10], ts=date,
                           subject=subject, ws=ws, files=paths))
    return result


def md(s):
    return s.replace("|", "\\|")


def main():
    if "--no-fetch" not in sys.argv:
        # Best effort: if fetch fails (offline, no login), use what's already local.
        git("fetch", "--all", "--prune", "--quiet", check=False)
    rules = load_map()
    refs = branches()
    main_ref = refs.get("main")
    all_commits = commits(["--all"] if not refs else list(refs.values()), rules)

    # Which branches carry each commit that is not on main.
    on_branch = defaultdict(list)
    branch_rows = []
    for name, ref in sorted(refs.items()):
        if name == "main":
            continue
        ahead = commits([f"{main_ref}..{ref}"] if main_ref else [ref], rules)
        for c in ahead:
            on_branch[c["sha"]].append(name)
        last = git("log", "-1", "--format=%aI\x1f%an\x1f%s", ref).strip().split("\x1f")
        ws = sorted({w for c in ahead for w in c["ws"]}, key=ORDER.index)
        authors = sorted({c["author"] for c in ahead})
        branch_rows.append((name, len(ahead), ws, authors, last))

    by_ws = defaultdict(list)
    by_author = defaultdict(lambda: defaultdict(int))
    author_last = {}
    for c in all_commits:
        for w in c["ws"]:
            by_ws[w].append(c)
            by_author[c["author"]][w] += 1
        author_last[c["author"]] = max(author_last.get(c["author"], ""), c["date"])

    L = []
    L.append("# Activity digest")
    L.append("")
    L.append("> **Auto-generated, do not edit by hand.** Regenerate with `update-activity-windows.bat` / "
             "`update-activity-mac.command` (double-click) or `python tools/activity.py`, then commit. "
             "Workstreams come from the folder map in [WORKSTREAMS.md](WORKSTREAMS.md). "
             "Hand-written records are in [AUDIT.md](AUDIT.md) and [DECISIONS.md](DECISIONS.md).")
    L.append("")
    L.append(f"Generated {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')} from "
             f"{len(refs)} branches, {len(all_commits)} commits (merge commits excluded). "
             "A commit touching several workstreams counts once for each.")
    L.append("")

    L.append("## By workstream")
    L.append("")
    L.append("| Workstream | Commits | Authors | Last activity |")
    L.append("|---|---|---|---|")
    for w in ORDER:
        cs = by_ws.get(w, [])
        if not cs and w == "Other":
            continue
        authors = ", ".join(sorted({c["author"] for c in cs})) or "—"
        last = max((c["date"] for c in cs), default="—")
        L.append(f"| {w} | {len(cs)} | {md(authors)} | {last} |")
    if by_ws.get("Other"):
        other = sorted({p for c in by_ws["Other"] for p in c["files"] if classify(p, rules) == "Other"})
        L.append("")
        L.append("Unmapped files (add a rule in WORKSTREAMS.md): " + ", ".join(f"`{p}`" for p in other[:30]))
    L.append("")

    L.append("## By author")
    L.append("")
    L.append("| Author | " + " | ".join(ORDER) + " | Last commit |")
    L.append("|---|" + "---|" * len(ORDER) + "---|")
    for a in sorted(by_author, key=lambda a: author_last[a], reverse=True):
        cells = [str(by_author[a].get(w, "")) for w in ORDER]
        L.append(f"| {md(a)} | " + " | ".join(cells) + f" | {author_last[a]} |")
    L.append("")

    L.append("## By branch")
    L.append("")
    L.append("Commits not yet on `main`. Branches at 0 are fully merged.")
    L.append("")
    L.append("| Branch | Not on main | Workstreams | Authors | Last commit | Last message |")
    L.append("|---|---|---|---|---|---|")
    for name, n, ws, authors, last in sorted(branch_rows, key=lambda r: r[4][0], reverse=True):
        L.append(f"| `{name}` | {n} | {', '.join(ws) or '—'} | {md(', '.join(authors)) or '—'} | "
                 f"{last[0][:10]} | {md(last[2])} |")
    L.append("")

    L.append(f"## Recent commits (last {RECENT}, all branches)")
    L.append("")
    L.append("| Date | Commit | Workstreams | Author | Where | Message |")
    L.append("|---|---|---|---|---|---|")
    for c in sorted(all_commits, key=lambda c: c["ts"], reverse=True)[:RECENT]:
        where = ", ".join(f"`{b}`" for b in on_branch.get(c["sha"], [])) or "main"
        L.append(f"| {c['date']} | `{c['sha'][:7]}` | {', '.join(c['ws'])} | {md(c['author'])} | "
                 f"{where} | {md(c['subject'])} |")
    L.append("")

    for w in ORDER:
        cs = by_ws.get(w, [])
        if not cs:
            continue
        L.append(f"## {w}: all commits")
        L.append("")
        for c in sorted(cs, key=lambda c: c["ts"], reverse=True):
            files = [p for p in c["files"] if classify(p, rules) == w]
            shown = ", ".join(f"`{p}`" for p in files[:5]) + (f" +{len(files) - 5} more" if len(files) > 5 else "")
            L.append(f"- {c['date']} `{c['sha'][:7]}` {md(c['author'])}: {md(c['subject'])} ({shown})")
        L.append("")

    with open(OUT_FILE, "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(L))
    print(f"Wrote {os.path.relpath(OUT_FILE, ROOT)}: {len(all_commits)} commits, {len(refs)} branches.")


if __name__ == "__main__":
    main()
