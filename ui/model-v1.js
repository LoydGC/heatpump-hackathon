// Adapter for the team's Python model v1 (Minneapolis only). Reads model/results/frontend_data.json
// (a static lookup produced by model/export_frontend.py) and returns output in the same shape the page
// already draws from HeatPumpModel.run, plus a `v1` block with model-specific fields.
//
// v1 is NOT the final model: "not exactly what our end model will be, but closer to what we're thinking."
// It simulates ONE fixed typical house (15 kW design load), so the user's home-size / envelope / price
// inputs do not change its numbers yet. Mapping tables: docs/INTERFACES.md ("Model v1 mapping").
// If the JSON cannot be fetched (e.g. page opened from file://), `ready` resolves false and the page
// falls back to the placeholder stub for Minneapolis.
(function () {
  const URL = "model/results/frontend_data.json";
  const KBTUH_PER_TON = 12;
  const state = { data: null, error: null };
  const ready = fetch(URL).then(r => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(d => { state.data = d; return true; })
    .catch(e => { state.error = String(e); return false; });

  const sum = a => a.reduce((x, y) => x + y, 0);
  const key = sc => `${sc.tariff}|${sc.weather}|credit${sc.credit}|${sc.controller}`;
  const lambdas = () => state.data ? state.data.meta.lambda_grid_usd_per_t : [];

  function installed(sizeK, a) { return sizeK ? a.installed_cost_fixed_usd + a.installed_cost_per_kBtuh * sizeK : 0; }

  // sc: { tariff: "flat"|"tou", weather: "tmyx_main"|"tmy3_cold", credit: 0|4000, controller: "smart"|"standard", lamIdx, rebatesOn }
  function run(inp, sc) {
    const d = state.data, A = d.meta.assumptions, life = d.meta.lifetime_years;
    const lam = lambdas()[sc.lamIdx];
    const rec = d.recommendations[key(sc)][String(lam)];
    const m = rec.monthly;
    const baseCost = sum(m.base_cost), baseCo2 = sum(m.base_co2_kg);
    const sizeK = rec.size_kbtuh;
    const inst = installed(sizeK, A);
    const rebate = sizeK ? (rec.centerpoint_rule ? A.rebate_xcel_usd + A.rebate_centerpoint_usd : A.rebate_xcel_usd) : 0;
    const credit = sizeK ? Math.max(0, inst - rebate - rec.up_front) : 0;   // AC credit scenario, backed out of up_front
    const incomeUsd = sizeK ? Math.max(0, Math.min(sc.incomeUsd || 0, inst - (sc.rebatesOn ? rebate : 0))) : 0;   // income-based rebate, capped at the installed cost
    const rebateUsed = (sc.rebatesOn ? rebate : 0) + incomeUsd;
    const net = sizeK ? inst - rebateUsed - credit : 0;
    const annualCost = rec.annual_cost, annualCo2Kg = rec.annual_co2_t * 1000;
    const save = baseCost - annualCost;
    const lifeCost = net + life * annualCost;
    const out = {
      schemaVersion: 1, isPlaceholder: false, modelVersion: "python-v1 (model/)",
      recommendedSizeTons: sizeK / KBTUH_PER_TON, sizeTons: sizeK / KBTUH_PER_TON,
      capacityKwAt5F: null, designLoadKw: A.design_load_kW, lifetimeYears: life,
      annual: {
        today: { costUsd: baseCost, co2Kg: baseCo2, heatKWh: null },
        heatPump: { costUsd: annualCost, co2Kg: annualCo2Kg, electricityKWh: null, heatPumpShare: rec.hp_share }
      },
      monthly: m.base_cost.map((_, i) => ({ today: { costUsd: m.base_cost[i], co2Kg: m.base_co2_kg[i] },
                                           heatPump: { costUsd: m.new_cost[i], co2Kg: m.new_co2_kg[i] } })),
      upfront: { installedUsd: inst, rebatesUsd: rebateUsed, netUsd: net, acCreditUsd: credit },
      paybackYears: sizeK && save > 0 ? net / save : null,
      lifetime: { costUsd: lifeCost, co2Kg: life * annualCo2Kg, todayCostUsd: life * baseCost, todayCo2Kg: life * baseCo2 },
      sizes: [],
      notes: [
        "Model v1: not exactly what our end model will be, but closer to what we're thinking.",
        "It simulates one fixed typical house (15 kW heating load at \u22125 \u00b0F) hour by hour, so your home size, draftiness and price edits don't change these numbers yet.",
        "Placeholders to verify: installed cost ($5,286 + $178.6 per 1,000 BTU/h), rebates ($2,000 Xcel + $1,100 CenterPoint), time-of-use rates, and the $4,000 AC credit.",
        "Grid carbon is a 2025 MISO average (not marginal) figure, there is no discounting, and the model covers heating only."
      ],
      v1: { rec, lam, lamIdx: sc.lamIdx, scenario: sc, sizeKbtuh: sizeK, rebateAvailableUsd: rebate,
            tonnesSaved15y: rec.tonnes_saved_15y, usdPerTonne: rec.usd_per_tonne, switchoverC: rec.switchover_C,
            controller: rec.controller, centerpointRule: !!rec.centerpoint_rule, peakKw: rec.peak_kW }
    };
    return out;
  }

  // One row per slider value for the "how the recommendation changes" table.
  function sweep(sc) {
    const d = state.data;
    return lambdas().map((lam, i) => {
      const r = d.recommendations[key(sc)][String(lam)];
      return { lam, lamIdx: i, sizeKbtuh: r.size_kbtuh, lifetimeCostUsd: r.lifetime_cost, lifetimeCo2T: r.lifetime_co2_t, usdPerTonne: r.usd_per_tonne };
    });
  }

  // Best heat-pump option the model finds (highest carbon price on the grid), used to show whether a heat pump
  // beats gas at a given dial setting even when the model's pick at that setting is "keep the furnace".
  function bestHeatPump(sc) {
    const d = state.data, L = lambdas();
    for (let i = L.length - 1; i >= 0; i--) { const r = d.recommendations[key(sc)][String(L[i])]; if (r.size_kbtuh) return r; }
    return null;
  }

  window.HeatPumpModelV1 = { ready, run, sweep, bestHeatPump, lambdas, loaded: () => !!state.data, error: () => state.error,
    meta: () => state.data && state.data.meta, regionId: "minneapolis", KBTUH_PER_TON };
})();
