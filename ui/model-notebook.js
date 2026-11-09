// Patrick O'Toole's model.ipynb, ported to run in the browser against the same data the notebook reads
// (ResStock hourly heating load, hourly Minneapolis weather, NEEP cold-climate heat pump profiles; exported to
// ui/notebook-data.js by model/export_notebook_data.py). Used for Minneapolis. Other cities fall through to the
// previous model (model-patrick.js / stub) until the notebook has data for them.
//
// Same logic as the notebook, cell for cell:
//  - run_thermal_hp_sim: each hour the heat pump delivers min(demand, capacity at outdoor temp), the gas furnace
//    (80% efficient) covers the rest. kWh = heat / max(1, COP) / 3412.14; therms = aux heat / 0.80 / 100,000.
//    Grid 0.45 kg CO2/kWh, gas 5.30 kg CO2/therm. COP and capacity are linear in outdoor temp, clamped at the ends.
//  - Parameter search: baseline "NG only" plus every NEEP profile (cop_max column).
//  - capital_cost = 1075.2 x tons + 1193;  get_rebate: full = min(cost, 8000), partial = min(cost/2, 4000), none = 0.
//  - grand operating cost = operating cost + CO2 kg x ($ per tonne) / 1000.
//  - Winner = lowest grand operating cost among heat pumps with positive grand savings vs. NG only.
// Inputs from page 3, mapped to the notebook's parameters (model/optimize.py is the same run in Python):
//  dollars_per_ton_co2 <- carbon slider; square_footage, chosen_set_point, current_heating_system <- size, thermostat, heating today;
//  insulation slider -> the unified_r target of find_closest_row; price_per_kWh_electric, price_per_therm_secondary <- prices;
//  rebate_type <- income range. The home is picked with the notebook's find_closest_row over its 173 Minneapolis homes.
// Not in the notebook, added so the page can draw it: monthly series, 15-year totals (annual x 15, no discounting),
// no-winner case (keep the furnace), and non-gas backup fuels (price and CO2 per unit of heat from the page inputs).
(function () {
  const D = window.NB_DATA, Prev = window.HeatPumpModel;
  if (!D) return;
  const LAMBDAS = [0, 10, 25, 50, 75, 100, 150, 200, 300];   // $ per tonne CO2, the dial (default 300 = notebook default)
  const BTU_PER_KWH = 3412.14, FURNACE_EFF = 0.80, GRID_KG_KWH = 0.45, GAS_KG_THERM = 5.30, LIFE = 15;
  const DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const monthOf = new Uint8Array(D.hours);
  { let h = 0; DAYS.forEach((d, m) => { for (let i = 0; i < d * 24 && h < D.hours; i++) monthOf[h++] = m; }); }

  const r1 = x => Math.round(x * 10) / 10;   // display size in tenths of a ton; exact tonnage stays in the cost maths
  const capitalCost = t => t <= 0 ? 0 : 1075.2 * t + 1193;                                    // notebook capital_cost
  const getRebate = (cost, type) => type === "full" ? Math.min(cost, 8000) : type === "partial" ? Math.min(cost / 2, 4000) : 0;   // notebook get_rebate

  function interp(xs, ys, x) {                                                                  // scipy interp1d, linear, clamped ends
    if (x <= xs[0]) return ys[0]; if (x >= xs[xs.length - 1]) return ys[ys.length - 1];
    let i = 1; while (x > xs[i]) i++;
    return ys[i - 1] + (ys[i] - ys[i - 1]) * (x - xs[i - 1]) / (xs[i] - xs[i - 1]);
  }

  // Aux fuel per unit of heat delivered: {usd, kg} per BTU. Gas follows the notebook (80% furnace, $/therm); other fuels use the page's per-kWh-heat values.
  function auxPerBtu(inp) {
    if (inp.prices.fuelUnit === "therm") return { usd: inp.prices.fuelUsdPerUnit / FURNACE_EFF / 1e5, kg: GAS_KG_THERM / FURNACE_EFF / 1e5, therm: true };
    return { usd: inp.prices.fuelUsdPerKWhHeat / BTU_PER_KWH, kg: inp.emissions.fuelKgCo2PerKWhHeat / BTU_PER_KWH };
  }

  // run_thermal_hp_sim for one profile (null = no heat pump) over the year
  // Hourly loads ship as base64 uint16 in tens of BTU; decode once per home.
  const loads = new Map();
  function loadOf(h) {
    if (!loads.has(h.id)) { const b = atob(h.load), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); loads.set(h.id, new Uint16Array(u.buffer)); }
    return loads.get(h.id);
  }

  function sim(home, prof, inp, aux) {
    const L = loadOf(home);
    const monthly = DAYS.map(() => ({ costUsd: 0, co2Kg: 0 }));
    let kwh = 0, aux_btu = 0, hp_btu = 0, usd = 0, kg = 0;
    const el = inp.prices.electricityUsdPerKWh;
    for (let t = 0; t < D.hours; t++) {
      const need = L[t] * 10, T = D.tempF[t];
      if (!(need > 0)) continue;
      let hp = 0, e = 0;
      if (prof) {
        hp = Math.min(need, interp(prof.t, prof.cap, T));
        e = hp / Math.max(1, interp(prof.t, prof.cop, T)) / BTU_PER_KWH;
      }
      const ax = Math.max(0, need - hp);
      const c = e * el + ax * aux.usd, k = e * GRID_KG_KWH + ax * aux.kg;
      kwh += e; aux_btu += ax; hp_btu += hp; usd += c; kg += k;
      const m = monthly[monthOf[t]]; m.costUsd += c; m.co2Kg += k;
    }
    return { kwh, auxBtu: aux_btu, usd, kg, monthly, coverage: hp_btu / Math.max(1, hp_btu + aux_btu) };
  }

  const cache = new Map();   // profile sims are the slow part; they depend on home, prices and fuel only
  function allSims(home, inp, aux) {
    const key = [home.id, inp.prices.electricityUsdPerKWh, aux.usd, aux.kg].join("|");
    if (!cache.has(key)) cache.set(key, { base: sim(home, null, inp, aux), hp: D.profiles.map(p => sim(home, p, inp, aux)) });
    return cache.get(key);
  }

  // The notebook's find_closest_row(df, heating_fuel, heating_setpoint, unified_r, area): among homes with that fuel, the smallest
  // sum of squared differences in standard-deviation units (std over all 173 homes); first one wins a tie, as pandas idxmin does.
  const FUEL = { gas: "Natural Gas", electric: "Electricity", propane: "Propane", oil: "Fuel Oil", wood: "Other Fuel", kerosene: "Other Fuel" };
  // Toggle: window.NOTEBOOK_ZSCORE_POOL = true (or ?zpool=1) z-scores over the fuel-matched homes instead of all homes. Default off = notebook.
  const zPool = () => (typeof window !== "undefined" && (window.NOTEBOOK_ZSCORE_POOL === true || /[?&]zpool=1/.test(window.location.search)));
  function poolScales(c) {
    const sd = f => { const m = c.reduce((a, h) => a + f(h), 0) / c.length; return Math.sqrt(c.reduce((a, h) => a + (f(h) - m) ** 2, 0) / Math.max(1, c.length - 1)) || 1; };
    return { heating_setpoint: sd(h => h.setpointF), unified_r_value: sd(h => h.unifiedR), area: sd(h => h.areaSqft) };
  }
  function findClosestRow(fuel, setpoint, unifiedR, area) {
    const c = D.homes.filter(h => h.fuel === fuel), sc = zPool() ? poolScales(c) : D.scales;
    if (!c.length) return null;
    let best = null, bd = Infinity;
    for (const h of c) {
      const d = ((h.setpointF - setpoint) / sc.heating_setpoint) ** 2 + ((h.unifiedR - unifiedR) / sc.unified_r_value) ** 2 + ((h.areaSqft - area) / sc.area) ** 2;
      if (d < bd) { bd = d; best = h; }
    }
    return best;
  }
  function pickHome(inp) {
    const H = inp.home, sp = H.thermostatF ?? 68, r = H.insulationR ?? 2.5, a = H.floorAreaSqft ?? 1500;
    const own = findClosestRow(FUEL[H.currentHeat] || "Natural Gas", sp, r, a);
    return own ? { home: own, fuelFallback: false } : { home: findClosestRow("Natural Gas", sp, r, a), fuelFallback: true };
  }

  function run(inp) {
    if (inp.region.id !== "minneapolis") return Prev.run(inp);
    const { home, fuelFallback } = pickHome(inp), aux = auxPerBtu(inp), L = loadOf(home);
    const sc = inp.scenario || {}, price = Number.isFinite(sc.carbonUsd) ? sc.carbonUsd : LAMBDAS[Number.isInteger(sc.lamIdx) ? sc.lamIdx : 8];
    const { base, hp } = allSims(home, inp, aux), type = inp.costs.rebateType || "none";
    const rowsAt = pr => {
      const g = s => s.usd + s.kg * pr / 1000, bg = g(base);
      return D.profiles.map((p, i) => {
        const s = hp[i], cap = capitalCost(p.nominalTons), reb = getRebate(cap, type), net = cap - reb;
        return { p, s, cap, reb, net, grandSave: bg - g(s), opSave: base.usd - s.usd, grand: g(s) };
      });
    };
    const winnerOf = rs => { const w = rs.filter(r => r.p.nominalTons > 0 && r.grandSave > 0); return w.length ? w.reduce((b, r) => r.grand < b.grand ? r : b) : null; };
    const baseGrand = base.usd + base.kg * price / 1000;
    const rows = rowsAt(price), winner = winnerOf(rows);
    // the dial sweep: what the notebook picks at each carbon price on the dial (plus the current one)
    const sweep = LAMBDAS.concat(LAMBDAS.includes(price) ? [] : [price]).sort((a, b) => a - b).map(pr => {
      const w = winnerOf(rowsAt(pr)), s2 = w ? w.s : base;
      const lifeCost = (w ? w.net : 0) + LIFE * s2.usd, lifeCo2T = LIFE * s2.kg / 1000, baseLife = LIFE * base.usd, baseCo2T = LIFE * base.kg / 1000;
      return { lam: pr, sizeTons: w ? r1(w.p.nominalTons) : 0, lifetimeCostUsd: lifeCost, lifetimeCo2T: lifeCo2T,
               usdPerTonne: w && baseCo2T > lifeCo2T ? (lifeCost - baseLife) / (baseCo2T - lifeCo2T) : null };
    });
    let chosen = winner;
    if (inp.sizeTons) {   // an explicit size (e.g. the rebate comparison re-running the page's pick): best profile of that size
      const same = rows.filter(r => Math.abs(r.p.nominalTons - inp.sizeTons) < 0.05);
      if (same.length) chosen = same.reduce((b, r) => r.grand < b.grand ? r : b);
    }
    // No heat pump beats the furnace at this carbon price: the suggestion is to keep it (sizeTons 0), but the page still draws the
    // best heat pump (lowest grand cost) against the furnace so both lines show.
    const alt = chosen ? null : rows.filter(r => r.p.nominalTons > 0).reduce((b, r) => !b || r.grand < b.grand ? r : b, null);
    const shown = chosen || alt;
    const mkMonthly = c => base.monthly.map((m, i) => ({ today: { costUsd: m.costUsd, co2Kg: m.co2Kg },
      heatPump: c ? { costUsd: c.s.monthly[i].costUsd, co2Kg: c.s.monthly[i].co2Kg } : { costUsd: m.costUsd, co2Kg: m.co2Kg } }));
    let tot = 0, pk = 0; for (let t = 0; t < D.hours; t++) { tot += L[t]; if (L[t] > pk) pk = L[t]; }
    const heatKWh = tot * 10 / BTU_PER_KWH, peakKw = pk * 10 / BTU_PER_KWH;
    const sRow = c => c ? c.s : base;
    const s = sRow(shown), life = LIFE;
    const upfront = shown ? { installedUsd: shown.cap, rebatesUsd: shown.reb, netUsd: shown.net } : { installedUsd: 0, rebatesUsd: 0, netUsd: 0 };
    const saveYr = base.usd - s.usd;
    return {
      schemaVersion: 1, isPlaceholder: false, modelVersion: "model.ipynb (Patrick O'Toole), run in the browser",
      recommendedSizeTons: winner ? r1(winner.p.nominalTons) : 0, sizeTons: chosen ? r1(chosen.p.nominalTons) : 0,
      capacityKwAt5F: shown ? interp(shown.p.t, shown.p.cap, 5) / BTU_PER_KWH : null, designLoadKw: peakKw, lifetimeYears: life,
      annual: {
        today: { costUsd: base.usd, co2Kg: base.kg, heatKWh },
        heatPump: { costUsd: s.usd, co2Kg: s.kg, electricityKWh: s.kwh, heatPumpShare: shown ? s.coverage : 0 }
      },
      monthly: mkMonthly(shown), upfront,
      paybackYears: shown && shown.grandSave > 0 ? shown.net / shown.grandSave : null,   // notebook grand_payback = net capital / grand operating savings
      grandSavingsUsd: shown ? shown.grandSave : 0,
      lifetime: { costUsd: upfront.netUsd + life * s.usd, co2Kg: life * s.kg, todayCostUsd: life * base.usd, todayCo2Kg: life * base.kg },
      sizes: rows.map(r => ({ sizeTons: r1(r.p.nominalTons), lifetimeCostUsd: r.net + life * r.s.usd, lifetimeCo2Kg: life * r.s.kg, heatPumpShare: r.s.coverage,
                              paybackYears: r.opSave > 0 ? r.net / r.opSave : null, profile: r.p.id, brand: r.p.brand, tonsExact: r.p.nominalTons, grandSavingsUsd: r.grandSave })),
      sweep,
      nb: { winnerJson: shown ? {   // same keys as the notebook's winner.json row
              machine_profile: shown.p.id, nominal_tons: shown.p.nominalTons, hp_coverage_pct: shown.s.coverage * 100,
              total_elec_kwh: shown.s.kwh, total_gas_therms: aux.therm ? shown.s.auxBtu / FURNACE_EFF / 1e5 : shown.s.auxBtu / 1e5,
              total_operating_cost: shown.s.usd, total_co2_kg: shown.s.kg, capital_cost_usd: shown.cap, rebate_usd: shown.reb,
              grand_operating_cost: shown.grand, grand_operating_savings: shown.grandSave, net_capital_cost_usd: shown.net,
              grand_payback: shown.grandSave > 0 ? shown.net / shown.grandSave : null, ng_baseline_grand_cost: baseGrand } : null,
            isWinner: !!chosen && chosen === winner, carbonUsdPerTonne: price, rebateType: type, home: { building_id: home.id, area: home.areaSqft, heating_fuel: home.fuel, heating_setpoint: home.setpointF, unified_r_value: home.unifiedR, fuel_fallback: fuelFallback },
            buildingId: home.id, homeAreaSqft: home.areaSqft, profile: shown ? shown.p.id : null, keepFurnace: !chosen, altTons: alt ? r1(alt.p.nominalTons) : null,
            brand: shown ? shown.p.brand : null, grandCostUsd: chosen ? chosen.grand : baseGrand, baselineGrandCostUsd: baseGrand },
      notes: [
        "Runs the team's model.ipynb: a real ResStock home's hourly heating load and real Minneapolis weather, matched to AHRI-listed cold-climate heat pumps.",
        "The heat pump covers what it can at each outdoor temperature and your current system covers the rest.",
        "Costs include a carbon price of $" + price + " per tonne; installed cost and rebates follow the notebook's formulas.",
        ...(chosen ? [] : ["At this carbon price keeping your current heat is cheapest overall, so the charts compare it with the best heat pump option."])
      ]
    };
  }

  window.HeatPumpModelNB = { run, lambdas: LAMBDAS, regionId: "minneapolis" };
  window.HeatPumpModel = { run, isPlaceholder: false, sizes: Prev.sizes };
})();
