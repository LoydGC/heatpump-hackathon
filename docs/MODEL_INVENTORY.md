# Model inventory

Written 2026-11-08 from `main` (cf872ba) and `claude/dashboard-resstock-dropdowns`. Code was read, not run. Model code was not edited.

**Branch note.** Every model-like item below is identical on `main` and `claude/dashboard-resstock-dropdowns`, except where marked. The dashboard branch is ahead of `main` by UI edits (`index.html`, `ui/app.js`, `ui/charts.js`, `ui/regions.js`, `ui/resstock.js`, `tools/build_resstock_ui.py`) and three docs (`docs/DECISIONS.md`, `AUDIT.md`, `INTERFACES.md`, plus new `docs/REFERENCE_FACTS.md`). The dashboard branch also lacks two raw data files that `main` has (`data/raw/prices/capital_cost_regression_data.xlsx`, `data/raw/weather/mn.csv`). The other `claude/project-thread-*` branches were not reviewed for model code.

## Summary

| # | Item | Location | Branch | Author | Real or placeholder | Feeds dashboard? |
|---|---|---|---|---|---|---|
| 1 | Model v1 (Python hourly sim + sweep + recommender) | `model/` | main, dashboard | Sharvi (`sharvis3`, one commit "model_v1", 2026-11-07) | Real engine, placeholder economics; one fixed house, Minneapolis only | Yes, via precomputed JSON, Minneapolis only |
| 2 | Pre-heating LP controller | `model/preheat.py`, `step6.py` | main, dashboard | Sharvi | Real, analysis only | No (result quoted in README) |
| 3 | Model v1 adapter | `ui/model-v1.js` | main, dashboard | Claude, for Gavin | Real adapter | Yes (Minneapolis) |
| 4 | UI stand-in model | `ui/model-stub.js` | main, dashboard | Claude, for Gavin | Placeholder (`isPlaceholder: true`) | Yes, for Boston and Fairbanks, and Minneapolis if v1 JSON fails to load |
| 5 | Patrick's notebook | `model.ipynb` | main, dashboard | Patrick O'Toole (2026-11-07) | Unfinished start | No |
| 6 | ResStock UI builder | `tools/build_resstock_ui.py` -> `ui/resstock.js` | dashboard only (main has an earlier version) | Claude, for Gavin | Real data summary, not a simulation | Yes (dropdowns, reference figures, Boston typical home) |
| 7 | Rebate and region tables | `ui/rebates.js`, `ui/regions.js` | main, dashboard | Claude, for Gavin | Snapshots and placeholders | Yes |
| 8 | Comparables research | `docs/COMPARABLES.md`, `docs/comparables.html` | main, dashboard | Claude | Research, not a model | No |
| 9 | Input data the models read | `data/processed/*`, `data/raw/*` | main, dashboard | Data workstream | Mixed (see below) | Indirectly |

## 1. Model v1 (`model/`)

- **Purpose.** Answers "what heat pump size and control strategy minimises 15-year cost plus a carbon price?" for one Minneapolis house. The carbon price (lambda, $/tonne CO2) is the dashboard dial.
- **Pipeline.** `data.py` and `heatpump.py` load inputs and interpolate capacity/COP. `simulate.py` runs 8,760 hourly steps. `sweep.py` precomputes 1,444 runs into `results/sweep.csv`. `recommend.py` picks the best option per lambda. `export_frontend.py` writes `results/frontend_data.json`.
- **Controllers** (`simulate.py`): `dumb` (heat pump up to capacity, furnace covers the rest), `switch` (fixed switchover temperature), `smart` (each hour, uses whichever of heat pump or furnace has the lower cost plus lambda times CO2 per kWh of heat). `hp_force_above_C=4.5` models the CenterPoint rebate condition.
- **Inputs.**
  - Weather: three Minneapolis-St. Paul files (`tmyx_main` typical, `tmyx_alt`, `tmy3_cold` stress test).
  - Hourly 2025 MISO grid carbon (`data/processed/miso_hourly_grid_carbon_2025.csv`).
  - Prices, furnace AFUE, rebates and design temperature from `data/processed/model_inputs_minneapolis.json`.
  - Carrier 37MUHAQ heating curves (6 sizes x 4 temperatures) from `data/processed/hp_carrier_37MUHAQ_heating_curves.csv`.
- **Scenario axes.** Tariff flat or TOU; weather typical or cold; AC credit $0 or $4,000; controller smart or standard; 13 lambda values (0 to 1000); sizes 18, 24, 30, 36, 48, 60 kBtu/h plus "keep gas".
- **Outputs.** Per scenario and lambda: `size_kbtuh`, controller, switchover, annual cost and CO2, lifetime cost and CO2, tonnes saved, $/tonne, payback, peak kW, heat pump share, upfront cost, 12-month cost and CO2 arrays. Also a `load_duration` block.
- **Key assumptions** (from `model/README.md`; the README labels most as placeholders).
  - House: 15 kW heat loss at -20.6 C, 17 C balance point, no thermal mass in the main engine.
  - Installed cost $5,286 + $178.6 per kBtu/h, fitted to a $8.5k to $16k range, not sourced.
  - Rebates $2,000 Xcel + $1,100 CenterPoint, to verify.
  - TOU rates assumed.
  - AC credit is a scenario value.
  - Average (not marginal) grid emissions.
  - 15-year life, no discounting.
  - Heating only.
  - 10% cycling penalty below minimum output.
  - Capacity forced non-increasing as it gets colder, to handle odd 48 and 60 kBtu/h data.
- **Status.** The engine is real and has 6 tests (`model/tests/test_model.py`: heat balance, gas-only hand calculation, capacity cutoff, switchover, CenterPoint rule, smart not worse than gas-only). Inputs and economics are partly placeholders. It simulates one house, so the dashboard's home size, envelope, fuel and price inputs do not change its numbers.
- **Headline results** (README, flat rates, typical weather): the furnace stays the best choice below about $490/t; above that, a 30 kBtu/h hybrid that switches to gas below about -4 C. In the shipped JSON at flat/typical/no credit/smart, lambda 0 to 300 returns "keep gas" ($1,309 a year) and lambda 500 returns 30 kBtu/h at $1,479 a year with no payback.
- **Not wired to the UI.** `peak_kW` is only partly shown; `load_duration` has no chart yet.
- **Analysis scripts.** `check_data.py` (sanity checks), `step3.py` (smart vs best fixed switchover), `step6.py` (pre-heating), `plot_step2` through `plot_step6.py` (deck figures; PNGs in `model/`). Output CSVs and `step6_console.txt` are in `model/results/`.

## 2. Pre-heating controller (`model/preheat.py`)

- **Purpose.** Tests whether using the house as thermal storage saves money (load shifting) on TOU rates.
- **Method.** Lumped thermal-mass house (10 kWh/C, comfort band 19 to 22 C, setpoint 20 C), perfect-foresight linear program over the year via SciPy HiGHS. Re-planned with realised COP to capture the cycling penalty. It is an upper bound on what pre-heating can do. Furnace output and temperature ramp are capped.
- **Result.** About 3.7% savings, only on TOU at low carbon prices (README).
- **Status.** Real analysis, not used by the dashboard.

## 3. Model v1 adapter (`ui/model-v1.js`)

- Fetches `model/results/frontend_data.json` and returns the same shape as the stub, plus a `v1` block. Only handles Minneapolis (`regionId: "minneapolis"`).
- Mapping from UI inputs to model keys is in `docs/INTERFACES.md` ("Model v1 mapping"): the carbon dial maps to lambda, the smart-meter toggle to tariff, "very cold winter" to `tmy3_cold`, the AC question to credit. Controller is fixed to `smart`. Rebates on/off is applied in the UI after the fact; the model's recommendation always assumes rebates.
- If the JSON cannot be fetched (for example the page is opened from `file://`), Minneapolis falls back to the stub.

## 4. UI stand-in model (`ui/model-stub.js`)

- **Purpose.** Gives the dashboard something to show for regions without a real model. Exposes `window.HeatPumpModel.run(inputs)`; this is the interface a real model replaces (`docs/INTERFACES.md`).
- **Method.** Synthesises hourly temperatures from monthly mean and spread (inverse normal CDF), applies a rule-of-thumb heat loss (W/F per sq ft by envelope), a generic cold-climate capacity and COP curve with a -22 F cutoff, and nine sizes from 1 to 5 tons. Picks the size minimising a weighted, normalised blend of lifetime cost and CO2 (weight from the dial). Installed cost is a per-ton figure.
- **Inputs.** Region (monthly climate, design temperature), home (heat loss, thermostat), prices, fuel emissions, grid factor, costs, priority weight.
- **Outputs.** Annual and monthly cost and CO2 for today vs heat pump, upfront costs, payback, lifetime totals, per-size table.
- **Status.** Placeholder, flagged `isPlaceholder: true`. Boston and Fairbanks results come from this.

## 5. Patrick's notebook (`model.ipynb`)

- **Purpose.** Start of a ResStock-based home model. Loads `data/raw/buildstock/MN_upgrade0.csv`, keeps selected columns (area, heating fuel, setpoint, insulation levels, equipment sizes), filters to Minneapolis, parses insulation strings into R-values, combines them into one parallel-heat-flow ("unified") R-value, and defines `find_closest_row(fuel, setpoint, unified_r, area)` to find the nearest ResStock home.
- **Intended link.** Per-building 15-minute parquet files are in `data/raw/nrel_parquet/mn/` (185 files, baseline upgrade 0), with a path helper in the notebook.
- **Status.** Unfinished. No loads, no heat pump logic, no outputs saved. Not connected to model v1 or the dashboard. It is the likely route to a per-home model that uses the user's actual home, which v1 does not do.

## 6. ResStock UI builder (`tools/build_resstock_ui.py`)

- **Purpose.** Builds `ui/resstock.js` from the city extracts in project folder `datasets/resstock/` (Minneapolis, Boston, Fairbanks North Star Borough; ResStock amy2018 release 1, baseline).
- **Outputs.** Dropdown options (7 fine size bins, 3 coarse bins; 0-499 and 4000+ dropped), per-cell reference figures (model count, mean size, weighted median kWh, therms, other-fuel kWh) for single-family detached and attached, and a "typical home" per city (weighted medians and modes: size, use, fuel, infiltration-based envelope class, vintage, wall, stories).
- **Status.** A data summary of ResStock's own simulated homes, not a model of ours. Boston's typical home overrides the placeholder in `ui/regions.js` (decision D-025). Run by hand against a project-folder path; the generated file is committed.
- **Branch.** The dashboard branch has the newer version (bin drops, Boston typical home). `main` has an earlier copy.

## 7. Rebate and region tables

- `ui/regions.js`: fuel properties and emission factors, envelope heat-loss rules, per-region climate, prices and typical homes. Minneapolis values come from the data pack; Boston and Fairbanks are placeholders.
- `ui/rebates.js`: plain-language rebate content, snapshots dated 2026-11-07. These feed text and the UI's rebate total, not model v1 (which has its own $2,000 + $1,100).

## 8. Comparables (`docs/COMPARABLES.md`, `docs/comparables.html`)

Research on other heat pump and sizing tools (Rewiring America, HEAT, NEEA dual-fuel analysis, Mass Save switchover calculator and others). Not a model, but the NEEA and Mass Save entries are the closest published analogues to model v1's switchover logic.

## 9. Input data

| File | What | Status |
|---|---|---|
| `data/processed/model_inputs_minneapolis.json` | Prices, emissions, rebates, design temperatures | Sourced (EIA); TOU assumed |
| `data/processed/msp_weather_*.csv` | Hourly typical and cold-year weather | Sourced (EnergyPlus weather) |
| `data/processed/miso_hourly_grid_carbon_2025.csv` | Hourly grid g CO2/kWh | EIA-930 generation mix times hard-coded factors; mean 435 g/kWh vs 459 from measured data (see `datasets/pudl/` in project files); builder script not in the repo |
| `data/processed/hp_carrier_37MUHAQ_heating_curves.csv` | Heat pump capacity/COP | NEEP data, one product |
| `data/raw/buildstock/MN_upgrade0.csv`, `data/raw/nrel_parquet/mn/` | ResStock Minnesota metadata and 185 building time series | Sourced; used only by the notebook |
| `data/raw/ashrae`, `eia`, `emissions`, `grid`, `heat_pumps` | Raw sources behind the processed files | Raw |

## How they relate

```
data/raw/*  -> data/processed/*  -> model/ (v1) -> model/results/frontend_data.json -> ui/model-v1.js --+
                                                                                                          +-> ui/app.js -> dashboard
ui/regions.js (placeholder regions) -> ui/model-stub.js --------------------------------------------------+
datasets/resstock/* -> tools/build_resstock_ui.py -> ui/resstock.js -> dropdowns, reference figures, Boston typical home -> ui/app.js

data/raw/buildstock + nrel_parquet -> model.ipynb   (dead end for now)
```

- The dashboard calls `ui/app.js` -> `runModel()`. If the region is Minneapolis and the v1 JSON loaded, it uses v1. Otherwise it uses the stub. Both return the same output shape.
- Two separate "models" therefore answer the same question with different methods. v1 is hourly with real weather and real heat pump curves but a fixed house. The stub is crude and synthetic but responds to every UI input.
- The ResStock extract does not feed any simulation. It only shows reference numbers beside the user's choices and sets Boston's typical home. The stub then uses Boston's typical size, fuel and envelope for its heat loss.
- Model v1 and the notebook use different building data (a hand-set 15 kW house vs ResStock homes). Nothing yet maps ResStock homes into v1.

## Gaps

- No real model for Boston or Fairbanks. The v1 engine reads only Minneapolis files; adding a city needs weather, grid, prices and rebate inputs.
- v1 ignores the user's home size, envelope, fuel and prices.
- v1 compares only against a gas furnace; it has no oil, propane or electric-resistance baseline, which Fairbanks (about 94% fuel oil) and parts of Boston need.
- The grid carbon file has no source script and sits about 5% below measured data.
- Cost curves, TOU rates and the AC credit are unsourced.
