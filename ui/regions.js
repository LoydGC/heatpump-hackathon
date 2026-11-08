// Region and fuel data used by the UI.
// Minneapolis values come from data.zip (data/processed/model_inputs_minneapolis.json and
// msp_weather_TMYx.2011-2025.csv). Boston, Montréal and Fairbanks are PLACEHOLDERS until the
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
      designTempF: 9,
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
      designTempF: -5,        // ASHRAE 99% heating design: −20.6 °C
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
    montreal: {
      id: "montreal", name: "Montréal", full: "Montréal, Québec", short: "Montréal, QC",
      dataStatus: "placeholder",
      designTempF: -10,
      monthlyMeanF: [14.5, 17.6, 28.4, 43.5, 56.5, 65.8, 70.5, 68.5, 60.4, 48.0, 36.5, 22.8],
      monthlySdF:   [12, 12, 11, 9, 9, 8, 7, 7, 8, 9, 10, 12],
      electricityUsdPerKWh: 0.07,
      gridKgCo2PerKWh: 0.002,
      gridNote: "an almost entirely hydroelectric grid",
      fuelPrices: { gas: 1.20, oil: 3.90, propane: 3.20, electric: 0.07, wood: 280, kerosene: 4.00 },
      rebatesUsd: 3000,
      typicalHome: { floorAreaSqft: 1300, envelope: "average", currentHeat: "electric", thermostatF: 68,
                     why: "a duplex-style home with electric baseboard heaters, the most common setup in Québec" }
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

  // Free-text matching for the location box: names, states/provinces, ZIP and postal prefixes.
  const ALIASES = [
    ["boston", /\b(boston|cambridge|somerville|brookline|newton|quincy|massachusetts|mass|ma)\b/],
    ["minneapolis", /\b(minneapolis|st\.? ?paul|saint paul|twin cities|minnesota|mn|msp|bloomington|edina)\b/],
    ["montreal", /\b(montr[eé]al|laval|longueuil|qu[eé]bec|qc|quebec)\b/],
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
    if (/^h\d[a-z]/.test(t.replace(/\s/g, ""))) return "montreal"; // Montréal postal codes start with H
    for (const [id, re] of ALIASES) if (re.test(t)) return id;
    return null;
  }

  window.HP_DATA = { FUELS, ENVELOPES, REGIONS, matchPlace };
})();
