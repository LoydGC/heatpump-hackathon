# Notebook parameters vs dashboard inputs

Compared: `model.ipynb` on main (d5db450, papermill-parameterized) against `index.html`, `ui/app.js` (`modelInputs()`), `ui/regions.js`, `ui/rebates.js`, `docs/REFERENCE_FACTS.md`, `datasets/resstock-dropdown-options.md`. Written 2026-11-08. Candid internal doc, not front-end copy.

## Headline

- The notebook declares 8 parameters (+ output path). **Only 4 do anything**: carbon price, electricity price, secondary fuel price, rebate type. **`location`, `square_footage`, `current_heating_system`, `chosen_set_point` are declared but never read.** The run is hardcoded to Minneapolis, ResStock building 274938 (`data/raw/nrel_parquet/mn/274938-0.parquet`), `data/raw/weather/mn.csv`, 68 F (cell 23 never passes `setpoint_f`; the sim default is 68), 80% gas furnace.
- Papermill can set all 8 today, but 4 of them will change nothing. `find_closest_row()` (picks a ResStock home by fuel, setpoint, unified R, area) exists and is demo-called with literals, but nothing connects it to the parameters or to the parquet load.
- Output `winner.json` is one row (machine profile, tons, hp_coverage_pct, kWh, therms, op cost, CO2, capital cost, rebate, savings, net capital, payback). The UI contract (`HeatPumpModel.run(inputs)`) needs monthly series, a size sweep, baseline "today" vs heat pump, lifetime totals. Not provided.

## 1. Parameter-by-parameter map

| Notebook parameter (default) | UI input that feeds it | Status | Mismatch detail |
|---|---|---|---|
| `dollars_per_ton_co2` (300) | Cost/carbon dial (`#dial`, 13 steps, `priority`, `lamIdx`) | **Mismatched** | UI sends a dial position, not a price. v1 lambda grid is $/t on 13 steps, default idx 10 = $500/t. Notebook default is $300. Comment says "metric tons" and code divides kg by 1000, so the unit is $/tonne (not short ton). UI needs a lamIdx -> $/t lookup and the notebook must be re-run per dial step (or swept inside). |
| `location` ("Minneapolis") | City picker (`#place`, `regionId`: boston / minneapolis / fairbanks) | **Mismatched, and unused** | Notebook never reads it. Allowed values undefined; only Minneapolis data is wired (`MN_upgrade0.csv`, MN parquet, mn.csv weather, `in.city == "MN, Minneapolis"`). UI ids are lowercase slugs. |
| `square_footage` (1500) | Home size dropdown (`#sbin`, 7 bins 500-3999) -> `floorAreaSqft` = bin mean | **Mismatched, and unused** | Notebook wants a number; UI gives a bin (sends both `sizeBin` and a bin-mean sqft). Not read: building is fixed. `find_closest_row` has `area` but is not called with it. |
| `current_heating_system` ("Natural Gas") | Heating today (`#heat`, `currentHeat`: gas / oil / propane / electric / wood / kerosene) | **Mismatched, and unused** | Value strings differ ("Natural Gas" vs `gas`; ResStock `in.heating_fuel` uses its own strings, e.g. Natural Gas, Fuel Oil, Propane, Electricity). Notebook model has only an 80% gas aux; no other fuel path. |
| `chosen_set_point` (68) | Thermostat (`#tstat`, `thermostatF`, 55-78) | **Present name/unit match (F), unused** | Never passed to `run_thermal_hp_sim`; sim default 68 always used. |
| `price_per_kWh_electric` (0.12; None -> 0.12) | Electricity (`#elec`, `electricityUsdPerKWh`) | **Present** | Same unit ($/kWh). UI region defaults: Mpls 0.1644, Boston 0.31, Fairbanks 0.26 (notebook default 0.12 is stale vs UI). Used. |
| `price_per_therm_secondary` (None -> 1.20) | Fuel price (`#fuelPrice`, `fuelUsdPerUnit`) | **Mismatched** | UI unit follows the fuel (therm, gallon, cord, kWh). Notebook is therms only. UI also has `fuelUsdPerKWhHeat` (price / (kWh per unit x efficiency)); that is the cleanest single hand-off. Name says "secondary", but it is really the current/backup fuel. UI Mpls gas default $1.03/therm. |
| `rebate_type` ('partial', full / partial / none) | Income toggle (`state.income`: none / partial / full -> $0 / $4,000 / $8,000) + "Rebates you expect ($)" (`#rebates`) + `rebatesOn` toggle | **Mismatched** | See section 3. Names match (none/partial/full) but the meaning differs: notebook `full` = min(cost, 8000), `partial` = min(cost/2, 4000); UI adds a flat dollar amount. UI sends dollars, not a type. UI applies income tiers to Minneapolis only. |
| `winner_output_path` ('winner.json') | n/a | Notebook-only | Plumbing. |

## 2. Lists

### (1) UI inputs with no notebook parameter (NOT IN MODEL)
- **Installed cost per ton** (`#costTon`, `installedUsdPerTon`). Notebook hardcodes `capital_cost = 1075.2*tons + 1193` (fixed + variable). UI is a flat $/ton with no fixed term.
- **Heat loss, W per F** (`#ua`, `heatLossWPerF`). Notebook uses ResStock heating load (kBtu) from the parquet, not a UA.
- **Rebates you expect ($)** (`#rebates`) and rebates on/off toggle. No dollar-amount input in the notebook.
- **Lifetime years** (15, constant in UI, `LIFETIME_YEARS`). Notebook is annual only; payback only.
- **Region weather** (UI sends design temp, monthly mean/sd) and **grid CO2** (`gridKgCo2PerKWh` per region: 0.435 / 0.24 / 0.55). Notebook hardcodes 0.45 kg/kWh and gas 5.30 kg/therm. Not parameters.
- **Fuel CO2 and efficiency per fuel** (UI `FUELS`). Notebook hardcodes furnace 0.80, gas 5.30.
- **Envelope / draftiness** (not a visible input any more; derived into heat loss).
- **Size override** (`sizeTons`) and recommended-size output: UI expects a sweep with a chosen size and a list `sizes[]`.
- **Time-of-use** flag: removed from UI, still in the input schema; no notebook support.

### (2) Notebook parameters the UI doesn't collect
- None missing outright. Gaps in how the UI feeds them:
  - `dollars_per_ton_co2`: UI collects it only indirectly (the dial).
  - `rebate_type`: UI never asks "full / partial / none"; it asks an income toggle in $ (and only for Minneapolis).
  - `square_footage`: UI collects a bin, not a number (a bin mean is substituted).
- Notebook hardcodes that behave like inputs but are not parameters: setpoint passed to sim, electricity/gas CO2 factors, furnace efficiency, HP COP column (`cop_max` in cell 23; `cop_rated` default in the loader), building choice, weather file, state abbreviation (`"MN"`), `in.city` filter, `building_type == "Single-Family Detached"`.

### (3) Expected from the UI but NOT in the model
Flagged items. Each is something the UI/data work assumes the model handles; the notebook does not.

1. **Boston and Fairbanks.** Notebook reads only `MN_upgrade0.csv`, `nrel_parquet/mn`, `weather/mn.csv`. No MA/AK metadata, parquet, weather, or grid CO2. (UI uses placeholder monthly temps for both; Boston ResStock extract is the declared definitive reference, D-025.)
2. **Single-family attached.** Notebook filters `Single-Family Detached` only. UI/ResStock extracts include SFA (Mpls 26, Boston 72). UI treats home type as always SFD now, so lowest priority.
3. **Floor-area bins.** Notebook: free number, nearest-row match only in an uncalled function. UI: 7 fixed bins (500-3999; 0-499 and 4000+ dropped by decision). No bin lookup or bin -> representative home pick.
4. **Heating fuel types (oil, propane, electric resistance, wood, kerosene).** Notebook backup is only a gas furnace (`gas_rate_per_therm`, 0.80 eff, 5.30 kg/therm); `current_heating_system` unused. Fairbanks (oil ~94%) cannot be modeled at all. Needs fuel price in $/kWh-heat, fuel CO2 per kWh-heat, efficiency, and electric-resistance as a zero-aux case.
5. **Income-based rebate tiers and rebate logic.** Notebook tiers: `full` (<80% AMI, cap $8,000 or full cost), `partial` (80-150% AMI, half cost cap $4,000), `none`. UI: income toggle 0 / $4,000 / $8,000 (the $4,000 tier is unsourced per REFERENCES.md) plus standard utility rebates (Mpls Xcel $2,000, +$1,100 if gas kept; Boston $8,000; Fairbanks $0) and a user-editable amount. Notebook has no utility rebate, no region-specific rebate, no gas-backup add-on, and `min(cost/2, 4000)` vs a flat $4,000 will disagree on small installs. Needs one agreed rebate function.
6. **Home vintage.** UI does not use vintage (R-06). Notebook infers envelope from insulation columns (unified R, area-weighted harmonic mean), so vintage matters only through R-values, and nothing exposes an "older / newer" input. Consistent but undocumented; nothing needed unless vintage returns.
7. **Premium vs standard units.** Notebook loads ~21 NEEP profiles by `cop_max` and picks the lowest grand cost; capital cost is only a function of nominal tons. No premium/standard tier, brand, or cost per profile. UI has no such input either, so this is only a gap if you planned a unit-grade choice.
8. **Electricity-rate options.** Notebook: one flat $/kWh. UI: flat price per region; time-of-use removed but still in the schema (`timeOfUse`, 0.9 multiplier in model-patrick.js). No TOU, no hourly price, no per-region default in the notebook.
9. **Thermostat / setpoint effect.** UI exposes it; notebook ignores it (demand comes from ResStock parquet at the fixed building's own setpoint). Needs either a UA-based load or a load scaling by setpoint.
10. **Home size effect.** Same: sq ft never changes the load, which is read from building 274938.
11. **Cost vs carbon dial -> price curve.** UI shows a 13-step dial plus a table of $ per tonne avoided across steps; notebook returns one winner for one price. Needs a sweep output.
12. **Output schema.** UI needs `annual.today` vs `annual.heatPump` (cost, CO2, kWh, HP share), `monthly[12]`, `upfront {installed, rebates, net}`, `paybackYears`, `lifetime`, `sizes[]`, `recommendedSizeTons`, `designLoadKw`, `capacityKwAt5F`. Notebook gives annual only, no monthly, no lifetime, and winner is dropped (NaN/idxmin error) when no heat pump saves money.
13. **ResStock reference line** (median kWh / therms / other fuel by city, type, bin). Not a model input, but the UI shows it; nothing in the notebook ties modeled load back to it (sanity check absent).

## 3. Details worth fixing first

- **Unit risk, capital cost:** `capital_cost(tons)` is `1075.2*tons + 1193`; the docstring says "size_kbtuh ... valid 18-60", which is kBtu/h. If the intended input is kBtu/h (tons x 12) the result is ~12x off. Same caveat already noted for equation.py (754b8cb).
- **Ton vs tonne:** `dollars_per_ton_co2` comment says "metric tons"; keep as $/tonne and rename to match the dial.
- **No-winner case:** `df_res_w_sav` can be empty (e.g. gas cheap, carbon price low); `idxmin()` then raises. UI should get "no heat pump beats today".
- **Hardcoded demo cell:** cell 21 runs a user-defined COP/capacity example with 0.17 $/kWh at import time; harmless but misleading in papermill logs.
- **`! pip install papermill` in cell 4** and the missing data/raw inputs (parquet, NEEP csv, weather) mean the notebook only runs where those files exist; confirm what Vercel/CI would need.
