# Reference facts

Facts the team can cite and build on. Each one is derived from a named data source by a rule you can re-run. If a fact is not in this file, it is not guaranteed: treat it as a placeholder.

**How to use:** cite the fact ID (R-xx) in code comments, decisions and slides. To change a fact, change its source and rebuild; do not edit the number by hand. Log the change in `docs/DECISIONS.md`.

## Source of truth

- **ResStock extracts** (Gavin, 2026-11-08): NREL ResStock `resstock_amy2018_release_1`, baseline (upgrade 0), one extract per city in the project folder `datasets/resstock/`. Rebuilt into the UI by `python3 tools/build_resstock_ui.py <extract dir> ui/resstock.js`.
- **Place filters:** Minneapolis = `in.city` "MN, Minneapolis"; Boston = "MA, Boston"; Fairbanks = Fairbanks North Star Borough (ResStock has no Fairbanks city entry).
- **Population used by the UI:** single-family detached (SFD) and attached (SFA) only, 500–3999 sq ft. The 0–499 and 4000+ bins are dropped (Gavin, 2026-11-08, D-021).
- **Statistics:** weighted by ResStock `weight`. Medians are weighted medians; "most common" is the weighted mode.

## Guaranteed facts

### R-01 · Boston typical home (definitive reference, D-025)
The typical Boston home on the home step is the Boston ResStock SFD home below. This extract is the definitive reference for the Boston typical home going forward.

| Item | Value | Rule |
|---|---|---|
| Home type | Single-family detached | Chosen as the default type |
| ResStock models | 122 | SFD, 500–3999 sq ft |
| Size | 1,698 sq ft | Weighted median |
| Heating fuel | Natural gas (80% of homes) | Weighted mode of `in.heating_fuel` |
| Draftiness | Drafty | Weighted median infiltration 15 ACH50; 15 or more counts as drafty, 7 or less as tight |
| Yearly electricity | 8,012 kWh | Weighted median, all uses |
| Yearly natural gas | 1,013 therms | Weighted median, all uses |

Not in ResStock, so not guaranteed: thermostat setting (68 °F), electricity and gas prices, rebates, installed cost.

### R-02 · Typical homes computed for the other cities (not yet applied in the UI)

| City | Models | Size (median) | Fuel (share) | Draftiness | kWh/yr | Therms/yr |
|---|---|---|---|---|---|---|
| Minneapolis | 299 | 1,698 sq ft | Natural gas (93%) | Drafty (15 ACH50) | 9,212 | 1,563 |
| Fairbanks | 104 | 1,698 sq ft | Fuel oil (94%) | Tight (4 ACH50) | 6,713 | 0 (heats with fuel oil) |

The Minneapolis results use model v1's fixed house, so this typical home does not change those numbers.

### R-03 · Size bins offered in the UI
Seven bins: 500–749, 750–999, 1000–1499, 1500–1999, 2000–2499, 2500–2999, 3000–3999 sq ft. A bin with no ResStock homes in a city is hidden for that city and type. If a choice becomes unavailable, the nearest available bin is used.

### R-04 · Home types offered in the UI
Single-family detached and single-family attached. Mobile homes and multi-family are not offered.

### R-05 · Reference figures shown on the page
The "ResStock reference, not our model" line shows the weighted median yearly kWh, therms and propane/oil kWh for the chosen city, type and size bin (tables below). It is a ResStock population figure and never a model output.

### R-06 · What the UI does not use
Vintage (year built) is not an input, lookup key or display anywhere in the UI (Gavin, 2026-11-08). The 0–499 and 4000+ bins are not used.

## ResStock median use by city, type and size bin

Mean sq ft is the average size of ResStock homes in that bin; the UI uses it as the home's size. Homes counts are shown here for the team only and are not shown in the UI.


### Minneapolis, single-family detached

| Size (sq ft) | ResStock homes | Mean sq ft | Median kWh/yr | Median therms/yr | Median propane+oil kWh/yr |
|---|---|---|---|---|---|
| 500–749 | 4 | 634 | 1,839 | 462 | 0 |
| 750–999 | 31 | 881 | 7,822 | 885 | 0 |
| 1000–1499 | 67 | 1228 | 7,913 | 1,107 | 0 |
| 1500–1999 | 73 | 1698 | 9,040 | 1,602 | 0 |
| 2000–2499 | 55 | 2179 | 10,519 | 1,977 | 0 |
| 2500–2999 | 34 | 2678 | 10,485 | 1,896 | 0 |
| 3000–3999 | 35 | 3310 | 11,083 | 2,417 | 0 |

### Minneapolis, single-family attached

| Size (sq ft) | ResStock homes | Mean sq ft | Median kWh/yr | Median therms/yr | Median propane+oil kWh/yr |
|---|---|---|---|---|---|
| 500–749 | 1 | 625 | 23,252 | 0 | 0 |
| 750–999 | 5 | 872 | 6,383 | 518 | 0 |
| 1000–1499 | 7 | 1207 | 9,890 | 480 | 0 |
| 1500–1999 | 3 | 1678 | 8,352 | 862 | 0 |
| 2000–2499 | 7 | 2152 | 10,323 | 1,505 | 0 |
| 2500–2999 | 2 | 2663 | 5,912 | 1,338 | 0 |
| 3000–3999 | 1 | 3228 | 7,916 | 1,829 | 0 |

### Boston, single-family detached

| Size (sq ft) | ResStock homes | Mean sq ft | Median kWh/yr | Median therms/yr | Median propane+oil kWh/yr |
|---|---|---|---|---|---|
| 500–749 | 0 | – | – | – | – |
| 750–999 | 6 | 881 | 4,160 | 706 | 0 |
| 1000–1499 | 38 | 1228 | 7,335 | 843 | 0 |
| 1500–1999 | 41 | 1698 | 8,444 | 1,152 | 0 |
| 2000–2499 | 22 | 2179 | 8,012 | 1,148 | 0 |
| 2500–2999 | 8 | 2678 | 9,149 | 1,189 | 0 |
| 3000–3999 | 7 | 3310 | 10,915 | 1,546 | 0 |

### Boston, single-family attached

| Size (sq ft) | ResStock homes | Mean sq ft | Median kWh/yr | Median therms/yr | Median propane+oil kWh/yr |
|---|---|---|---|---|---|
| 500–749 | 7 | 625 | 7,039 | 206 | 0 |
| 750–999 | 6 | 872 | 4,964 | 322 | 0 |
| 1000–1499 | 27 | 1207 | 7,239 | 426 | 0 |
| 1500–1999 | 18 | 1678 | 6,166 | 479 | 0 |
| 2000–2499 | 10 | 2152 | 9,390 | 736 | 0 |
| 2500–2999 | 0 | – | – | – | – |
| 3000–3999 | 3 | 3228 | 12,436 | 898 | 0 |

### Fairbanks, single-family detached

| Size (sq ft) | ResStock homes | Mean sq ft | Median kWh/yr | Median therms/yr | Median propane+oil kWh/yr |
|---|---|---|---|---|---|
| 500–749 | 7 | 634 | 3,854 | 0 | 9,319 |
| 750–999 | 11 | 881 | 4,853 | 0 | 14,654 |
| 1000–1499 | 26 | 1228 | 6,269 | 0 | 19,254 |
| 1500–1999 | 26 | 1698 | 7,166 | 0 | 23,059 |
| 2000–2499 | 16 | 2179 | 9,084 | 0 | 31,927 |
| 2500–2999 | 12 | 2678 | 6,704 | 0 | 33,168 |
| 3000–3999 | 6 | 3310 | 7,218 | 0 | 27,289 |

### Fairbanks, single-family attached

| Size (sq ft) | ResStock homes | Mean sq ft | Median kWh/yr | Median therms/yr | Median propane+oil kWh/yr |
|---|---|---|---|---|---|
| 500–749 | 0 | – | – | – | – |
| 750–999 | 2 | 872 | 4,456 | 0 | 3,945 |
| 1000–1499 | 4 | 1207 | 4,165 | 0 | 5,160 |
| 1500–1999 | 4 | 1678 | 4,994 | 0 | 20,861 |
| 2000–2499 | 2 | 2152 | 4,687 | 0 | 20,454 |
| 2500–2999 | 0 | – | – | – | – |
| 3000–3999 | 1 | 3228 | 8,032 | 0 | 0 |

## Not guaranteed (placeholders)

- Boston and Fairbanks prices, rebates, installed cost, monthly temperatures and grid carbon in `ui/regions.js`. Minneapolis prices come from the team's data.
- The stand-in model (`ui/model-stub.js`): synthetic weather and a generic heat pump curve. Used for Boston and Fairbanks only.
- Grid carbon: the repo MISO file uses hard-coded g/kWh by fuel and is unsourced (mean 435 g/kWh). The PUDL-derived measured value is 459 g/kWh. Neither is final.
- Model v1 (Sharvi, Minneapolis only): one fixed 15 kW house; installed cost, rebates, time-of-use rates and the AC credit are placeholders.

## Changelog

- 2026-11-08: file created; R-01 to R-06 from the ResStock extracts and decisions D-021, D-025.
