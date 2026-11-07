# Vercel guardrails (Hobby plan)

Project: `heatpump-hackathon` on team **CMUtant Ninja Turtles** (Hobby, free). Checked 2026-11-07 against Vercel's official docs; links per row. ⚠️ = not stated in official docs.

## Red flags to watch

| # | Red flag | Threshold / trigger | Where to check | Action |
|---|---|---|---|---|
| 1 | **Deploy budget** | 100 deployments/day, 100/hour, 60 per 5 min ([limits](https://vercel.com/docs/limits)). Every push to any branch = 1 deploy. Warn at ~70/day. | Vercel → project → Deployments | Batch commits before pushing; don't push one-line fixes in a loop. Hit the cap = wait up to 24 h. |
| 2 | **Build queue** | 1 concurrent build on Hobby ([limits](https://vercel.com/docs/limits)). Builds stuck in "Queued". | Deployments list | Push less often; cancel stale builds. 45 min max per build. |
| 3 | **Usage near Hobby caps** | Any meter >50% of: 100 GB Fast Data Transfer, 10 GB Fast Origin Transfer, 1M CDN requests, 1M function invocations, 4 CPU-hrs Active CPU, 360 GB-hrs memory, 5K image transforms ([Hobby](https://vercel.com/docs/plans/hobby)). | Team → **Usage** | Find the cause (big files, image optimization, heavy function) before demo day. Exceeding a cap can pause the feature/deployment for up to 30 days; no charge on Hobby. |
| 4 | **Heavy compute in a request** | A function nearing 300 s max, 2 GB RAM / 1 vCPU, 250 MB bundle (500 MB Python), or 4.5 MB request/response body ([functions limits](https://vercel.com/docs/functions/limitations)). Also: any COMSOL/licensed solver, GPU, or long job. | Build logs (bundle size; set `VERCEL_ANALYZE_BUILD_OUTPUT=1`), Runtime logs (504 `FUNCTION_INVOCATION_TIMEOUT`, 413) | Precompute offline and ship results as static files. Active CPU (4 hrs/month) is the cap most likely to run out first. |
| 5 | **Large files in the repo** | Single data file >~25 MB, or repo/static upload near 100 MB (CLI upload cap on Hobby). Raw weather/ResStock dumps. | GitHub file list, `git count-objects -vH` | Keep raw datasets out of git; commit only trimmed outputs. Large files served to visitors also eat Fast Data Transfer. |
| 6 | **Secrets in a public repo** | Any API key, token, `.env`, credentials file, signed URL in a diff. Repo is **public**. | `git diff` before every push; GitHub → Security → Secret scanning | Put keys in Vercel → Settings → Environment Variables (max 64 KB total per deployment). If one is pushed: rotate it immediately; deleting the commit is not enough. |
| 7 | **Teammate commits don't deploy** | Deployment "Blocked" / commit author lacks access. | Deployments list, GitHub commit checks | Works only while repo stays **public** ([collaboration](https://vercel.com/docs/deployments/troubleshoot-project-collaboration)). Do not make it private on Hobby. |
| 8 | **Card / surprise charges** | Anyone adds a card, starts Pro trial, or enables a paid add-on (e.g. Password Protection, $20/project/mo). | Team → Settings → **Billing** | Hobby has no billing and no overage charges. If you go Pro: set On-Demand Budget low and turn on **Pause Production Deployments** ([spend mgmt](https://vercel.com/docs/spend-management)). Pro's default budget is $200. |
| 9 | **Judges can't open the link** | Link asks for Vercel login. | Open link in a private window | Share only the production URL (public under Standard Protection). Preview/branch URLs require login; Hobby allows **one** shareable link per account in total ([shareable links](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/sharable-links)). |
| 10 | **Logs vanish** | Runtime logs kept 1 hour on Hobby. | Project → Logs | Debug right after reproducing; copy what matters. Build logs are kept indefinitely. |
| 11 | **Commercial use** | Ads, payments, paid work on the site. | — | Hobby is non-commercial only ([fair use](https://vercel.com/docs/limits/fair-use-guidelines)). A hackathon demo fits. |

## Current project state (2026-11-07)

- Protection: **Standard Protection** (Vercel Authentication). Production domains are public; previews and per-deployment URLs require a Vercel login.
- Stable production URL: `https://heatpump-hackathon.vercel.app` (tracks `main`).
- 6 deployments so far.

## Hobby vs Pro

| | Hobby | Pro |
|---|---|---|
| Price | $0 | $20/mo per developer seat; viewer seats free; $20 usage credit/mo ([pricing](https://vercel.com/pricing)) |
| Collaboration | Owner only; teammates' commits deploy only from public repos | Team members; private repos OK |
| Overage | Feature paused (usually up to 30 days); no charges | Pay as you go; spend cap optional |
| Deployments/day | 100 | 6,000 |
| Concurrent builds | 1 | up to 500 (on-demand) |
| Function max duration / memory | 300 s / 2 GB | 800 s (1800 s beta) / 4 GB |
| Runtime logs | 1 hour | 1 day |
| Password protection | No | $20/project/mo |
| Trial | — | 14 days, 1 per user, $20 credit, max 10 members; reverts to Hobby with no charge if no card ([trials](https://vercel.com/docs/plans/pro-plan/trials)) |

Nothing here needs Pro for a hackathon as long as the repo stays public and heavy compute stays offline.

## Unconfirmed

- ⚠️ Exact pause behaviour on Hobby: docs say "in most cases… wait until 30 days have passed"; which deployments pause and whether it's automatic is not specified ([KB](https://vercel.com/kb/guide/why-is-my-account-deployment-blocked)).
- ⚠️ Build minutes: no Hobby monthly build-minute cap is listed in the docs, only the 45 min per build limit.
- ⚠️ Hobby team size: docs list "Team collaboration features: —" for Hobby but give no explicit member count.
