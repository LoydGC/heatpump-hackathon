# model/ : heat pump sizing engine (Minneapolis, v1)

Python backend for the heat pump sizing optimizer. Place this folder at the **repo root**, next to `data/`
(`data.py` reads `../data/processed/`). Run scripts from inside `model/`.

```
pip install -r requirements.txt
python3 sweep.py             # rebuild results/sweep.csv  (1,444 simulations, ~1 min)
python3 export_frontend.py   # rebuild results/frontend_data.json for the UI
python3 -m pytest tests      # or run tests/test_model.py directly
```

## For the front end: use `results/frontend_data.json` (no Python needed)
The slider is a lookup:

    recommendations["flat|tmyx_main|credit0|smart"]["500"]      # key = tariff|weather|credit|smart or standard ; then lambda ($/t CO2)

Scenario inputs: tariff `flat`/`tou`; weather `tmyx_main` (typical) / `tmy3_cold` (stress test); AC credit `0`/`4000`;
controller `smart` (hourly) / `standard` (installer sets a fixed switchover temperature).
Slider values (lambda, $/t CO2): 0, 10, 25, 50, 75, 100, 150, 200, 300, 400, 500, 750, 1000.

Each result: `size_kbtuh` (0 = keep gas furnace only), `controller`, `switchover_C`, `centerpoint_rule`, `annual_cost`,
`annual_co2_t`, `lifetime_cost`, `lifetime_co2_t`, `tonnes_saved_15y`, `usd_per_tonne`, `payback_years` (null = never pays back),
`peak_kW`, `hp_share`, `up_front`, and `monthly` {base_cost, new_cost, base_co2_kg, new_co2_kg} (12 values each, Jan..Dec).
Also in the file: `meta` (assumptions, slider grid) and `load_duration` (load vs heat pump capacity by size).

If the UI is Python, add `model/` to `sys.path` and call `recommend.recommend(lam, smart, tariff, weather, credit)`.

## Files
| File | Role |
|---|---|
| `data.py`, `heatpump.py` | loaders; capacity/COP interpolation from the NEEP curves |
| `simulate.py` | hourly engine: gas-only, dumb, fixed switchover, smart rule |
| `preheat.py` | thermal-mass house + look-ahead (LP) pre-heating controller |
| `prices.py` | TOU price scenario |
| `sweep.py` -> `results/sweep.csv` | precomputed simulations |
| `recommend.py` | slider logic: best size / setting for a carbon price |
| `export_frontend.py` -> `results/frontend_data.json` | static data for the UI |
| `check_data.py`, `step3.py`, `step6.py`, `plot_step*.py` | analysis and exhibit scripts (PNGs = deck figures) |
| `tests/test_model.py` | engine tests |

## Assumptions (all PLACEHOLDERS unless sourced; every one is a named constant)
- House: 15 kW design load at -20.6 C, 17 C balance temperature (`simulate.House`); thermal mass 10 kWh/C (`preheat.py`).
- Installed cost $5,286 + $178.6 per kBtu/h (`recommend.py`), fitted to the $8.5k-$16k range in the brief. **Not sourced.**
- Rebates: Xcel $2,000 + CenterPoint $1,100 (CenterPoint requires heat pump running above 4.5 C). **Verify before quoting.**
- TOU rates: assumed Xcel numbers in the JSON. **Verify vs rate book A72/A74.**
- AC credit ($0 or $4,000): scenario value, not sourced.
- Grid carbon: 2025 MISO *average* (not marginal) emissions with per-fuel factors from `data/README.md`; weather is a typical year.
- 15-year life, no discounting (`recommend.DISCOUNT`).
- Heating only. Heat pump data quirks (48/60 kBtu/h capacity) are handled in `heatpump.py` and flagged there.

## Key results (flat rates, typical weather, 15 kW home)
- Below about $490/t CO2 the best choice is to keep the furnace. Above it: 30 kBtu/h hybrid, switching to gas below about -4 C.
- 30 kBtu/h hybrid vs 60 kBtu/h sized for cold, at $500/t: about $17k lower 15-year cost and about 9 t more CO2 saved.
- Smart hourly control adds about 1% (flat) to 2-5% (TOU) over the best fixed switchover; pre-heating adds about 3.7% only on TOU at low carbon prices.
