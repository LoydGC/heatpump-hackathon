# MIT Energy & Climate Hack — COMSOL heat pump track: Minneapolis data folder

Everything the hourly heat pump model needs for **Minneapolis–St. Paul, MN**. Retrieved 2026-11-07.

## Start here: `processed/` (model-ready)

| File | What it is | Source |
|---|---|---|
| `model_inputs_minneapolis.json` | All scalar inputs in one place: design temps, prices, emission factors, rebates, file pointers | see below |
| `msp_weather_TMYx.2011-2025.csv` | **Main weather**: 8,760 hourly rows (dry bulb, dew point, solar, wind) | NREL/NOAA-based TMYx via climate.onebuilding.org |
| `msp_weather_TMYx.2009-2023.csv` | Alternate recent typical year | same |
| `msp_weather_TMY3.csv` | NREL TMY3 (1991–2005 data). Colder: 154 h below −20 °C vs 65 h in TMYx 2011–2025. Use as the **cold stress test** | NREL TMY3 |
| `hp_carrier_37MUHAQ_heating_curves.csv` | **Primary heat pump family**, 6 sizes (18–60 kBtu/h): min/rated/max capacity (kW) and COP at 8.3, −8.3, −15, −30 °C | NEEP ccASHP list (AHRI-certified) |
| `miso_hourly_grid_carbon_2025.csv` | 8,760 hours of MISO generation by fuel + computed gCO2/kWh | EIA Form 930 Hourly Electric Grid Monitor |

## Key numbers

| Item | Value | Source |
|---|---|---|
| ASHRAE 99% / 99.6% heating design temp | −20.6 °C / −23.0 °C | ASHRAE design conditions (in `.ddy` files) |
| Heating degree days (base 65 °F) | ~7,270 (TMYx 2011–25); ~7,850 (TMY3) | computed from weather files |
| Electricity, all-in residential | $0.1644/kWh | EIA Electric Power Monthly Table 5.6.B, MN, Jan–Aug 2026 YTD |
| Natural gas, residential, winter average | $10.65/Mcf = $0.035 per kWh of fuel | EIA series N3010MN3, Oct 2025–Mar 2026 |
| Gas CO2 factor | 53.06 kg/MMBtu = 181 g per kWh of fuel | EPA GHG Emission Factors Hub |
| Grid CO2, annual average | 435 g/kWh (MISO 2025, hourly range 249–554); eGRID2023 MROW = 417 g/kWh | EIA-930 (our calc); EPA eGRID |
| Rebates, hybrid (keep furnace) | Xcel cold-climate ducted $2,000 + CenterPoint $1,100 | Xcel MN 2024–26 rebate sheet; CenterPoint MN page |
| Federal 25C credit | $0 (expired Dec 31, 2025) | — |

## `raw/` (original sources, untouched)

- `weather/` — all 9 EPW packages you downloaded (TMY3, 5× TMYx, 3× NOAA Normals). The Normals files are smoothed (min −11 °C), so **don't use them for sizing**.
- `ashrae/` — ASHRAE design-conditions PDF for MSP.
- `eia/Table_1.11_Heating_Degree-Days_by_Census_Division.xlsx` — EIA Monthly Energy Review Table 1.11 (heating degree days by census division), added by the team.
- `heat_pumps/neep_ccashp_heating_performance.csv` — full heating tables for 4 families: Carrier 37MUHAQ (R-454B, primary), Mitsubishi PUZ-AK (R-454B, alternate), plus two R-410A families kept for comparison only (R-410A is being phased out for 2026 installs).
- `grid/` — raw MISO hourly chunks (UTC).
- `prices/` — EIA gas price history 2022–2026; EIA electricity table; Xcel TOU notes.
- `emissions/emission_factors.csv` — EPA fuel factors and eGRID MROW.
- `rebates/mn_rebates_2026.md` — rebate table with links and conditions.

## Assumptions to flag in the pitch

1. **Grid CO2 by fuel**: coal 1,000, gas 410, other 300, nuclear/renewables 0 g/kWh, applied to MISO's hourly mix. This is an average-emissions approach. Its annual mean (435) matches eGRID's 417 within 5%.
2. **TOU prices** in `model_inputs_minneapolis.json` are an assumption built from reported Xcel winter TOU energy charges plus ~5¢ of riders. Verify against the Xcel Minnesota rate book (schedules A72/A74).
3. **Rebates** come from program pages and secondary summaries; confirm on xcelenergy.com and centerpointenergy.com before quoting. CenterPoint's hybrid rebate requires the heat pump to switch over **at 40 °F or lower**: a real policy constraint the optimizer should respect.
4. The `low_cutoff_F` column is blank in the raw NEEP export. The primary family's listed low-temperature cutoff is −22 °F (from the NEEP list view).

## Not collected (optional)

- NREL ResStock typical-house loads: very large. We'll set the house from a design load instead.
- NREL Cambium long-run marginal emissions: needs an NREL login.
- NOAA actual historical winters: TMY3 vs TMYx already gives a mild/cold contrast.
- Minnesota CEE field-study PDF, for validation: https://www.mncee.org (search "cold climate air source heat pump").

`scripts/` has the small helpers used to build these files.
