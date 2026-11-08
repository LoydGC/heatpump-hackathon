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
| D-020 | 2026-11-07 | UI | Climate page claims are cited and tagged by evidence type | active |
| D-021 | 2026-11-08 | UI | Home size and type come from ResStock dropdowns; 0-499 and 4000+ bins dropped | active |
| D-022 | 2026-11-08 | UI | Remove Montréal and the on-page disclaimers/footer | active |
| D-023 | 2026-11-08 | UI | No references to the repo or "data pack" in user-facing text | active |
| D-024 | 2026-11-08 | UI | Climate card rule: kicker and heading read as one sentence; body supports the heading | active |
| D-025 | 2026-11-08 | UI/Data | Boston typical home comes from the Boston ResStock extract, the definitive reference | active |

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

### D-020 · 2026-11-07 · Climate page claims are cited and tagged by evidence type
- **Workstream:** UI
- **Decision:** Step 2 keeps its structure (headline, three cards, heat pump explainer) and adds a qualitative climate-type overview plus a Sources footer. Each claim is tagged Research (cited study), Team data (computed from `data.zip`), Our reasoning (own inference, e.g. gas-vs-electric price arithmetic) or Not researched. Minneapolis and Boston have researched content; Montréal is limited; Fairbanks shows a "needs a specialist" message because the sources found report significant data gaps for very cold climates. Design temperatures use ASHRAE 99.6% (Minneapolis −9 °F from the `.ddy` in `data.zip`, Boston 8 °F).
- **Why:** Gavin asked what research backed the page; the first version was rules over placeholder numbers with unsourced general claims.
- **Decided by:** Gavin.
- **Refs:** `ui/regions.js` (`CLIMATE`, `SOURCES`).
- **Status:** active (Boston hourly weather and current MA prices still to be added; Montréal and Fairbanks need research)

### D-021 · 2026-11-08 · Home type and size are ResStock dropdowns; 0-499 and 4000+ bins dropped
- **Workstream:** UI (with Data)
- **Decision:** The free-form "Home size (sq ft)" box is replaced by a Home type select (single-family detached / attached enabled; mobile home and multi-family listed but disabled) and a size select with a 7-bin fine (500-749 ... 3000-3999) or 3-group coarse (0-1499 excluding under 500, 1500-2499, 2500-3999) toggle. Counts are not shown in the UI (Gavin 2026-11-08); empty cells are disabled and an empty choice falls back to the nearest non-empty bin with a count-free note. Median annual kWh/therms/other fuel for the cell are shown as "ResStock reference, not our model". Montréal has no ResStock data and stays a labelled placeholder. Sq ft passed to the stand-in is the cell's weighted mean size.
- **Why:** Gavin wants representative ResStock options; he dropped the 0-499 and 4000+ bins ("Drop 0-499 bin from consideration", "drop 4000+").
- **Decided by:** Gavin.
- **Refs:** `ui/resstock.js` (generated by `tools/build_resstock_ui.py` from project folder `datasets/resstock/`), `ui/app.js` (`selection`, `refHtml`).
- **Update (2026-11-08):** Gavin: no vintage (year built / home age) in the front end. It was never an input or a ResStock filter here; the only mention, "Home age" in the report's installer checklist, was removed. The stand-in's heat loss uses size and draftiness only.
- **Status:** active (model v1 still uses one fixed house, so type/size do not change Minneapolis model numbers)

### D-022 · 2026-11-08 · Remove Montréal and the on-page disclaimers/footer
- **Workstream:** UI
- **Decision:** Montréal (region data, climate content, rebate content, location matching, selector) is removed; the app covers Boston, Minneapolis-St. Paul and Fairbanks. The footer paragraph, the coverage/placeholder note under the location selector, "Tell us where you live" and "in plain language" are removed from the page. The results-page model v1 banner and notes are unchanged (they carry the model caveats).
- **Why:** Gavin asked for these removals.
- **Decided by:** Gavin.
- **Refs:** `index.html`, `ui/regions.js`, `ui/rebates.js`.
- **Status:** active (supersedes the "Montréal stays a labelled placeholder" line in D-021)

### D-023 · 2026-11-08 · No references to the repo or "data pack" in user-facing text
- **Workstream:** UI
- **Decision:** Visible copy never mentions the repo, data.zip or a "data pack"; say "the team's data" instead. The Boston "Carrying the whole winter" card is now "Handling the cold": it is now two short plain sentences (coldest nights about 8 °F; units rated to 5 °F and work below), with no comparison to other cities, and drops the line that said Boston hourly weather isn't in the repo. The "Not researched" notes block on the climate page is removed (Gavin, 2026-11-08); regions.js still holds the notes data.
- **Why:** Gavin: a card that points at a repo is worrying to read.
- **Decided by:** Gavin.
- **Refs:** `ui/regions.js`, `ui/app.js`, `ui/rebates.js`, `index.html`.
- **Status:** active (internal code comments may still say data.zip)

### D-024 · 2026-11-08 · Climate card rule: kicker and heading read as one sentence; body supports the heading
- **Workstream:** UI
- **Decision:** On the climate page each card's kicker plus heading must read as one natural sentence, and the body must directly support the heading (no card promises what its body does not show). Cards are ordered climate, big savings, may not fit (softened per Gavin: the page is bullish on heat pumps): "In your climate / Most winter hours suit a heat pump", "Big savings from replacing / Electric heat or propane", "It may not be a good fit if you heat with / Natural gas". The old kickers "Heat pumps excel at", "Your climate is ideal for" and "Where we expect less benefit" are retired. Boston and Fairbanks cards follow the same pattern. The rule is also a comment in `ui/regions.js`.
- **Why:** Gavin: "Your climate is ideal for" and "Handling the cold" read awkwardly; the card must logically flow from its header.
- **Decided by:** Gavin.
- **Refs:** `ui/regions.js` (`CLIMATE`).
- **Status:** active
- **Update (2026-11-08):** the design-temperature stat (e.g. "8 °F, a very cold night") above the cards is removed from the climate page (Gavin: it was random). The installer report still lists the design temperature.

_D-021 update (2026-11-08):_ Gavin: the Home type list shows only single-family detached and attached; the disabled mobile-home and multi-family entries are removed, not greyed out.

_D-021 update (2026-11-08):_ Gavin: size groups with no ResStock homes are removed from the size dropdown instead of greyed out. If a previous choice becomes unavailable, the nearest available group is selected with a short note.

_D-019 update (2026-11-08):_ Gavin: the "What matters more to you?" slider is removed from the home step. The carbon-price dial on the results page remains the one place to set cost vs carbon.

### D-025 · 2026-11-08 · Boston typical home comes from the Boston ResStock extract (definitive reference)
- **Workstream:** UI (with Data)
- **Decision:** The "typical Boston home" on the home step is built from Gavin's Boston ResStock extract (`datasets/resstock/boston_metadata_upgrade0_all_types.csv`, amy2018 release 1, baseline upgrade 0), not hand-set guesses. Population: single-family detached, 500-3999 sq ft (0-499 and 4000+ dropped, 122 models). Fields: size = weighted median (1,698 sq ft); heating fuel = weighted mode (natural gas, 80%); draftiness = weighted median infiltration (15 ACH50 or more = drafty). Median yearly use for reference: 8,012 kWh, 1,013 therms. Thermostat (68 F), prices, rebates and installed cost are not in ResStock and stay hand-set placeholders. **This extract is the definitive reference for the Boston typical home going forward; change it only by updating the extract and rebuilding `ui/resstock.js`.**
- **Why:** Gavin asked for the typical home to be constructed from the data and noted as the reference. (He wrote "ComStock"; this reads that as the ResStock extracts he produced.)
- **Decided by:** Gavin.
- **Refs:** `tools/build_resstock_ui.py` (`typical`), `ui/resstock.js`, `ui/app.js` (`TB`). The same medians and modes are also computed for Minneapolis and Fairbanks but not yet applied.
- **Status:** active

_D-021 update (2026-11-08):_ Gavin: the "Size groups" toggle (9 or 4 sizes) is removed from the home step; only the 7 fine size bins are offered.

_D-021 update (2026-11-08):_ Gavin: for visual purposes the top size bin is labelled "3000+" instead of "3000–3999". Display only: the data and statistics still use ResStock homes of 3000–3999 sq ft.

_D-005 update (2026-11-08):_ Gavin: keep only the green "lichen" theme. The theme switcher, the sand, sage and paper themes, the `?theme=` option and their extra fonts are removed.

_D-020 update (2026-11-08):_ Gavin: no citation list. Each numbered citation on the climate page is now a direct link (new tab) to its source; citations whose source has no URL (team data) show no marker. The Sources section and its tag legend are removed. Source data stays in `ui/regions.js` (`SOURCES`).
