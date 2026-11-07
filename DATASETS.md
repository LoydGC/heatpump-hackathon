# Datasets

Candidate public datasets for the challenge, grouped by topic. Each entry has a link, a short description, coverage/format, access notes, and a download sketch where one is practical. Sketches are starting points, not tested pipelines.

Link status (checked 2026-11-07): ✅ = fetched successfully or returned data; ☑️ = found via search / linked from a verified page but not fetched directly.

Reference locations:

| City | Lat, Lon | Station IDs |
|---|---|---|
| Boston, MA (Logan Airport) | 42.36, -71.01 | GHCN-D `USW00014739` |
| Montreal, QC (Trudeau Airport) | 45.47, -73.74 | ECCC Station ID `51157` (MONTREAL INTL A, 2013–present) |
| Fairbanks, AK (Intl Airport) | 64.80, -147.88 | GHCN-D `USW00026411` |

---

## 1. Weather: daily high/low temperature

### 1.1 NOAA GHCN-Daily ✅
- **Link:** https://www.ncei.noaa.gov/products/land-based-station/global-historical-climatology-network-daily
- **What:** Station observations of daily max/min temperature (`TMAX`, `TMIN`), precipitation, snow, etc. Quality controlled by NOAA NCEI.
- **Coverage:** Global stations; Boston and Fairbanks have long, continuous records (1940s–present). Montreal stations in GHCN are sparse for recent years (a test query for `CA007025250` in 2023 returned no rows); use ECCC (1.2) for Montreal.
- **Format:** CSV via NCEI Access Data Service, or per-station CSV in bulk.
- **Access:** Free, no key. US government public domain.
- **Download sketch:**
  ```bash
  # Daily TMAX/TMIN, metric (°C), Boston + Fairbanks
  curl "https://www.ncei.noaa.gov/access/services/data/v1?dataset=daily-summaries\
  &stations=USW00014739,USW00026411&dataTypes=TMAX,TMIN\
  &startDate=1995-01-01&endDate=2025-12-31&units=metric&format=csv" -o ghcnd.csv

  # Or the full per-station history (all elements, long format, tenths of °C)
  curl -O https://www.ncei.noaa.gov/pub/data/ghcn/daily/by_station/USW00014739.csv.gz
  ```
  Test output (Boston, 2023-01-01): `TMAX 12.8, TMIN 6.1`; (Fairbanks, 2023-01-01): `TMAX -8.8, TMIN -26.0`.

### 1.2 Environment and Climate Change Canada (ECCC) Historical Climate Data ☑️
- **Link:** https://climate.weather.gc.ca/
- **What:** Canadian station observations: daily max/min/mean temperature, heating degree days, precip.
- **Coverage:** Montreal Trudeau: Station ID `51157` (2013–present); older record under Station ID `5415` (pre-2013). Hourly, daily, monthly timeframes.
- **Format:** CSV, one file per station-year for daily data.
- **Access:** Free, no key. Open Government Licence – Canada.
- **Download sketch:**
  ```bash
  # timeframe=2 -> daily; one request per year
  for y in $(seq 2014 2025); do
    curl -o "montreal_${y}.csv" \
    "https://climate.weather.gc.ca/climate_data/bulk_data_e.html?format=csv&stationID=51157&Year=${y}&Month=1&Day=1&timeframe=2&submit=Download+Data"
  done
  ```
  Columns include `Max Temp (°C)`, `Min Temp (°C)`, `Mean Temp (°C)`, `Heat Deg Days (°C)`.

### 1.3 Open-Meteo Historical Weather API ☑️
- **Link:** https://open-meteo.com/en/docs/historical-weather-api
- **What:** Reanalysis-based (ERA5 / ERA5-Land and others) gridded weather at any lat/lon, served via a simple JSON/CSV API.
- **Coverage:** 1940–present, daily and hourly; any point, so all three cities use the same source.
- **Format:** JSON or CSV.
- **Access:** Free for non-commercial use, no key; rate-limited. Data CC BY 4.0.
- **Download sketch:**
  ```python
  import requests, pandas as pd
  r = requests.get("https://archive-api.open-meteo.com/v1/archive", params={
      "latitude": 64.80, "longitude": -147.88,          # Fairbanks
      "start_date": "1995-01-01", "end_date": "2025-12-31",
      "daily": "temperature_2m_max,temperature_2m_min",
      "timezone": "auto"})
  df = pd.DataFrame(r.json()["daily"])
  ```

### 1.4 ERA5 daily statistics (Copernicus Climate Data Store) ✅
- **Link:** https://cds.climate.copernicus.eu/datasets/derived-era5-single-levels-daily-statistics
- **What:** ECMWF ERA5 reanalysis, post-processed to daily mean/max/min of 2 m temperature (and other variables).
- **Coverage:** Global, 0.25° grid, 1940–present (≈6-day lag).
- **Format:** NetCDF (zipped).
- **Access:** Free CDS account + API key (`~/.cdsapirc`); licence CC BY 4.0. DOI 10.24381/cds.4991cf48.
- **Download sketch:**
  ```python
  import cdsapi
  cdsapi.Client().retrieve("derived-era5-single-levels-daily-statistics", {
      "product_type": "reanalysis",
      "variable": ["2m_temperature"],
      "daily_statistic": "daily_maximum",        # repeat with "daily_minimum"
      "year": "2023", "month": [f"{m:02d}" for m in range(1, 13)],
      "day": [f"{d:02d}" for d in range(1, 32)],
      "time_zone": "utc+00:00", "frequency": "1_hourly",
      "area": [65, -148, 64.5, -147.5],          # N, W, S, E around Fairbanks
  }, "era5_tmax_2023.zip")
  ```
  Parameter names follow the CDS request form; generate the exact request from the dataset's "Download" tab.

### 1.5 NOAA U.S. Climate Normals ☑️
- **Link:** https://www.ncei.noaa.gov/access/us-climate-normals/
- **What:** 1991–2020 30-year normals: daily/monthly normal max/min temps, heating degree days, percentiles. US stations only (Boston, Fairbanks).
- **Format:** CSV per station. Free.

### 1.6 Canadian Climate Normals ☑️
- **Link:** https://climate.weather.gc.ca/climate_normals/index_e.html
- **What:** 1981–2010 (and 1991–2020 where published) normals for Canadian stations including Montreal: monthly mean max/min, extremes, degree days. Free.

### 1.7 Typical-year hourly weather files (TMY / EPW)
Hourly "typical year" files; daily high/low can be derived. Commonly used as building-simulation input.
- **NREL NSRDB** ✅ https://nsrdb.nrel.gov/ : US + some international; hourly/half-hourly meteorology + irradiance, TMY/TGY/TDY products. Free API key from https://developer.nrel.gov/signup/.
- **Climate.OneBuilding.Org** ✅ https://climate.onebuilding.org/ : free EPW zips (TMYx from NOAA ISD through 2023, plus TMY3/CWEC). North America under WMO Region 4; file names like `USA_MA_Boston-Logan.Intl.AP.725090_TMYx.zip`, `USA_AK_Fairbanks.Intl.AP.702610_TMYx.zip`, `CAN_QC_Montreal-Trudeau.Intl.AP.716270_TMYx.zip` (check exact names on the region page).
- **EnergyPlus weather page** ☑️ https://www.energyplus.net/weather : links to the above sources.

---

## 2. Home energy needs (NREL)

### 2.1 End-Use Load Profiles (EULP) / ResStock datasets ✅
- **Link:** https://www.nrel.gov/buildings/end-use-load-profiles · data: https://data.openei.org/submissions/4520 · README: https://oedi-data-lake.s3.amazonaws.com/nrel-pds-building-stock/end-use-load-profiles-for-us-building-stock/README.md
- **What:** Simulated energy use for ~550k representative US homes (ResStock), at 15-minute resolution, broken out by end use (space heating, cooling, water heating, etc.) and fuel. Includes building characteristics metadata and "upgrade" scenarios (e.g. heat pump retrofits with different sizing/backup assumptions; see each release's upgrade list).
- **Coverage:** US. Releases (from the README): `2025/resstock_amy2018_release_1`, `2025/resstock_amy2012_release_1`, `2024/resstock_tmy3_release_2`. ResStock has historically modeled the contiguous US; confirm whether Alaska is present in a release's `by_state` folder. Not Canada.
- **Format:** Parquet / CSV(.gz) on AWS S3 (public bucket `oedi-data-lake`, no credentials). Full raw set ~17 TB; per-state and aggregate files are small.
- **Access:** CC BY 4.0. Each release has a `manifest.json` / data dictionary that defines its layout.
- **Path patterns (2025 releases):**
  ```
  <release>/metadata_and_annual_results/by_state/full/{csv,parquet}/state=<ST>/<ST>_upgrade<id>.csv.gz
  <release>/timeseries_aggregates/by_state/upgrade=<id>/state=<ST>/up<id:02d>-<st>-<building_type>.csv
  <release>/timeseries_individual_buildings/by_state/upgrade=<id>/state=<ST>/<bldg_id>-<id>.parquet
  ```
- **Download sketch:**
  ```bash
  BASE=s3://oedi-data-lake/nrel-pds-building-stock/end-use-load-profiles-for-us-building-stock
  REL=2025/resstock_amy2018_release_1
  aws s3 ls --no-sign-request $BASE/$REL/                               # browse
  aws s3 cp --no-sign-request --recursive \
    $BASE/$REL/metadata_and_annual_results/by_state/full/csv/state=MA/ ./resstock_MA/
  aws s3 cp --no-sign-request --recursive \
    $BASE/$REL/timeseries_aggregates/by_state/upgrade=0/state=MA/ ./resstock_MA_ts/
  ```
  HTTPS equivalent: `https://oedi-data-lake.s3.amazonaws.com/nrel-pds-building-stock/end-use-load-profiles-for-us-building-stock/<path>`.

### 2.2 ResStock data viewer ☑️
- **Link:** https://resstock.nrel.gov/
- **What:** Web UI to filter/aggregate the same data (by state, county, climate zone, heating fuel, vintage) and export CSVs. Useful for quick pulls without S3.

### 2.3 ResStock / BuildStock models ☑️
- **Link:** https://github.com/NREL/resstock (uses OpenStudio-HPXML + EnergyPlus)
- **What:** Open-source code and housing-characteristics inputs that generate the datasets above. Can be run for custom weather files (e.g. Montreal/Fairbanks EPW) and custom heat pump configurations. BSD-3 licence. Building models (OpenStudio/HPXML) are also published per release on OEDI.

### 2.4 Related non-NREL sources (for context / validation)
- **EIA Residential Energy Consumption Survey (RECS) 2020** ☑️ https://www.eia.gov/consumption/residential/data/2020/ : survey microdata (~18.5k US homes) with heating fuel, equipment, and modeled end-use consumption. CSV, public domain.
- **NRCan Comprehensive Energy Use Database** ✅ https://oee.nrcan.gc.ca/corporate/statistics/neud/dpa/menus/trends/comprehensive_tables/list.cfm : Canadian residential energy use by end use, fuel, and province (Quebec table available), 2000–present. Annual tables.

---

## 3. Supplemental heating: fuel/electricity cost and emissions

### 3.1 Prices (US)

**EIA Open Data API v2** ✅
- **Link:** https://www.eia.gov/opendata/ · docs: https://www.eia.gov/opendata/documentation.php · browser: https://www.eia.gov/opendata/browser/
- **What:** Programmatic access to all EIA series below. Free API key: https://www.eia.gov/opendata/register.php. Bulk zips: `https://www.eia.gov/opendata/bulk/{ELEC,NG,PET,SEDS}.zip`.
- **Base URL:** `https://api.eia.gov/v2/`

| Fuel | Route / page | Coverage |
|---|---|---|
| Electricity (residential ¢/kWh) | `electricity/retail-sales` (`facets[sectorid][]=RES`, `facets[stateid][]=MA` / `AK`) | Monthly/annual, by state |
| Natural gas (residential $/Mcf) | `natural-gas/pri/sum` · page: https://www.eia.gov/dnav/ng/ng_pri_sum_dcu_nus_m.htm | Monthly, by state |
| Heating oil & propane (residential $/gal) | `petroleum/pri/wfr` · page: https://www.eia.gov/petroleum/heatingoilpropane/ ✅ | Weekly, Oct–Mar only; includes Massachusetts; **no Alaska** |
| Wood, all fuels (annual $/MMBtu) | `seds` (State Energy Data System) | Annual, by state, includes AK |

- **Download sketch:**
  ```python
  import requests, pandas as pd
  KEY = "..."  # EIA API key
  r = requests.get("https://api.eia.gov/v2/electricity/retail-sales/data/", params={
      "api_key": KEY, "frequency": "monthly", "data[]": "price",
      "facets[sectorid][]": "RES", "facets[stateid][]": ["MA", "AK"],
      "start": "2015-01"})
  df = pd.DataFrame(r.json()["response"]["data"])
  # For other routes, call https://api.eia.gov/v2/<route>/?api_key=KEY to list facets/series first.
  ```

**Alaska fuel prices**
- **Alaska Energy Data Gateway: Community Fuel Prices** ✅ https://akenergygateway.alaska.edu/explore/data/public_fuel_prices : heating fuel oil and gasoline $/gal by community, semiannual (winter/summer), 2005–present; from Alaska DCRA surveys. CSV in zip, CC BY 4.0.
- **Alaska DCRA Fuel Price Report** ☑️ e.g. https://www.commerce.alaska.gov/web/Portals/4/pub/RA/Fuel_price_report/Alaska%20Fuel%20Price%20Report%20-%20January%202026.pdf : the source PDF reports.
- **Golden Valley Electric Association (Fairbanks utility) rates** ✅ https://www.gvea.com/rates/ → current rates, fuel & purchased power adjustment, historic residential rates.

### 3.2 Prices (Canada / Quebec)
- **Statistics Canada Table 18-10-0001-01**, Monthly average retail prices for gasoline and fuel oil ✅ https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1810000101 : monthly ¢/L, includes household heating fuel for Montréal. Full CSV: `https://www150.statcan.gc.ca/n1/tbl/csv/18100001-eng.zip`. Open Government Licence – Canada.
  ```bash
  curl -O https://www150.statcan.gc.ca/n1/tbl/csv/18100001-eng.zip && unzip 18100001-eng.zip
  # filter GEO == "Montréal, Quebec" and "Type of fuel" == "Household heating fuel"
  ```
- **Hydro-Québec Rate D (residential electricity)** ✅ https://www.hydroquebec.com/residential/customer-space/rates/rate-d.html : two-tier structure (first 40 kWh/day × days at lower price, remainder higher) plus daily access charge; current values in the "Electricity Rates" PDF linked from that page. Rate D billing details: https://www.hydroquebec.com/residential/customer-space/rates/rate-d-billing.html.
- **NRCan average retail prices of heating fuels** ☑️ https://natural-resources.canada.ca/energy-efficiency/data-research-insights-energy-efficiency/fuel-prices/ : NRCan heating oil/propane price pages (direct link failed to fetch on 2026-11-07).
- Natural gas in Montreal is supplied by Énergir; tariff schedules are on its website.

### 3.3 Emission factors

**EPA GHG Emission Factors Hub (2025)** ✅
- **Link:** https://www.epa.gov/climateleadership/ghg-emission-factors-hub · XLSX: https://www.epa.gov/system/files/other-files/2025-01/ghg-emission-factors-hub-2025.xlsx
- **What:** CO₂/CH₄/N₂O factors per unit of fuel (stationary combustion table covers natural gas, distillate/heating oil, propane, wood and other biomass) and eGRID-based electricity factors by subregion. Public domain. Updated annually (January).
  ```bash
  curl -O https://www.epa.gov/system/files/other-files/2025-01/ghg-emission-factors-hub-2025.xlsx
  ```

**EPA eGRID** ✅
- **Link:** https://www.epa.gov/egrid · downloads: https://www.epa.gov/egrid/download-data
- **What:** Emissions and emission rates (lb/MWh CO₂, CO₂e, NOx, SO₂) for US power plants, aggregated by eGRID subregion (Boston → NEWE; Fairbanks → AKGD) and state. Latest seen: eGRID2023 (Rev 2, June 2025). Annual, XLSX. Public domain.
  ```bash
  curl -O https://www.epa.gov/system/files/documents/2025-06/egrid2023_data_rev2.xlsx
  # sheet "SRL23" = subregion-level rates
  ```

**EPA AP-42** ☑️ https://www.epa.gov/air-emissions-factors-and-quantification/ap-42-compilation-air-emissions-factors-stationary-sources : non-GHG pollutant factors (PM, CO, NOx) including residential wood stoves (Ch. 1.10) and small oil/gas boilers.

**ECCC Emission factors and reference values (v4.0, Sept 2026)** ✅
- **Link:** https://www.canada.ca/en/environment-climate-change/services/climate-change/pricing-pollution-how-it-will-work/output-based-pricing-system/federal-greenhouse-gas-offset-system/emission-factors-reference-values.html
- **What:** Canadian CO₂/CH₄/N₂O factors for natural gas (by province), propane, light fuel oil/kerosene, and **grid electricity intensity by province** (Quebec ≈ 1.7 g CO₂e/kWh for 2023–2025). No wood factors. HTML + PDF.

**Canada National Inventory Report (NIR)** ☑️ https://data-donnees.az.ec.gc.ca/data/substances/monitor/canada-s-official-greenhouse-gas-inventory : official GHG inventory; Annex 13 has provincial electricity generation and GHG intensity time series. CSV/XLSX; Open Government Licence – Canada.

**Hydro-Québec air emissions** ☑️ https://www.hydroquebec.com/sustainable-development/energy-environment/air-emissions.html : utility-reported emissions intensity of Hydro-Québec's supply.

**EIA CO₂ coefficients by fuel** ☑️ https://www.eia.gov/environment/emissions/co2_vol_mass.php : kg CO₂ per unit/per MMBtu for heating oil, propane, natural gas, wood, etc.
