# Frontend design toolkit for Claude Code

Picked from [wilwaldon/Claude-Code-Frontend-Design-Toolkit](https://github.com/wilwaldon/Claude-Code-Frontend-Design-Toolkit), which is a curated list of links, not installable code. Only vetted, official-marketplace items are wired into this repo.

## Already set up in this repo

`.claude/settings.json` enables Anthropic's **frontend-design** plugin from the official marketplace (`anthropics/claude-plugins-official`). It is a single skill with no hooks, scripts, or network calls. When you open Claude Code in this repo and trust the folder, it asks to install it. After that it activates automatically whenever you ask Claude to build UI: it picks a deliberate visual direction, real font pairings, and a CSS-variable color system instead of generic AI styling.

If the prompt doesn't appear, run inside Claude Code:

```
/plugin install frontend-design@claude-plugins-official
```

## Optional, install per person

These add MCP servers, which cost context tokens every session, so they are opt-in. All are in the official marketplace:

| Plugin | What it gives Claude | Install |
|---|---|---|
| playwright | A browser to open the app, click around, and screenshot it | `/plugin install playwright@claude-plugins-official` |
| context7 | Current docs for React, Next.js, Tailwind, etc. | `/plugin install context7@claude-plugins-official` |
| typescript-lsp | Live type errors while it writes TypeScript | `/plugin install typescript-lsp@claude-plugins-official` |

## Notes on the source list

- Its `claude plugin add anthropic/...` commands are not valid syntax; use the `/plugin install ...@claude-plugins-official` form above.
- Its Chrome DevTools command (`npx @anthropic-ai/chrome-devtools-mcp`) points at a package that does not exist on npm. The real server is Google's `chrome-devtools-mcp`.
- Third-party skills it lists (UI/UX Pro Max, Taste Skill, etc.) are unvetted. Read the source before installing, and never commit API keys they ask for (this repo is public).

## Quick theme without any install

Add a block like this to a `CLAUDE.md` once the team picks a look:

```markdown
## Frontend Theme
- Clean, technical, data-forward (engineering tool, not marketing site)
- One accent color for heat/cold, neutral background
- Charts first; numbers in a monospace or tabular font
```
