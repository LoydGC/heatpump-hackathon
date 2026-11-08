# Comparable products

Compiled 2026-11-07 on branch `claude/project-thread-czssmr`. Builds on research/heat-pump-sizing-tools.md in the project files (utility/government sizing tools); those are only summarised here. Descriptive only: nothing here recommends an approach.

Link status: ✓ opened and read this session · ✗ blocked or failed · ~ link taken from a search result or another page, not opened. Statements come from the pages' own text; where a page didn't say, we say so. A visual version: [comparables.html](comparables.html) (double-click to open).

## Top 5 most relevant

1. [Rewiring America API: Residential Electrification Model](https://docs.rewiringamerica.org/api/residential-electrification-model): Address plus heating fuel in; fuel use, rates and emissions factors out. Closest to 'location in, cost and CO2 out'.
2. [HEAT (Code for Boston)](https://heat.heatsmartalliance.org): Open source heat-load-vs-outdoor-temperature charting and heat pump capacity check. Same core idea as sizing.
3. [NEEA dual-fuel control analysis](https://neea.org/wp-content/uploads/2026/03/Dual-Fuel-Gas-Furnace-and-Heat-Pump-System-Control.pdf): Switchover temperature vs gas use, cost and CO2 with worked numbers.
4. [Mass Save Switchover Temperature Calculator](https://www.masssave.com/en/residential/switchover-temperature-calculator): Only consumer tool found that frames switchover as cost-optimal vs emissions-oriented.
5. [Palmetto Energy Intelligence API](https://palmetto.com/business/energy-intelligence-api): Infers 60+ home traits with user override; hourly load, cost and carbon. 500 free calls/month.

## Summary table

| Product | Who | Sizing | Cost | CO2 | Backup / dual-fuel | Infers home | Link status |
|---|---|---|---|---|---|---|---|
| [Rewiring America Personal Electrification Planner](https://homes.rewiringamerica.org/personal-electrification-planner) | Rewiring America (nonprofit) | – | yes | yes | – | – | ✓ |
| [Rewiring America API: Residential Electrification Model](https://docs.rewiringamerica.org/api/residential-electrification-model) | Rewiring America | – | yes | yes | – | yes | ✓ (outputs partly unverified) |
| [Rewiring America Incentive API / embeddable calculator](https://www.rewiringamerica.org/tools/incentive-api) | Rewiring America | – | yes | – | – | – | ✓ |
| [Palmetto Energy Intelligence API](https://palmetto.com/business/energy-intelligence-api) | Palmetto (clean-energy company) | – | yes | yes | – | yes | ✓ |
| [HEAT: Home Energy Analysis Tool (Code for Boston / HeatSmart Alliance)](https://heat.heatsmartalliance.org) | Code for Boston volunteers with HeatSmart Alliance | yes | – | – | – | – | ✓ (UI flow from summary, not screens) |
| [PNNL / DOE Building America: High Performance HVAC Decision Tool](https://basc.pnnl.gov/cchp_decision_tool) | PNNL for DOE (operator inferred from domain) | yes | – | – | – | – | ✓ (later steps not visible) |
| [Efficiency Maine Heat Load Estimator + NRCan ASHP Sizing Toolkit / LEEP app](https://www.efficiencymaine.com/estimate-your-homes-heating-needs/) | Efficiency Maine | yes | – | – | – | – | ✓ (earlier research) |
| [Mass Save Switchover Temperature Calculator](https://www.masssave.com/en/residential/switchover-temperature-calculator) | Mass Save (MA utilities) | – | yes | yes | yes | – | ✓ page / ✗ tool |
| [NEEA: Dual-Fuel Furnace + Heat Pump Control Analysis (Larson Energy Research, Mar 2026) and VCHP Levelized Cost Tool](https://neea.org/wp-content/uploads/2026/03/Dual-Fuel-Gas-Furnace-and-Heat-Pump-System-Control.pdf) | NEEA (utility-funded alliance) / Larson Energy Research | yes | yes | yes | yes | – | ✓ (slides) / tool itself not opened |
| [Canadian Climate Institute Heat Pump Calculator (Dunsky analysis)](https://heatpumpcalculator.ca/) | Canadian Climate Institute | – | yes | – | – | – | ✓ page; tool inputs unverified |
| [CEE (Minnesota) Cold Climate Heat Pump Cost and Carbon Calculator](https://mncee.org/cold-climate-heat-pumps-cost-and-carbon-calculator) | Center for Energy and Environment (nonprofit), 2020 | – | yes | yes | – | – | ✓ page / ✗ tool |
| [CLEAResult ATLAS Heat Pump Calculator](https://www.clearesult.com/products/CLEAResult-ATLAS-Heatpumps) | CLEAResult (white-label for utilities / state energy offices) | – | yes | – | – | – | ✓ |
| [UK DESNZ Heat Pump Suitability Tool](https://www.gov.uk/algorithmic-transparency-records/desnz-heat-pump-suitability-tool) | UK government (DESNZ) | – | yes | yes | – | – | ✓ (transparency record, not the tool itself) |
| [Sealed](https://sealed.com) | Sealed (company) | – | yes | – | – | – | ✓ |
| [EnergySage](https://www.energysage.com/) | EnergySage (marketplace) | – | – | – | – | – | ✓ home / ✗ heat pump page |
| [Dandelion Energy](https://dandelionenergy.com) | Dandelion Energy (geothermal installer) | – | – | – | – | – | ✓ |
| [Elephant Energy (US) and Carbon Switch](https://www.energysage.com/supplier/26555/elephant-energy) | Elephant Energy (electrification installer, Colorado) | – | – | – | – | – | ~ / ✗ |
| [Google Solar API (Building Insights)](https://developers.google.com/maps/documentation/solar/building-insights) | Google Maps Platform | – | – | – | – | yes | ✓ |
| [Windfall Centre vHEAT (virtual home energy assessment)](https://windfallcentre.ca/services/v-heat/) | Windfall Centre (Canada) | – | – | – | – | yes | ✓ page |
| [NREL/NLR ResStock](https://resstock.nrel.gov/) | DOE, National Laboratory of the Rockies (formerly NREL) | – | – | – | – | yes | ✓ |
| [BEopt](https://beopt.nrel.gov/) | DOE / NREL for Building America | – | yes | – | – | – | ✓ |
| [DOE Scout](https://scout.energy.gov/) | DOE (Office of Critical Minerals and Energy Innovation) | – | yes | yes | – | – | ✓ |

'–' means not found on the pages we could read, not that the product lacks it.

## Entries

### Consumer planners

#### [Rewiring America Personal Electrification Planner](https://homes.rewiringamerica.org/personal-electrification-planner)
- **Runs it:** Rewiring America (nonprofit)
- **Inputs:** A few home and household details (page does not list fields).
- **Outputs:** Ranked list of electric projects, cost / energy-savings / emissions ranges per project, federal incentives and net cost, step-by-step project guides. No equipment sizing.
- **Covers:** Cost, CO2
- **UX worth noting:** Plain-language project cards; ranges instead of false precision; incentives folded into net cost; contractor matching shown as 'coming soon'.
- **Gap:** No heat pump capacity, balance point or backup-heat logic; one national framing, not climate-specific tradeoffs.
- **Link status:** ✓

### APIs / data

#### [Rewiring America API: Residential Electrification Model](https://docs.rewiringamerica.org/api/residential-electrification-model)
- **Runs it:** Rewiring America
- **Inputs:** Street address, upgrade scenario (baseline, weatherization, heat pump HVAC tiers by SEER/HSPF, HPWH, packages), current heating fuel. Free API key.
- **Outputs:** Response has fuel_results, rates, emissions_factors, sampling_details, estimate_type (nested fields not visible to us). Upgrades are efficiency tiers, not sized capacity.
- **Covers:** Cost, CO2, Infers home
- **UX worth noting:** Address-in, scenario-out design; returns rates and emissions factors alongside fuel use, so cost and CO2 come from one call.
- **Gap:** No capacity (BTU/hr) sizing or supplemental heat; can't tell from the docs how the home is inferred.
- **Link status:** ✓ (outputs partly unverified)

#### [Rewiring America Incentive API / embeddable calculator](https://www.rewiringamerica.org/tools/incentive-api)
- **Runs it:** Rewiring America
- **Inputs:** Developer sign-up; location and household details (see docs).
- **Outputs:** Federal, state, local and utility incentives. Docs: https://docs.rewiringamerica.org/
- **Covers:** Cost
- **UX worth noting:** Embeddable calculator exists (https://docs.rewiringamerica.org/incentives/embed, ~).
- **Gap:** Incentives only; no sizing or emissions.
- **Link status:** ✓

#### [Palmetto Energy Intelligence API](https://palmetto.com/business/energy-intelligence-api)
- **Runs it:** Palmetto (clean-energy company)
- **Inputs:** 'Any home in the U.S.'; model infers 60+ building characteristics and each can be overridden; calibrates to actual usage if supplied. Whether the key is an address is not stated on the page.
- **Outputs:** Hourly load by end use and fuel, baseline plus upgrade scenarios (60+ upgrades incl. HVAC), utility cost, savings, carbon footprint. Heat pump sizing not mentioned. Free to 500 calls/month, then reported at $0.05/call.
- **Covers:** Cost, CO2, Infers home
- **UX worth noting:** Infer-then-override pattern: sensible defaults from public data, user corrects what they know. Press coverage: https://techcrunch.com/2025/03/17/palmetto-wants-software-developers-to-electrify-america-using-its-ai-building-models
- **Gap:** No stated capacity sizing, balance point or supplemental-heat output. Interior features are harder to infer than rooftops (per TechCrunch).
- **Link status:** ✓

### Heat load & sizing

#### [HEAT: Home Energy Analysis Tool (Code for Boston / HeatSmart Alliance)](https://heat.heatsmartalliance.org)
- **Runs it:** Code for Boston volunteers with HeatSmart Alliance; open source (MIT) https://github.com/codeforboston/home-energy-analysis-tool
- **Inputs:** Home location, thermostat settings, historical gas bills (National Grid / Eversource), basic home info; temperature from a nearby weather station. Free account required.
- **Outputs:** Heat loss rate and design heating load; chart of heating requirement vs outdoor temperature; comparison with other homes by floor area; charts to judge whether a proposed heat pump's capacity fits.
- **Covers:** Sizing
- **UX worth noting:** Closest open-source analogue: heat-load-vs-outdoor-temperature chart is the core visual. Stack per README: React/Remix, Python via Pyodide in the browser. Built for energy coaches.
- **Gap:** Needs a year of bills (US gas only); no cost, CO2 or backup-fuel results; Massachusetts utilities.
- **Link status:** ✓ (UI flow from summary, not screens)

#### [PNNL / DOE Building America: High Performance HVAC Decision Tool](https://basc.pnnl.gov/cchp_decision_tool)
- **Runs it:** PNNL for DOE (operator inferred from domain)
- **Inputs:** ZIP, year built, floor area, whole/part home, existing heating fuel/system/age/capacity/efficiency, duct adequacy; later steps for load calc, duct and panel.
- **Outputs:** Guidance on system capacity, configuration and installation. Balance point, backup heat, cost and CO2 not mentioned on the page.
- **Covers:** Sizing
- **UX worth noting:** Multi-step contractor wizard that starts from the existing system; points to a separate retrofit tool for envelope work.
- **Gap:** Contractor-oriented; no cost/CO2 results seen.
- **Link status:** ✓ (later steps not visible)

#### [Efficiency Maine Heat Load Estimator + NRCan ASHP Sizing Toolkit / LEEP app](https://www.efficiencymaine.com/estimate-your-homes-heating-needs/)
- **Runs it:** Efficiency Maine; Natural Resources Canada
- **Inputs:** Nearest town + last year's fuel use (Maine); house and climate factors (NRCan).
- **Outputs:** Design temp and heat load; NRCan adds capacity-vs-load charts. Details in earlier research.
- **Covers:** Sizing
- **UX worth noting:** See research/heat-pump-sizing-tools.md in the project files.
- **Gap:** Earlier research covers these; listed for completeness.
- **Link status:** ✓ (earlier research)

### Dual-fuel / balance point

#### [Mass Save Switchover Temperature Calculator](https://www.masssave.com/en/residential/switchover-temperature-calculator)
- **Runs it:** Mass Save (MA utilities); hosted externally (app.efficiencyestimator.com)
- **Inputs:** Not visible (hosted tool not opened).
- **Outputs:** Finds the 'most optimal, cost-effective switchover temperature' from current fuel prices. Page notes the natural-gas maximum of 30°F is 'designed to support decreased greenhouse gas emissions rather than operational savings', and that customers can set the switchover to maximize heat pump use, minimize cost, or meet other goals.
- **Covers:** Cost, Backup / dual-fuel, CO2
- **UX worth noting:** Explicitly frames switchover as a choice between lowest cost and lowest emissions.
- **Gap:** Inputs/outputs of the embedded tool unverified; no home-specific sizing.
- **Link status:** ✓ page / ✗ tool

#### [NEEA: Dual-Fuel Furnace + Heat Pump Control Analysis (Larson Energy Research, Mar 2026) and VCHP Levelized Cost Tool](https://neea.org/wp-content/uploads/2026/03/Dual-Fuel-Gas-Furnace-and-Heat-Pump-System-Control.pdf)
- **Runs it:** NEEA (utility-funded alliance) / Larson Energy Research
- **Inputs:** Spreadsheet tool (originally CEE) runs hourly 8760 calc from TMY weather files.
- **Outputs:** Slides define balance point (capacity = load) vs switchover; switchover is 'the largest lever' on gas use (Portland example: 309 therms/yr at 40°F, 154 at 35°F, 105 at 30°F). Recommends ~30°F balance point and switchover a few degrees above. Portland example: furnace+AC $1,093 / 8,127 lb CO2 vs single-speed HP with 30°F switchover $821 / 4,699 lb.
- **Covers:** Sizing, Cost, Backup / dual-fuel, CO2
- **UX worth noting:** Best source of cost-and-CO2 numbers for hybrid operation; shows results as a function of switchover temperature.
- **Gap:** A spreadsheet and slides, not a consumer product. Pacific NW climate and prices.
- **Link status:** ✓ (slides) / tool itself not opened

### Cost & carbon calculators

#### [Canadian Climate Institute Heat Pump Calculator (Dunsky analysis)](https://heatpumpcalculator.ca/)
- **Runs it:** Canadian Climate Institute
- **Inputs:** Not visible on the landing page; compares heat pump costs with other heating options in five Canadian cities.
- **Outputs:** Cost comparison. Data is fall 2023 (updated Mar 2024) and predates the consumer carbon price removal and end of Greener Homes Grant. Technical report: https://climateinstitute.ca/reports/heat-pumps-canada/ (~)
- **Covers:** Cost
- **UX worth noting:** City-level comparison keeps inputs minimal.
- **Gap:** Stale policy assumptions; CO2 and hybrid not mentioned on the pages we could read.
- **Link status:** ✓ page; tool inputs unverified

#### [CEE (Minnesota) Cold Climate Heat Pump Cost and Carbon Calculator](https://mncee.org/cold-climate-heat-pumps-cost-and-carbon-calculator)
- **Runs it:** Center for Energy and Environment (nonprofit), 2020
- **Inputs:** Not described on the page (tool at https://mncee.shinyapps.io/bene_elec/ blocked automated access).
- **Outputs:** Per page: heat pumps vs other heating options, operating cost, carbon saved vs fossil. Dual fuel / supplemental heat not mentioned.
- **Covers:** Cost, CO2
- **UX worth noting:** Pairs cost and carbon in one view for a cold climate.
- **Gap:** Tool not inspected; 2020 vintage.
- **Link status:** ✓ page / ✗ tool

#### [CLEAResult ATLAS Heat Pump Calculator](https://www.clearesult.com/products/CLEAResult-ATLAS-Heatpumps)
- **Runs it:** CLEAResult (white-label for utilities / state energy offices)
- **Inputs:** Not listed; customizable with regional fuel costs and income-based / time-of-use incentives.
- **Outputs:** Cost savings, side-by-side heat pump model comparison, incentives, payback. Sizing, backup heat and emissions not covered (separate ATLAS Carbon product).
- **Covers:** Cost
- **UX worth noting:** Embeds into utility sites; side-by-side comparison.
- **Gap:** No sizing/CO2/backup. Press release: https://www.businesswire.com/news/home/20240604002955/en/CLEAResult-Announces-New-ATLAS-Heat-Pump-Calculator
- **Link status:** ✓

#### [UK DESNZ Heat Pump Suitability Tool](https://www.gov.uk/algorithmic-transparency-records/desnz-heat-pump-suitability-tool)
- **Runs it:** UK government (DESNZ)
- **Inputs:** Country, current heating system type, number of bedrooms (page does not list an address input; mentions EPC integration).
- **Outputs:** Installation cost and carbon savings vs current system, built on housing-stock benchmarks; also planning-permission and grant eligibility.
- **Covers:** Cost, CO2
- **UX worth noting:** Three questions in, benchmark-based answer out. Shows how little input a government tool asks for. Transparency record describes data sources.
- **Gap:** UK context; no capacity sizing or backup heat shown.
- **Link status:** ✓ (transparency record, not the tool itself)

### Contractor / marketplace

#### [Sealed](https://sealed.com)
- **Runs it:** Sealed (company)
- **Inputs:** Contractor-facing; page shows no online estimator.
- **Outputs:** Rebate matching, point-of-sale payment, rebate support, Energy Star Home Upgrade provider. No homeowner sizing found.
- **Covers:** Cost
- **UX worth noting:** Instant, guaranteed rebate amounts shown during the sales visit.
- **Gap:** No public sizing/CO2 tool found.
- **Link status:** ✓

#### [EnergySage](https://www.energysage.com/)
- **Runs it:** EnergySage (marketplace)
- **Inputs:** Homepage lists a heat pump guide and 'personalized plan'; heat pump calculator/quote page could not be fetched.
- **Outputs:** Quote comparison and calculators are described for solar and batteries; heat pump specifics unverified.
- **Covers:** none found
- **UX worth noting:** Quote-comparison marketplace model.
- **Gap:** Could not confirm a heat pump calculator.
- **Link status:** ✓ home / ✗ heat pump page

#### [Dandelion Energy](https://dandelionenergy.com)
- **Runs it:** Dandelion Energy (geothermal installer)
- **Inputs:** 'Get started' contact flow; no address estimator described on the homepage.
- **Outputs:** Marketing claims 30-50% bill savings; no home-specific numbers.
- **Covers:** none found
- **UX worth noting:** Leasing model removes upfront cost framing.
- **Gap:** No public estimator found.
- **Link status:** ✓

#### [Elephant Energy (US) and Carbon Switch](https://www.energysage.com/supplier/26555/elephant-energy)
- **Runs it:** Elephant Energy (electrification installer, Colorado); Carbon Switch
- **Inputs:** Elephant: listed as an EnergySage supplier (~). elephant.energy is a different company (UK business energy). Carbon Switch: carbonswitch.com redirects (302) to homes.rewiringamerica.org; the destination page doesn't mention Carbon Switch, so a merger is inferred, not confirmed.
- **Outputs:** No public calculators found for either.
- **Covers:** none found
- **Gap:** Nothing usable found.
- **Link status:** ~ / ✗

### Home-spec inference

#### [Google Solar API (Building Insights)](https://developers.google.com/maps/documentation/solar/building-insights)
- **Runs it:** Google Maps Platform
- **Inputs:** Latitude/longitude (findClosest).
- **Outputs:** Roof area and pitch per segment, ground area, roof plane height at segment centers, solar potential. No building height, wall area, insulation or heating data. Coverage and EEA limits per its coverage page.
- **Covers:** Infers home
- **UX worth noting:** One call gets footprint and roof geometry from coordinates; useful as a building-size proxy.
- **Gap:** Not heating specific. API key and billing needed. See research/home-specs-from-imagery.md in the project files.
- **Link status:** ✓

#### [Windfall Centre vHEAT (virtual home energy assessment)](https://windfallcentre.ca/services/v-heat/)
- **Runs it:** Windfall Centre (Canada)
- **Inputs:** Page does not list inputs; ML trained on 200,000+ audits.
- **Outputs:** Predicted retrofit response, energy rating and virtual energy label. Sizing not mentioned. (Not the same as Windfall Energy, a UK plug-in battery company.)
- **Covers:** Infers home
- **UX worth noting:** Retrofit combinations update results in real time; virtual label claimed via a portal.
- **Gap:** Details behind sales contact. Canadian context.
- **Link status:** ✓ page

### Models & research

#### [NREL/NLR ResStock](https://resstock.nrel.gov/)
- **Runs it:** DOE, National Laboratory of the Rockies (formerly NREL)
- **Inputs:** Pre-computed; Data Viewer filters by vintage, heating fuel, wall type.
- **Outputs:** Housing-stock simulation results for upgrade savings. Heat pumps not mentioned on the landing page.
- **Covers:** Infers home
- **UX worth noting:** Stock-level 'typical home' defaults by region.
- **Gap:** Not an interactive consumer tool.
- **Link status:** ✓

#### [BEopt](https://beopt.nrel.gov/)
- **Runs it:** DOE / NREL for Building America
- **Inputs:** House size, vintage, location, utility rates, envelope and equipment options.
- **Outputs:** Cost-optimal efficiency packages, EnergyPlus-based. Desktop modeler.
- **Covers:** Cost
- **UX worth noting:** Cost-vs-savings curve of packages.
- **Gap:** Expert tool; heat pump sizing/backup not covered on page.
- **Link status:** ✓

#### [DOE Scout](https://scout.energy.gov/)
- **Runs it:** DOE (Office of Critical Minerals and Energy Innovation)
- **Inputs:** Measure definitions, baseline segments.
- **Outputs:** National energy, CO2 and cost impacts of efficiency measures. Heat pumps not mentioned on page.
- **Covers:** Cost, CO2
- **Gap:** National scale, not per-home.
- **Link status:** ✓

## Gaps across the field

- No tool found that combines all of: location-driven climate, heat pump capacity vs load, supplemental/backup heat, and cost plus CO2 results.
- Dual-fuel switchover appears as a standalone calculator (Mass Save) or analyst spreadsheet (NEEA/CEE), not inside a guided home flow.
- Address-based inference exists (Rewiring America, Palmetto) but the docs we could read don't show capacity sizing or backup heat.
- Sizing tools that need utility bills (HEAT) or a full Manual J (PNNL, NRCan) are aimed at coaches/contractors.
- Nothing found for Fairbanks or Montreal specifically; Alaska tools are in earlier research.

## Not found or not checkable

- Mitsubishi, Daikin, Carrier, Trane: no homeowner-facing sizing tool found; their selection software appears to be contractor-only. A Daikin white paper (BPG-EXTAMB, ~ https://www.DaikinAC.com/content/assets/DOC/White-papers-/BPG-EXTAMB.pdf) turned up in search but was not opened.
- Cleanbit: https://www.cleanbit.ca/ blocked automated access (robots), so nothing could be confirmed.
- Heatpumps.ca: no dedicated NRCan 'heatpumps.ca' product found; the Canadian entries here are NRCan's toolkit (earlier research) and the Canadian Climate Institute calculator.
- Many 'heat pump calculator' sites on *.pages.dev and similar are SEO pages and were excluded.
