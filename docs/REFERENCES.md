# References

The dashboard shows no citation markers. This file is the reference list for the climate page. Numbers match the `src` fields in `ui/regions.js`.

## Sources

1. Center for Energy and Environment (CEE), Cold Climate Air Source Heat Pump Field Assessment, 2015–2017 (six Minnesota homes without gas) <https://www.mncee.org/cold-climate-air-source-heat-pump-field-assessment>
2. Schoenbauer et al., CEE / ACEEE, Turning Up the Heat on Cold Climate Heat Pumps (Minnesota field study: ~55% savings vs electric resistance, ~40% vs propane, operation to −20 °F) <https://www.mncee.org/sites/default/files/report-files/ACEEEccHP%20%282%29.pdf>
3. NEEP, Cold Climate Air-Source Heat Pump Specification v3.0 (COP above 1.75 at 5 °F at maximum capacity; capacity ratings at 47, 17 and 5 °F) <https://neep.org/sites/default/files/ColdClimateAir-sourceHeatPumpSpecification-Version3.0FINAL.pdf>
4. Synapse Energy Economics, Switch on the Savings: A Heat Pump Cost-Effectiveness Study (Massachusetts, 2018) <https://www.synapse-energy.com/switch-savings-heat-pump-cost-effectiveness-study>
5. Harvard Kennedy School, Opportunities for Cost-Effective Residential Heat Pump Adoption in Massachusetts <https://www.hks.harvard.edu/opportunities-cost-effective-residential-heat-pump-adoption-massachusetts>
6. Air Source Heat Pumps in Very Cold Climates (Alaska field monitoring and cold-chamber tests, OSTI) <https://www.osti.gov/biblio/1975545>
7. Team data: MSP TMYx 2011–2025 and TMY3 hourly weather, ASHRAE design conditions (.ddy), EIA prices, EPA/MISO emissions. Percentages on this page were computed from these files. (team data, no public link)
8. ASHRAE heating design temperatures for major US cities (Boston 99.6%: 7.7 °F), as tabulated by FGIA <https://fgiaonline.org/wp-content/uploads/2025/02/ASHRAE-Temperatures-for-Major-US-Cities.pdf>

## Where each source is used

### Boston, Massachusetts

- In your climate / Cold nights are within what heat pumps handle (reasoning): sources 8, 3, 2
- Big savings from replacing / Electric resistance heat (research): sources 4, 5
- Cleaner heat / Less carbon than a gas furnace (reasoning): sources 1

### Minneapolis–St. Paul, Minnesota

- In your climate / Most winter hours suit a heat pump (data): sources 7, 3
- Big savings from replacing / Electric heat or propane (research): sources 2, 1
- Cleaner heat / Less carbon than a gas furnace (reasoning): sources 1

### Fairbanks, Alaska

- In your climate / Mild days suit a heat pump (reasoning): sources 1
- On the coldest days / Your current heat does most of the work (reasoning): sources 6, 1
- Before you decide / A specialist should check your home (gap): sources 6

### Climate types

- Mild winters: sources 1
- Cold winters: sources 3, 4, 5
- Very cold winters: sources 1, 2
- Extreme cold: sources 6

### Heat pump definition

- "two to three times as efficient as ordinary electric heat": source 1

## Income-based rebate tiers (results page toggle)

The "Income-based rebate" toggle adds a tier amount on top of the utility rebate, capped at the installed cost:

| Household income (share of area median income) | Amount counted | Where it comes from |
|---|---|---|
| Over 150% | $0 | no income-based rebate |
| 80% to 150% | up to $4,000 | `apply_rebate.py` ("partial"). **No source cited in the repo.** |
| Under 80% | up to $8,000 | `apply_rebate.py` ("full"); also `ui/rebates.js` and `data/raw/rebates/mn_rebates_2026.md` (homeenergybasics.com/heat-pumps/states/mn: "up to $8,000 for households under 80% of AMI") |

Flags to resolve before relying on these:
- The $4,000 tier for 80% to 150% AMI is uncited. As we understand the federal HEAR (home electrification and appliance rebates) design, the middle tier pays a share of the cost (not a flat $4,000) up to the same $8,000 heat pump cap. We have not verified this against the DOE or state program pages; please confirm.
- `ui/rebates.js` lists the Minnesota HEAR program as "Check status" (not launched in the team's sources). The toggle counts it as if open; the price shown is therefore best case for qualifying households.
- Income limits are set by area median income for your county and household size, which the dashboard does not look up.
