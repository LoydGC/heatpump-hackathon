# Interfaces and handoffs

What each workstream provides to, and needs from, the others. Each workstream owns its own section and keeps it current; this file is edited in place (history is in git and [AUDIT.md](AUDIT.md)). Nothing here is a plan; it only records what the teams agree on.

Workstreams: **UI** (front end), **Model** (optimization / engineering model), **Data** (data prep), **Infra** (repo, hosting, deploys).

## How to use

- When you start producing something another workstream will consume, add it under **Provides** (file/function/URL, format or schema, units, location in repo, status).
- When you need something from another workstream, add it under **Needs**, naming who it's from.
- When an interface changes, update the entry, add an [AUDIT.md](AUDIT.md) row, and add a [DECISIONS.md](DECISIONS.md) entry if it was a decision.
- Status values: `proposed` · `agreed` · `delivered` · `changed` · `dropped`.

Entry format:

```
- **Name** · from → to · status
  - What / where: file path, function, or URL
  - Format: columns or fields, units, time resolution
  - Owner: person · Updated: YYYY-MM-DD
  - Notes:
```

## Data

**Provides**

- **Heating degree-days by census division** · Data → Model · delivered (raw upload)
  - What / where: `Table_1.11_Heating_Degree-Days_by_Census_Division.xlsx` (repo root)
  - Format: as uploaded; not yet documented
  - Owner: Matteo-P58 · Updated: 2026-11-07
- **Minneapolis–St. Paul data pack** · Data → Model · delivered (unpacked in repo)
  - What / where: `data/` (originally uploaded as `data.zip` in `b7e8b32`, then unpacked in `49460e6`; `data/processed/`, `data/scripts/` and `data/README.md` were missing from that unpack and restored from the zip, see D-013). Contents are described in [`data/README.md`](../data/README.md)
  - Model-ready (`data/processed/`): `model_inputs_minneapolis.json` (all scalar inputs: design temps, prices, emission factors, rebates, file pointers); `msp_weather_TMYx.2011-2025.csv` (main weather, 8,760 hourly rows); `msp_weather_TMYx.2009-2023.csv` and `msp_weather_TMY3.csv` (alternate / cold stress test); `hp_carrier_37MUHAQ_heating_curves.csv` (6 sizes, capacity and COP vs outdoor temp); `miso_hourly_grid_carbon_2025.csv` (8,760 hours of grid gCO2/kWh)
  - Raw (`data/raw/`): EPW weather, ASHRAE PDF, EIA prices, Xcel TOU notes, emission factors, rebates, NEEP heat pump tables, MISO grid chunks
  - Scripts (`data/scripts/`): `epw_to_csv.py` (EPW to hourly CSV), `extract_tool_text.py` (pulls text out of a tool-result JSON)
  - Flagged assumptions for Model/UI: grid CO2 is an average-emissions approach; TOU prices are assumed; CenterPoint hybrid rebate requires switchover at 40 °F or lower
  - Format: see [`data/README.md`](../data/README.md)
  - Owner: sharvis3 · Updated: 2026-11-07
- **Candidate source list** · Data → all · delivered
  - What / where: `DATASETS.md`

**Needs**

- _(add)_

## Model

**Provides**

- **Frontend data (model output)** · Model → UI · delivered
  - What / where: `model/results/frontend_data.json`, rebuilt by `python3 export_frontend.py` from `model/`. Also in `model/results/`: `sweep.csv`, `step5_*.csv`, `step6_preheat.csv`. Details in [`model/README.md`](../model/README.md)
  - Format: one static JSON, no Python needed to read it; the site fetches it as `model/results/frontend_data.json` (kept in the deploy by `.vercelignore`, untested on Vercel, see D-013)
  - Owner: sharvis3 · Updated: 2026-11-07

**Needs**

- **Processed Minneapolis data** · from Data · `data/processed/` (loaded by `model/data.py`, which resolves `<repo>/data/processed/`)

## UI

**Provides**

- **Guided 4-step page** · UI → all · delivered (prototype, placeholder numbers)
  - What / where: `index.html` (root, static), `ui/app.js` (wizard), `ui/charts.js`, `ui/regions.js` (region data), `ui/model-stub.js` (placeholder model). No build step.
  - Flow: Location → Climate summary → Home details → Results. Steps are gated: you can go back to any step already reached, never forward past it (direct `#results` URLs fall back to step 1). Changing an earlier answer re-renders later steps.
  - Owner: Gavin (via Claude) · Updated: 2026-11-07

**UI/Model handoff (proposed)**

The results page calls `window.HeatPumpModel.run` and nothing else. `ui/model-stub.js` is a placeholder implementation (`isPlaceholder: true`). To plug in the real model, load a script after it that replaces `window.HeatPumpModel` (or `run`) with the same shape, and return `isPlaceholder: false` so the "placeholder numbers" banner hides. `run` may return a value or a Promise (e.g. a `fetch` to a Model-owned JSON file or service).

`HeatPumpModel.run(inputs) -> outputs`

Inputs (built by `modelInputs()` in `ui/app.js`; units in names):

```
{ schemaVersion: 1,
  region:   { id, name, designTempF, monthlyMeanF[12], monthlySdF[12], dataStatus: "placeholder" | "data.zip" },
  home:     { source: "typical" | "custom", floorAreaSqft, envelope: "drafty"|"average"|"tight",
              heatLossWPerF, thermostatF, currentHeat: "gas"|"oil"|"propane"|"electric"|"wood"|"kerosene" },
  prices:   { electricityUsdPerKWh, fuelUsdPerUnit, fuelUnit, timeOfUse: bool, fuelUsdPerKWhHeat },
  emissions:{ gridKgCo2PerKWh, fuelKgCo2PerUnit, fuelKgCo2PerKWhHeat },
  costs:    { installedUsdPerTon, rebatesUsd, lifetimeYears },
  priority: 0..1,          // 0 = lowest cost, 1 = lowest CO2
  sizeTons: number | null  // null = model picks; otherwise evaluate this size
}
```

Outputs (everything the results page draws):

```
{ schemaVersion: 1, isPlaceholder: bool, modelVersion: string,
  recommendedSizeTons, sizeTons, capacityKwAt5F, designLoadKw, lifetimeYears,
  annual:   { today:    { costUsd, co2Kg, heatKWh },
              heatPump: { costUsd, co2Kg, electricityKWh, heatPumpShare /*0..1 of heat load*/ } },
  monthly:  [ 12 x { today: { costUsd, co2Kg }, heatPump: { costUsd, co2Kg } } ],   // Jan..Dec
  upfront:  { installedUsd, rebatesUsd, netUsd },
  paybackYears: number | null,
  lifetime: { costUsd, co2Kg, todayCostUsd, todayCo2Kg },        // heat pump life totals
  sizes:    [ { sizeTons, lifetimeCostUsd, lifetimeCo2Kg, heatPumpShare, paybackYears } ],  // sweep for the trade-off charts
  notes:    [ string ] }                                             // shown under results
```

Step 2 (climate page) does not call the model: its text is hand-written per region in `ui/regions.js` (`CLIMATE`, `CLIMATE_TYPES`, `SOURCES`), with each claim tagged Research / Team data / Our reasoning / Not researched and cited in a Sources footer.


**Model v1 mapping (Minneapolis only; added 2026-11-07)**

Status: **v1 is not exactly what the end model will be, but closer to what the team is thinking.** The UI loads `model/results/frontend_data.json` (relative `fetch`; the local server serves the repo root; `.vercelignore` re-includes it; no embedded copy, so opening `index.html` from `file://` falls back to the placeholder stub with a notice). Code: `ui/model-v1.js` (adapter) and `runModel()` in `ui/app.js`. Boston, Montréal and Fairbanks still use the placeholder stub.

Lookup: `recommendations["<tariff>|<weather>|credit<0|4000>|<smart|standard>"]["<lambda>"]`.

| UI input | Model key | Notes |
|---|---|---|
| Carbon dial (results page; same value as the home-step slider), 13 snapped positions | lambda, `meta.lambda_grid_usd_per_t` = LAMS in `model/sweep.py`: 0, 10, 25, 50, 75, 100, 150, 200, 300, 400, 500, 750, 1000 ($ per tonne CO2) | `state.priority = index/12`; default (untouched) = index 10 ($500/t), roughly where the heat pump starts to win |
| Smart meter toggle (`timeOfUse`) | tariff `tou` (on) or `flat` (off) | TOU rates are assumed in the model |
| Winter: typical / very cold (More scenarios) | weather `tmyx_main` / `tmy3_cold` | |
| AC: keeping / replacing too (More scenarios) | credit `0` / `4000` | $4,000 is a scenario value, not sourced |
| Rebates on/off | not a model axis: model nets $2,000 Xcel (+ $1,100 CenterPoint if `centerpoint_rule`) inside `up_front`; UI adds them back when off | the model's *recommendation* is always computed with rebates on |
| (none yet) | controller `smart` fixed; `standard` (installer-set fixed switchover) has no UI | |
| Home size, envelope, thermostat, current fuel, prices, installed $/ton, heat loss | **not used** by v1 (fixed 15 kW house, gas furnace baseline, fixed prices) | UI says so on the results page |

| Model output | UI element |
|---|---|
| `size_kbtuh` (0 = keep gas), `/12` = tons | Suggestion card; 0 shows "Keep your gas furnace" |
| `controller`, `switchover_C`, `centerpoint_rule` | Suggestion subtext (CenterPoint: heat pump runs above 40 F) |
| `annual_cost`; `sum(monthly.base_cost)` | Yearly bill tile (heat pump vs today) |
| `annual_co2_t`; `sum(monthly.base_co2_kg)` | CO2 per year tile |
| `up_front` | Upfront tile; installed = $5,286 + $178.6 x kBtu/h, rebates and AC credit backed out from it |
| `payback_years` | UI recomputes `up_front / (base annual cost - annual_cost)`; null shows "Not on bills alone" |
| `lifetime_cost`, `lifetime_co2_t`, `tonnes_saved_15y`, `usd_per_tonne` | Money/Carbon folds, dial sentence ("$X per tonne avoided") |
| `monthly.*` | Monthly CO2 and bill charts, cumulative chart derived from `up_front` + years x `annual_cost` |
| `hp_share` | "covers about N% of your heating" |
| `recommendations[...]` across all lambda | "How the recommendation changes with the dial" table; best heat pump option = highest lambda with `size_kbtuh > 0` |
| `meta.assumptions`, `meta.sizes_kbtuh` | Notes under results, PDF report size range |
| `peak_kW`, `load_duration` | **no UI yet** (load-duration chart is a natural next addition) |

`HeatPumpModel.run` inputs gained `scenario: { coldWinter, acCredit, rebatesOn, lamIdx }`; the adapter returns the stub's output shape plus `v1: { rec, lam, lamIdx, scenario, sizeKbtuh, usdPerTonne, ... }`, `sizes: []`, `isPlaceholder: false`, `capacityKwAt5F: null`.

v1 placeholders (from `model/README.md`): installed cost curve, rebates (verify), TOU rates, AC credit, fixed house, grid carbon is a 2025 MISO average (not marginal), discount rate 0, heating only.

**New UI-side fields (rebates + report, 2026-11-07)**

- **Smart meter (TODO, flesh out):** `prices.timeOfUse` boolean; placeholder 10% discount in the stub. Model/Data should supply real TOU price schedules per region; usage-data calibration is not designed yet (see D-014).
- `window.HP_REBATES` (`ui/rebates.js`): `REGION[id] = { intro, programs[{name, level, status, amount, note, url, checked}], paperwork[], amountsNote }` plus `SOURCES[]`. Hand-written snapshots dated 2026-11-07, not data-driven.
- UI calls `HeatPumpModel.run` twice per render (rebates on/off, same `sizeTons`) via `costs.rebatesUsd`. Model needs no change but must keep `rebatesUsd = 0` valid and `upfront`, `paybackYears`, `lifetime` consistent with it.
- Report reads from `run` outputs: `designLoadKw`, `capacityKwAt5F`, `sizeTons`, `recommendedSizeTons`, `annual.*.heatPumpShare`, `isPlaceholder`, `modelVersion`. It shows a size range of ±1 entry in `HeatPumpModel.sizes`. Optional Model outputs that would improve it: `designLoadBtuh`, `backupSwitchoverF`, `backupKwNeeded`.
- **Data → UI (new):** a verified rebates pack per region (program, amount formula, deadline, URL, fuel condition). Open discrepancy: CenterPoint hybrid rebate is $1,100 in data.zip but $400 on CenterPoint's page on 2026-11-07. Boston `rebatesUsd` ($8,000) and Montréal ($3,000) are placeholders; Mass Save is $/ton and LogisVert is $/BTU-h.

**Needs**

- ~~`model/results/frontend_data.json` from Model (not wired into `index.html` yet)~~ wired for Minneapolis on 2026-11-07 (see Model v1 mapping).
- **Data → UI:** region packs for Boston, Montréal and Fairbanks like the Minneapolis pack (monthly or hourly temperatures, design temp, electricity and fuel prices, grid CO2, rebates). Today only Minneapolis values in `ui/regions.js` come from `data.zip`; the other three are placeholders and are labeled as such on the results page.
- **Model → UI:** an implementation of `HeatPumpModel.run` in the shape above, and agreement on whether the model runs in-browser (JS), is precomputed to JSON per region and size, or sits behind an endpoint.
- **Open question:** free-text locations outside the four regions are not supported (no geocoding without a key). Adding more regions means adding an entry to `ui/regions.js`.

## Infra

**Provides**

- **Production site** · Infra → all · delivered
  - What / where: https://heatpump-hackathon.vercel.app; manual deploys only, see `docs/local-and-deploy.md`
- **Local preview** · Infra → all · delivered
  - What / where: `run-local-windows.bat`, `run-local-mac.command`
