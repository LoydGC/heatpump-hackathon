// Patrick O'Toole's hourly model (model.ipynb, run_thermal_hp_sim), ported to JS "as is" and plugged into the
// dashboard through the same HeatPumpModel.run(inputs) -> outputs contract as the stub (docs/INTERFACES.md).
// Kept from the notebook: 1-node RC house (C = 15 Btu/F per sq ft, 68 F +/- 1 F deadband), heat pump first and backup for the
// shortfall, COP and capacity linearly interpolated vs outdoor temp (47/17/5/-22 F), capacity curve scaled from tons as in his
// parameter search (1.0 / 0.80 / 0.65 / 0.35 of nominal), default COP curve 3.6 / 2.4 / 1.8 / 1.0.
// Adapted: UA comes from the dashboard's heat loss (W per F x 3.412) instead of area / R; backup is the home's current system
// (the notebook assumes an 80% gas furnace); prices, emissions and thermostat come from the inputs; installed cost uses the
// dashboard's $/ton (the notebook's capital cost equation, equation.py, is not wired in); hourly outdoor temps are synthesized
// from monthly mean and spread (no real weather for non-Minneapolis regions yet; Minneapolis still uses model v1 when loaded).
// Not in the notebook, added here: baseline "today" run, size sweep, and the cost-vs-carbon pick (same rule as the stub).
(function () {
  const DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const SIZES = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
  const BTU_PER_KWH = 3412.14, DEADBAND_F = 1, MASS_BTU_PER_F_SQFT = 15, Q_INT_BTU = 2000;
  const COP_T = [-22, 5, 17, 47], COP_V = [1.0, 1.8, 2.4, 3.6];
  const CAP_T = [-22, 5, 17, 47], CAP_F = [0.35, 0.65, 0.80, 1.0];

  function ninv(p){const a=[-39.6968302866538,220.946098424521,-275.928510446969,138.357751867269,-30.6647980661472,2.50662827745924],b=[-54.4760987982241,161.585836858041,-155.698979859887,66.8013118877197,-13.2806815528857],c=[-0.00778489400243029,-0.322396458041136,-2.40075827716184,-2.54973253934373,4.37466414146497,2.93816398269878],d=[0.00778469570904146,0.32246712907004,2.445134137143,3.75440866190742],pl=0.02425;let q,r;if(p<pl){q=Math.sqrt(-2*Math.log(p));return(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)}if(p>1-pl){q=Math.sqrt(-2*Math.log(1-p));return-(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)}q=p-.5;r=q*q;return(((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q/(((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1)}
  function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  // Hourly temps: each month's values are the normal quantiles for its mean/sd, ordered by an AR(1) series so cold snaps persist.
  const cache = {};
  function hourlyTemps(region) {
    if (cache[region.id]) return cache[region.id];
    const rand = rng(42), temps = [], month = [];
    region.monthlyMeanF.forEach((m, mi) => {
      const n = DAYS[mi] * 24, noise = new Float64Array(n); let x = 0;
      for (let h = 0; h < n; h++) { x = 0.97 * x + Math.sqrt(1 - 0.97 * 0.97) * ninv(Math.min(0.999, Math.max(0.001, rand()))); noise[h] = x; }
      const order = Array.from(noise.keys()).sort((i, j) => noise[i] - noise[j]);
      const t = new Float64Array(n);
      order.forEach((idx, rank) => { t[idx] = m + region.monthlySdF[mi] * ninv((rank + 0.5) / n); });
      for (let h = 0; h < n; h++) { temps.push(t[h]); month.push(mi); }
    });
    return (cache[region.id] = { temps, month });
  }

  function interp(xs, ys, x) {
    if (x <= xs[0]) return ys[0]; if (x >= xs[xs.length - 1]) return ys[ys.length - 1];
    for (let i = 1; i < xs.length; i++) if (x <= xs[i]) return ys[i - 1] + (ys[i] - ys[i - 1]) * (x - xs[i - 1]) / (xs[i] - xs[i - 1]);
  }

  // Notebook loop: heat only when indoor < setpoint - deadband or there is a net load; HP up to its capacity, backup covers the rest.
  function simulate(inp, sizeTons) {
    const { temps, month } = hourlyTemps(inp.region);
    const setF = inp.home.thermostatF, area = inp.home.floorAreaSqft;
    const ua = inp.home.heatLossWPerF * 3.412, c = area * MASS_BTU_PER_F_SQFT;
    const nomBtu = sizeTons * 12000;
    const hpPrice = inp.prices.electricityUsdPerKWh * (inp.prices.timeOfUse ? 0.9 : 1);
    const heatPrice = inp.prices.fuelUsdPerKWhHeat, heatCo2 = inp.emissions.fuelKgCo2PerKWhHeat, grid = inp.emissions.gridKgCo2PerKWh;
    const monthly = DAYS.map(() => ({ today: { costUsd: 0, co2Kg: 0 }, heatPump: { costUsd: 0, co2Kg: 0 } }));
    let tIn = setF, load = 0, hpHeat = 0, elec = 0, auxKWh = 0, maxNeed = 0;
    for (let t = 0; t < temps.length; t++) {
      const T = temps[t];
      const need = Math.max(0, ua * (tIn - T) - Q_INT_BTU);
      let hp = 0, aux = 0, e = 0;
      if (tIn < setF - DEADBAND_F || need > 0) {
        hp = Math.min(need, nomBtu * interp(CAP_T, CAP_F, T));
        aux = Math.max(0, need - hp);
        e = hp > 0 ? hp / Math.max(1, interp(COP_T, COP_V, T)) / BTU_PER_KWH : 0;
      }
      tIn += ((hp + aux + Q_INT_BTU - ua * (tIn - T)) / c);
      const m = monthly[month[t]], auxK = aux / BTU_PER_KWH;
      load += hp + aux; hpHeat += hp; elec += e; auxKWh += auxK; maxNeed = Math.max(maxNeed, need);
      m.heatPump.costUsd += e * hpPrice + auxK * heatPrice; m.heatPump.co2Kg += e * grid + auxK * heatCo2;
      m.today.costUsd += (hp + aux) / BTU_PER_KWH * heatPrice; m.today.co2Kg += (hp + aux) / BTU_PER_KWH * heatCo2;
    }
    return { monthly, load: load / BTU_PER_KWH, hpHeat: hpHeat / BTU_PER_KWH, elec, maxNeedKw: maxNeed / BTU_PER_KWH };
  }

  // "Today" = the same house heated entirely by the current system (size 0 run, notebook's 0-ton case).
  function summarize(inp, sizeTons, base) {
    const r = simulate(inp, sizeTons), sum = (k, f) => r.monthly.reduce((a, m) => a + m[k][f], 0);
    const annual = {
      today: { costUsd: sum("today", "costUsd"), co2Kg: sum("today", "co2Kg"), heatKWh: r.load },
      heatPump: { costUsd: sum("heatPump", "costUsd"), co2Kg: sum("heatPump", "co2Kg"), electricityKWh: r.elec, heatPumpShare: r.load ? r.hpHeat / r.load : 0 }
    };
    const installedUsd = sizeTons * inp.costs.installedUsdPerTon, rebatesUsd = Math.min(inp.costs.rebatesUsd, installedUsd), netUsd = installedUsd - rebatesUsd;
    const save = annual.today.costUsd - annual.heatPump.costUsd, life = inp.costs.lifetimeYears;
    return {
      sizeTons, monthly: r.monthly, annual, upfront: { installedUsd, rebatesUsd, netUsd }, paybackYears: save > 0 ? netUsd / save : null,
      lifetime: { costUsd: netUsd + life * annual.heatPump.costUsd, co2Kg: life * annual.heatPump.co2Kg, todayCostUsd: life * annual.today.costUsd, todayCo2Kg: life * annual.today.co2Kg },
      designLoadKw: r.maxNeedKw
    };
  }

  function run(inp) {
    const all = SIZES.map(s => summarize(inp, s));
    const cs = all.map(r => r.lifetime.costUsd), es = all.map(r => r.lifetime.co2Kg);
    const norm = (v, a) => { const lo = Math.min(...a), hi = Math.max(...a); return hi > lo ? (v - lo) / (hi - lo) : 0; };
    const w = inp.priority; let best = all[0], bs = Infinity;
    for (const r of all) { const s = (1 - w) * norm(r.lifetime.costUsd, cs) + w * norm(r.lifetime.co2Kg, es); if (s < bs) { bs = s; best = r; } }
    const chosen = inp.sizeTons ? (all.find(r => r.sizeTons === inp.sizeTons) || summarize(inp, inp.sizeTons)) : best;
    return {
      schemaVersion: 1, isPlaceholder: false, modelVersion: "patrick-rc-hourly-0 (model.ipynb)",
      recommendedSizeTons: best.sizeTons, sizeTons: chosen.sizeTons, capacityKwAt5F: chosen.sizeTons * 12000 * 0.65 / BTU_PER_KWH,
      designLoadKw: chosen.designLoadKw, lifetimeYears: inp.costs.lifetimeYears,
      annual: chosen.annual, monthly: chosen.monthly, upfront: chosen.upfront, paybackYears: chosen.paybackYears, lifetime: chosen.lifetime,
      sizes: all.map(r => ({ sizeTons: r.sizeTons, lifetimeCostUsd: r.lifetime.costUsd, lifetimeCo2Kg: r.lifetime.co2Kg, heatPumpShare: r.annual.heatPump.heatPumpShare, paybackYears: r.paybackYears })),
      notes: [
        "Hourly model from the team: a simple one-zone house, heat pump first, your current system covers what it can't.",
        "Hourly outdoor temperatures are built from monthly averages, not a real weather file.",
        "Heat pump efficiency and cold-weather capacity follow a generic cold-climate curve."
      ]
    };
  }

  window.HeatPumpModel = { run, isPlaceholder: false, sizes: SIZES };
})();
