// PLACEHOLDER MODEL. Stands in for the Model workstream until a real model exists.
// The page only talks to window.HeatPumpModel through one function:
//   HeatPumpModel.run(inputs) -> outputs (or a Promise of outputs)
// The input/output shape is documented in docs/INTERFACES.md ("UI/Model handoff").
// To plug in the real model: load a script after this one that replaces window.HeatPumpModel
// (or individual functions) with the same shape, and set isPlaceholder to false.
(function () {
  const DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const TON_KW = 3.517;
  const SIZES = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
  const CUTOFF_F = -22; // cold-climate unit stops below this (Carrier 37MUHAQ listing, data.zip)

  // Inverse normal CDF (Acklam) for synthesizing hourly temperatures from monthly mean and spread.
  function ninv(p){const a=[-39.6968302866538,220.946098424521,-275.928510446969,138.357751867269,-30.6647980661472,2.50662827745924],b=[-54.4760987982241,161.585836858041,-155.698979859887,66.8013118877197,-13.2806815528857],c=[-0.00778489400243029,-0.322396458041136,-2.40075827716184,-2.54973253934373,4.37466414146497,2.93816398269878],d=[0.00778469570904146,0.32246712907004,2.445134137143,3.75440866190742],pl=0.02425;let q,r;if(p<pl){q=Math.sqrt(-2*Math.log(p));return(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)}if(p>1-pl){q=Math.sqrt(-2*Math.log(1-p));return-(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)}q=p-.5;r=q*q;return(((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q/(((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1)}

  const hourCache = {};
  function hourlyTemps(region) {
    if (hourCache[region.id]) return hourCache[region.id];
    const months = region.monthlyMeanF.map((m, i) => {
      const n = DAYS[i] * 24, t = new Float32Array(n);
      for (let h = 0; h < n; h++) t[h] = m + region.monthlySdF[i] * ninv((h + 0.5) / n);
      return t;
    });
    return (hourCache[region.id] = months);
  }

  // Capacity fraction of rated (5 °F) capacity, and COP, vs outdoor temp. Rough cold-climate curve.
  const capFrac = T => T < CUTOFF_F ? 0 : T >= 47 ? 1.1 : T >= 5 ? 0.85 + 0.25 * (T - 5) / 42 : Math.max(0.55, 0.85 - 0.30 * (5 - T) / 20);
  const cop = T => { const p = [[-15, 1.4], [5, 1.9], [17, 2.5], [47, 4.0], [65, 4.6]];
    if (T <= p[0][0]) return p[0][1];
    for (let i = 1; i < p.length; i++) if (T <= p[i][0]) { const [x0, y0] = p[i - 1], [x1, y1] = p[i]; return y0 + (y1 - y0) * (T - x0) / (x1 - x0); }
    return 4.6; };

  function simulate(inp, sizeTons) {
    const months = hourlyTemps(inp.region);
    const ua = inp.home.heatLossWPerF / 1000;                 // kW per °F
    const balance = inp.home.thermostatF - 8;                 // internal gains cover the last ~8 °F
    const capKw = sizeTons * TON_KW;
    const hpPrice = inp.prices.electricityUsdPerKWh * (inp.prices.timeOfUse ? 0.9 : 1);
    const heatPrice = inp.prices.fuelUsdPerKWhHeat;           // $ per kWh of delivered heat, current system
    const heatCo2 = inp.emissions.fuelKgCo2PerKWhHeat;        // kg per kWh of delivered heat, current system
    const grid = inp.emissions.gridKgCo2PerKWh;
    let load = 0, hpHeat = 0, elec = 0;
    const monthly = months.map(temps => {
      const m = { today: { costUsd: 0, co2Kg: 0 }, heatPump: { costUsd: 0, co2Kg: 0 } };
      for (const T of temps) {
        const L = Math.max(0, ua * (balance - T)); if (!L) continue;
        const hp = Math.min(L, capKw * capFrac(T)), bk = L - hp, e = hp ? hp / cop(T) : 0;
        load += L; hpHeat += hp; elec += e;
        m.today.costUsd += L * heatPrice; m.today.co2Kg += L * heatCo2;
        m.heatPump.costUsd += e * hpPrice + bk * heatPrice; m.heatPump.co2Kg += e * grid + bk * heatCo2;
      }
      return m;
    });
    const sum = (k, f) => monthly.reduce((a, m) => a + m[k][f], 0);
    const annual = {
      today: { costUsd: sum("today", "costUsd"), co2Kg: sum("today", "co2Kg"), heatKWh: load },
      heatPump: { costUsd: sum("heatPump", "costUsd"), co2Kg: sum("heatPump", "co2Kg"), electricityKWh: elec,
                  heatPumpShare: load ? hpHeat / load : 0 }
    };
    const installedUsd = sizeTons * inp.costs.installedUsdPerTon;
    const rebatesUsd = Math.min(inp.costs.rebatesUsd, installedUsd);
    const netUsd = installedUsd - rebatesUsd;
    const save = annual.today.costUsd - annual.heatPump.costUsd;
    const life = inp.costs.lifetimeYears;
    return {
      sizeTons, monthly, annual,
      upfront: { installedUsd, rebatesUsd, netUsd },
      paybackYears: save > 0 ? netUsd / save : null,
      lifetime: { costUsd: netUsd + life * annual.heatPump.costUsd, co2Kg: life * annual.heatPump.co2Kg,
                  todayCostUsd: life * annual.today.costUsd, todayCo2Kg: life * annual.today.co2Kg },
      designLoadKw: ua * Math.max(0, balance - inp.region.designTempF)
    };
  }

  function run(inp) {
    const all = SIZES.map(s => simulate(inp, s));
    const cs = all.map(r => r.lifetime.costUsd), es = all.map(r => r.lifetime.co2Kg);
    const norm = (v, a) => { const lo = Math.min(...a), hi = Math.max(...a); return hi > lo ? (v - lo) / (hi - lo) : 0; };
    const w = inp.priority;
    let best = all[0], bs = Infinity;
    for (const r of all) { const s = (1 - w) * norm(r.lifetime.costUsd, cs) + w * norm(r.lifetime.co2Kg, es); if (s < bs) { bs = s; best = r; } }
    const chosen = inp.sizeTons ? (all.find(r => r.sizeTons === inp.sizeTons) || simulate(inp, inp.sizeTons)) : best;
    return {
      schemaVersion: 1,
      isPlaceholder: true,
      modelVersion: "ui-stub-0",
      recommendedSizeTons: best.sizeTons,
      sizeTons: chosen.sizeTons,
      capacityKwAt5F: chosen.sizeTons * TON_KW,
      designLoadKw: chosen.designLoadKw,
      lifetimeYears: inp.costs.lifetimeYears,
      annual: chosen.annual,
      monthly: chosen.monthly,
      upfront: chosen.upfront,
      paybackYears: chosen.paybackYears,
      lifetime: chosen.lifetime,
      sizes: all.map(r => ({ sizeTons: r.sizeTons, lifetimeCostUsd: r.lifetime.costUsd, lifetimeCo2Kg: r.lifetime.co2Kg,
                             heatPumpShare: r.annual.heatPump.heatPumpShare, paybackYears: r.paybackYears })),
      notes: [
        "Hourly temperatures are synthesized from monthly averages, not real weather files.",
        "Heat loss is a rule of thumb from floor area and draftiness.",
        "Heat pump capacity and efficiency follow a generic cold-climate curve; it stops below −22 °F and the current system covers the rest."
      ]
    };
  }

  window.HeatPumpModel = { run, isPlaceholder: true, sizes: SIZES };
})();
