// Region and fuel data used by the UI.
// Minneapolis values come from data.zip (data/processed/model_inputs_minneapolis.json and
// msp_weather_TMYx.2011-2025.csv). Boston and Fairbanks are PLACEHOLDERS until the
// Data workstream supplies packs for them. See docs/INTERFACES.md (UI section).
(function () {
  // Fuels: energy per unit (kWh of heat content), appliance efficiency, kg CO2 per unit.
  // CO2 factors: EPA GHG Emission Factors Hub where available. Wood counted as zero CO2.
  const FUELS = {
    gas:      { label: "Natural gas furnace or boiler", short: "natural gas", unit: "therm",  kwh: 29.307, eff: 0.95, co2: 5.306 },
    oil:      { label: "Heating oil",                   short: "heating oil", unit: "gallon", kwh: 40.59,  eff: 0.85, co2: 10.21 },
    propane:  { label: "Propane",                       short: "propane",     unit: "gallon", kwh: 26.82,  eff: 0.92, co2: 5.72 },
    electric: { label: "Electric baseboard or furnace", short: "electric resistance heat", unit: "kWh", kwh: 1, eff: 1.0, co2: null },
    wood:     { label: "Wood stove",                    short: "wood",        unit: "cord",   kwh: 5861.5, eff: 0.70, co2: 0 },
    kerosene: { label: "Kerosene",                      short: "kerosene",    unit: "gallon", kwh: 39.56,  eff: 0.85, co2: 9.75 }
  };

  // Envelope: heat loss per square foot (W per °F per sq ft). Placeholder rule of thumb.
  const ENVELOPES = {
    drafty:  { label: "Drafty / older",       wPerFPerSqft: 0.12 },
    average: { label: "About average",        wPerFPerSqft: 0.085 },
    tight:   { label: "Well sealed / newer",  wPerFPerSqft: 0.055 }
  };

  const REGIONS = {
    boston: {
      id: "boston", name: "Boston", full: "Boston, Massachusetts", short: "Boston, MA",
      dataStatus: "placeholder",
      designTempF: 8,       // ASHRAE 99.6% heating design, 7.7 °F (source 8)
      monthlyMeanF: [29.9, 31.8, 38.3, 48.6, 58.4, 68.0, 74.1, 72.7, 65.6, 54.8, 44.7, 35.2],
      monthlySdF:   [10, 10, 9, 9, 9, 8, 7, 7, 8, 8, 9, 10],
      electricityUsdPerKWh: 0.31,
      gridKgCo2PerKWh: 0.24,
      gridNote: "a mostly natural-gas grid with growing renewables",
      fuelPrices: { gas: 2.10, oil: 4.00, propane: 3.60, electric: 0.31, wood: 350, kerosene: 4.30 },
      rebatesUsd: 8000,
      typicalHome: { floorAreaSqft: 1800, envelope: "drafty", currentHeat: "gas", thermostatF: 68,
                     why: "an older wood-frame house heated by natural gas, the most common setup in the area" }
    },
    minneapolis: {
      id: "minneapolis", name: "Minneapolis", full: "Minneapolis–St. Paul, Minnesota", short: "Minneapolis–St. Paul, MN",
      dataStatus: "data.zip",
      designTempF: -9,        // ASHRAE 99.6% heating design: −23.0 °C (data.zip .ddy)
      monthlyMeanF: [17.3, 21.8, 33.5, 45.5, 60.7, 71.6, 75.4, 72.4, 65.4, 51.3, 36.8, 23.4], // TMYx 2011–2025
      monthlySdF:   [12.7, 11.9, 11.8, 14.1, 11.4, 8.7, 7.1, 7.0, 10.7, 12.6, 9.3, 10.8],
      electricityUsdPerKWh: 0.1644,      // EIA, MN residential 2026 YTD
      gridKgCo2PerKWh: 0.435,            // MISO 2025 hourly average (team calc)
      gridNote: "a grid that is about one-third coal and one-third wind",
      fuelPrices: { gas: 1.03, oil: 4.00, propane: 2.50, electric: 0.1644, wood: 300, kerosene: 4.30 }, // gas: EIA winter avg $10.65/Mcf; others placeholder
      rebatesUsd: 2000,                  // Xcel cold-climate ducted rebate; +$1,100 CenterPoint if gas furnace kept
      rebateIfGasBackupUsd: 1100,
      typicalHome: { floorAreaSqft: 2000, envelope: "average", currentHeat: "gas", thermostatF: 68,
                     why: "a mid-century house with a natural gas furnace, the most common setup in the area" }
    },
    fairbanks: {
      id: "fairbanks", name: "Fairbanks", full: "Fairbanks, Alaska", short: "Fairbanks, AK",
      dataStatus: "placeholder",
      designTempF: -40,
      monthlyMeanF: [-7.9, -2.5, 11.2, 32.5, 49.7, 61.5, 62.9, 57.4, 45.6, 25.0, 3.6, -3.9],
      monthlySdF:   [15, 15, 13, 10, 9, 8, 8, 8, 8, 10, 14, 15],
      electricityUsdPerKWh: 0.26,
      gridKgCo2PerKWh: 0.55,
      gridNote: "a grid that leans heavily on coal and oil",
      fuelPrices: { gas: 2.60, oil: 4.20, propane: 4.80, electric: 0.26, wood: 300, kerosene: 4.60 },
      rebatesUsd: 0,
      typicalHome: { floorAreaSqft: 1800, envelope: "tight", currentHeat: "oil", thermostatF: 68,
                     why: "a well-insulated house heated by fuel oil, the most common setup in interior Alaska" }
    }
  };


  // ---------- Step 2 content ----------
  // CARD RULE: kicker + heading must read as one sentence ("Big savings from replacing / Electric heat or propane"),
  // and the body must directly support the heading. A card may not promise what its body does not show.
  // Every claim carries a tag: "research" (a cited study), "data" (the team's data pack, computed),
  // "reasoning" (our own inference, shown as such) or "gap" (not researched / not enough evidence).
  // Numbers in `src` index SOURCES below.
  const SOURCES = {
    1: { t: "Center for Energy and Environment (CEE), Cold Climate Air Source Heat Pump Field Assessment, 2015–2017 (six Minnesota homes without gas)", u: "https://www.mncee.org/cold-climate-air-source-heat-pump-field-assessment" },
    2: { t: "Schoenbauer et al., CEE / ACEEE, Turning Up the Heat on Cold Climate Heat Pumps (Minnesota field study: ~55% savings vs electric resistance, ~40% vs propane, operation to −20 °F)", u: "https://www.mncee.org/sites/default/files/report-files/ACEEEccHP%20%282%29.pdf" },
    3: { t: "NEEP, Cold Climate Air-Source Heat Pump Specification v3.0 (COP above 1.75 at 5 °F at maximum capacity; capacity ratings at 47, 17 and 5 °F)", u: "https://neep.org/sites/default/files/ColdClimateAir-sourceHeatPumpSpecification-Version3.0FINAL.pdf" },
    4: { t: "Synapse Energy Economics, Switch on the Savings: A Heat Pump Cost-Effectiveness Study (Massachusetts, 2018)", u: "https://www.synapse-energy.com/switch-savings-heat-pump-cost-effectiveness-study" },
    5: { t: "Harvard Kennedy School, Opportunities for Cost-Effective Residential Heat Pump Adoption in Massachusetts", u: "https://www.hks.harvard.edu/opportunities-cost-effective-residential-heat-pump-adoption-massachusetts" },
    6: { t: "Air Source Heat Pumps in Very Cold Climates (Alaska field monitoring and cold-chamber tests, OSTI)", u: "https://www.osti.gov/biblio/1975545" },
    7: { t: "Team data: MSP TMYx 2011–2025 and TMY3 hourly weather, ASHRAE design conditions (.ddy), EIA prices, EPA/MISO emissions. Percentages on this page were computed from these files.", u: null },
    8: { t: "ASHRAE heating design temperatures for major US cities (Boston 99.6%: 7.7 °F), as tabulated by FGIA", u: "https://fgiaonline.org/wp-content/uploads/2025/02/ASHRAE-Temperatures-for-Major-US-Cities.pdf" }
  };

  // Four climate types, in plain language (qualitative; sources in brackets)
  const CLIMATE_TYPES = [
    { id: "mild", name: "Mild winters", text: "A heat pump can handle all your heating and uses far less energy than electric heat.", src: [1] },
    { id: "cold", name: "Cold winters", text: "Modern cold-climate heat pumps are built for this, and save the most over electric heat and propane.", src: [3, 4, 5] },
    { id: "verycold", name: "Very cold winters", text: "Good units keep heating at 0 °F and below. A backup helps on the coldest nights.", src: [1, 2] },
    { id: "extreme", name: "Extreme cold", text: "Less research exists here, so a specialist can help find the right setup.", src: [6] }
  ];

  const CLIMATE = {
    minneapolis: {
      type: "verycold", status: "researched",
      headline: "Minneapolis is a very cold climate that heat pumps can handle, with backup.",
      design: { text: "−9 °F", label: "a very cold night (1-in-250 hours)", src: [7] },
      cards: [
        { k: "In your climate", h: "Most winter hours suit a heat pump", tag: "data", src: [7, 3],
          p: "In the team's typical-year weather file, about 90% of the heat a home needs falls on hours at or above 5 °F, and about 73% at or above 17 °F. Those are the temperatures where cold-climate units publish their ratings." },
        { k: "Big savings from replacing", h: "Electric heat or propane", tag: "research", src: [2, 1],
          p: "A Minnesota field study of cold-climate heat pumps found about 55% energy-cost savings against electric resistance heat and about 40% against propane. Its guidance: size the unit to carry the whole home down to about 10 °F, and use backup below that." },
        { k: "Cleaner heat", h: "Even where gas is cheap", ico: "leaf", tag: "reasoning", src: [1],
          p: "On this grid a heat pump needs only about 2.3 units of heat per unit of electricity to beat a gas furnace on carbon. Good units deliver 2 to 3 or more, and the grid keeps getting cleaner." }
      ],
      notes: [
        { tag: "data", text: "The typical-year file's coldest hour is −12 °F with no hours below −13 °F. The older, colder TMY3 file has 32 hours below −13 °F and a low of −24 °F, so a cold winter is harder on a heat pump than a typical one.", src: [7] },
        { tag: "research", text: "Cold-climate units listed by NEEP must deliver a COP above 1.75 at 5 °F at full output. That is the benchmark Xcel's rebate uses.", src: [3, 7] },
        { tag: "gap", text: "Not found yet: published field results below −13 °F for current models. CEE has a 2026–2029 study planned to measure this.", src: [] }
      ]
    },
    boston: {
      type: "cold", status: "researched",
      headline: "Boston is a good fit for a heat pump. What you replace decides the savings.",
      design: { text: "8 °F", label: "a very cold night (1-in-250 hours)", src: [8] },
      cards: [
        { k: "In your climate", h: "Cold nights are within what heat pumps handle", tag: "reasoning", src: [8, 3, 2],
          p: "Boston's coldest nights are around 8 °F. Cold-climate heat pumps are rated down to 5 °F and keep working well below that." },
        { k: "Big savings from replacing", h: "Electric resistance heat", tag: "research", src: [4, 5],
          p: "A Massachusetts cost study found heat pumps about three times as efficient as electric resistance heat, with a payback near four years even without incentives. A Harvard study put the yearly savings for a typical electric-heated home at up to $2,900." },
        { k: "Cleaner heat", h: "Even where gas is cheap", ico: "leaf", tag: "reasoning", src: [1],
          p: "On Boston's grid a heat pump needs only about 1.3 units of heat per unit of electricity to beat a gas furnace on carbon. Good units deliver 2 to 3 or more." }
      ],
      notes: [
        { tag: "gap", text: "Boston hourly weather has not been added yet, so the number of hours below 5 °F is not computed.", src: [] },
        { tag: "gap", text: "The Synapse study used 2017 fuel prices and we did not check the Harvard study's price assumptions. Current Massachusetts fuel and electricity prices still need checking.", src: [] }
      ]
    },
    fairbanks: {
      type: "extreme", status: "specialist",
      headline: "Fairbanks needs a specialist's eye before you decide.",
      design: null,
      specialist: "Fairbanks winters run far colder than the conditions most heat pump research covers. The published evidence we found says significant data gaps exist for very cold environments and that sizing and operation need careful attention. We can show a rough estimate, but please treat it as a starting point and talk to a local installer or the Alaska Center for Energy and Power before spending money.",
      cards: [
        { k: "In your climate", h: "Mild days suit a heat pump", tag: "reasoning", src: [1],
          p: "Newer cold-climate units run well at moderate temperatures, and can keep running down to about 0 to −13 °F. Fairbanks has many months in that range." },
        { k: "On the coldest days", h: "Your current heat does most of the work", tag: "reasoning", src: [6, 1],
          p: "In the coldest weeks, outdoor temperatures can drop well below what most units are rated for. Expect your current heat to carry much of the load then." },
        { k: "Before you decide", h: "A specialist should check your home", tag: "gap", src: [6],
          p: "Alaska field and cold-chamber work shows heat pumps can stay efficient in very cold climates if used in the right situations and the right way, but gives no simple rule." }
      ],
      notes: [{ tag: "gap", text: "Prices, rebates, grid carbon and climate numbers for Fairbanks in the results are rough placeholders.", src: [] }]
    }
  };
  Object.keys(CLIMATE).forEach(k => REGIONS[k].climate = CLIMATE[k]);

  // Free-text matching for the location box: names, states/provinces, ZIP and postal prefixes.
  const ALIASES = [
    ["boston", /\b(boston|cambridge|somerville|brookline|newton|quincy|massachusetts|mass|ma)\b/],
    ["minneapolis", /\b(minneapolis|st\.? ?paul|saint paul|twin cities|minnesota|mn|msp|bloomington|edina)\b/],
    ["fairbanks", /\b(fairbanks|north pole|alaska|ak)\b/]
  ];
  function matchPlace(text) {
    const t = (text || "").trim().toLowerCase();
    if (!t) return null;
    const zip = t.match(/^\d{5}/);
    if (zip) {
      const z = zip[0];
      if (/^0[12]/.test(z)) return "boston";
      if (/^5[56]/.test(z)) return "minneapolis";
      if (/^99[5-9]/.test(z)) return "fairbanks";
      return null;
    }
    for (const [id, re] of ALIASES) if (re.test(t)) return id;
    return null;
  }

  window.HP_DATA = { FUELS, ENVELOPES, REGIONS, matchPlace, SOURCES, CLIMATE_TYPES };
})();
