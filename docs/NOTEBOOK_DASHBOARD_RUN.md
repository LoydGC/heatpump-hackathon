# How the dashboard runs model.ipynb (Minneapolis)

Page 3 collects the inputs; going to page 4 runs the notebook's search in the browser (`ui/model-notebook.js`).
`model/optimize.py` is the same run in Python (CLI, writes `winner.json`). Both use the notebook's data and functions.

| Notebook parameter | Page 3 input | Default (= notebook) |
|---|---|---|
| dollars_per_ton_co2 | carbon price slider ($0-300/t) | 300 |
| location | city | Minneapolis (only city with notebook data) |
| square_footage | home size (sq ft) | 1500 |
| current_heating_system | fixed for Minneapolis: natural gas today (no input) | Natural Gas |
| chosen_set_point | winter thermostat (°F) | 68 |
| price_per_kWh_electric | electricity $/kWh | 0.12 |
| price_per_therm_secondary | fuel price ($/therm for gas) | 1.20 |
| rebate_type | household income vs area median | partial |
| (new) unified R target | insulation slider: Not well 2.5, Fair 3.5, Decent 4.5, Good 5 | 2.5 |

Home: `find_closest_row(df, heating_fuel, heating_setpoint, unified_r, area)` over the notebook's 173 Minneapolis
single-family-detached homes (all have hourly loads). Search: NG-only baseline + 21 NEEP profiles, grand operating cost =
bills + CO2 x price, winner = lowest grand cost among heat pumps with positive grand savings. `--building 274938` reproduces the
notebook's own hardcoded run.

Parity: page vs optimize.py, 7 input sets (sizes 800-5000, set points 55-72, all 4 insulation levels, gas/electric/oil fallback,
all rebate types, $0-300/t): same home, same winner, grand savings within $0.01. optimize.py --building 274938 vs the notebook's
winner.json: same winner, values within 1e-6 relative.

## Risks
1. **Square footage barely steers the match.** find_closest_row divides by the std of each column (set point 3.8 °F, unified R 0.35,
   area 992 sq ft), so one insulation step (1.0 R = 2.8 std) outweighs 2,800 sq ft. ResStock areas are also discrete
   (634, 881, 1228, 1698, 2179, 2678, 3310, 5587). Example at 68 °F: Not well maps 1500 -> 1228 sq ft home; Decent maps every size
   from 600 to 3000 sq ft to the same 1698 sq ft home. This is the notebook's metric, kept as is.
2. **Few homes at higher insulation.** 173 homes, median unified R 2.83, only a handful above 3.5, so Fair/Decent/Good each land on
   1-3 homes.
3. **Fuels.** Minneapolis is gas only (Gavin 2026-11-08): no heating input there; Boston and Fairbanks keep the heating input, matching the notebook's
   gas-furnace backup. find_closest_row searches the 165 gas homes.
4. **Thermostat** only changes which home is picked (the sim's setpoint does not change the load), and ResStock set points are
   discrete (55-75 °F).
5. **Other cities**: Boston and Fairbanks have no notebook data; they still use the older stand-in model.
6. **Removed static shortcuts**: the size bins, the 1/R load scaling and the fixed building 274938 are gone; heat-loss (W/°F)
   is hidden for Minneapolis (the notebook does not use it).
7. **Data size**: ui/notebook-data.js is 4.1 MB (all 173 hourly loads); first load of the page is slower.
8. **Rebate does not affect the pick** (notebook rule): only upfront cost and grand_payback.
