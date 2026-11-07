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
- **data.zip (Minneapolis–St. Paul data pack)** · Data → Model · delivered (zipped; not unpacked in repo)
  - What / where: `data.zip` (repo root); its own `data/README.md` describes contents
  - Model-ready (`data/processed/`): `model_inputs_minneapolis.json` (all scalar inputs: design temps, prices, emission factors, rebates, file pointers); `msp_weather_TMYx.2011-2025.csv` (main weather, 8,760 hourly rows); `msp_weather_TMYx.2009-2023.csv` and `msp_weather_TMY3.csv` (alternate / cold stress test); `hp_carrier_37MUHAQ_heating_curves.csv` (6 sizes, capacity and COP vs outdoor temp); `miso_hourly_grid_carbon_2025.csv` (8,760 hours of grid gCO2/kWh)
  - Raw (`data/raw/`): EPW weather, ASHRAE PDF, EIA prices, Xcel TOU notes, emission factors, rebates, NEEP heat pump tables, MISO grid chunks
  - Flagged assumptions for Model/UI: grid CO2 is an average-emissions approach; TOU prices are assumed; CenterPoint hybrid rebate requires switchover at 40 °F or lower
  - Format: see `data/README.md` inside the zip
  - Owner: sharvis3 · Updated: 2026-11-07
- **Candidate source list** · Data → all · delivered
  - What / where: `DATASETS.md`

**Needs**

- _(add)_

## Model

**Provides**

- _(add)_

**Needs**

- _(add)_

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

**Needs**

- **Data → UI:** region packs for Boston, Montréal and Fairbanks like the Minneapolis pack (monthly or hourly temperatures, design temp, electricity and fuel prices, grid CO2, rebates). Today only Minneapolis values in `ui/regions.js` come from `data.zip`; the other three are placeholders and are labeled as such on the results page.
- **Model → UI:** an implementation of `HeatPumpModel.run` in the shape above, and agreement on whether the model runs in-browser (JS), is precomputed to JSON per region and size, or sits behind an endpoint.
- **Open question:** free-text locations outside the four regions are not supported (no geocoding without a key). Adding more regions means adding an entry to `ui/regions.js`.

## Infra

**Provides**

- **Production site** · Infra → all · delivered
  - What / where: https://heatpump-hackathon.vercel.app; manual deploys only, see `docs/local-and-deploy.md`
- **Local preview** · Infra → all · delivered
  - What / where: `run-local-windows.bat`, `run-local-mac.command`
