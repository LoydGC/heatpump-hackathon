// Wizard: Location -> Climate -> Home -> Results.
// Steps are gated: you can go back to any step you've reached, never forward past it.
(function () {
  const { FUELS, ENVELOPES, REGIONS, matchPlace } = window.HP_DATA;
  const Model = () => window.HeatPumpModel;
  const $ = id => document.getElementById(id);
  const ROUTES = ["where", "climate", "home", "results", "rebates"]; // "rebates" is a sub-page of results, reached from it
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const INSTALLED_USD_PER_TON = 5500;   // placeholder
  const LIFETIME_YEARS = 15;            // data.zip analysis_years
  // Insulation slider: levels sit on the notebook's unified-R scale (model.ipynb calculate_unified_r); spoken equivalents below.
  const INS_LEVELS = [2.5, 3.5, 4.5, 5], INS_LABELS = ["Not well", "Fair", "Decent", "Good"];
  const ENV_R = { drafty: 2.5, average: 3.5, tight: 5 }, INS_W = { 2.5: 0.12, 3.5: 0.095, 4.5: 0.075, 5: 0.055 };   // stand-in heat loss, W per F per sq ft
  const PRICE_KEYS = ["electricityUsdPerKWh", "fuelUsdPerUnit", "rebatesUsd"];

  // ---------- State ----------
  // Income-based rebate tiers (HEAR as in apply_rebate.py): share of area median income -> rebate cap in dollars.
  const INCOME_USD = { none: 0, partial: 4000, full: 8000 };
  const incomeUsd = () => INCOME_USD[state.income];   // used by model v1 only; other models compute the rebate from the notebook rule (rebateType)
  const blank = () => ({ regionId: null, maxStep: 0, overrides: {}, priority: 0.5, prioSet: false, sizeTons: null, usedTypical: true, rebatesOn: true, income: "none", cold: false, acCredit: false });
  let state = blank();
  try { const s = JSON.parse(sessionStorage.getItem("hp-wizard")); if (s && (s.regionId === null || REGIONS[s.regionId])) state = Object.assign(blank(), s); } catch (e) {}
  // A saved or tampered state can't unlock pages: no region means step 1 only; never past the last page.
  state.maxStep = Math.max(0, Math.min(+state.maxStep || 0, 4));
  if (!state.regionId) state.maxStep = 0;
  delete state.overrides.homeType; delete state.overrides.envelope; delete state.overrides.timeOfUse;  // home type and heat-holding inputs were removed from the page
  if (!INCOME_USD.hasOwnProperty(state.income)) state.income = "none";
  state.cold = false; state.acCredit = false;   // the model scenarios (cold winter, AC credit) were removed
  state.rebatesOn = true;               // standard utility rebates are always counted; only the income-based one is a control
  state.sizeTons = null;                // no size picker any more; the suggestion follows the dial
  const save = () => { try { sessionStorage.setItem("hp-wizard", JSON.stringify(state)); } catch (e) {} };
  let current = 0;

  const region = () => REGIONS[state.regionId];

  // ---------- Model v1 (Minneapolis) ----------
  const V1 = window.HeatPumpModelV1;
  const DEFAULT_LAM_IDX = 8;                        // $300/t: the notebook's default carbon price (dollars_per_ton_co2)
  const DIAL_STEPS = 12;                            // 13 slider positions = the model's lambda grid
  const carbonUsd = () => Number.isFinite(state.carbonUsd) ? Math.min(300, Math.max(0, state.carbonUsd)) : 300;   // $ per tonne CO2, Patrick's notebook default 300
  const dialIdx = () => state.prioSet ? Math.round(state.priority * DIAL_STEPS) : (isV1(region()) ? DEFAULT_LAM_IDX : DIAL_STEPS / 2);  // stand-in default = balanced
  const USE_V1 = false;   // Gavin 2026-11-08: Sharvi's v1 is early-stage and non-authoritative; where models conflict, Patrick's notebook model wins
  const NB = window.HeatPumpModelNB;   // Patrick's notebook model, used for Minneapolis
  const isV1 = r => !!r && !!NB && r.id === NB.regionId;   // name kept: 'the city has a carbon-dollar dial and a keep-furnace answer'
  async function runModel(inp) {
    if (USE_V1 && inp.region.id === V1.regionId && V1.loaded()) {
      const sc = inp.scenario;
      return V1.run(inp, { tariff: inp.prices.timeOfUse ? "tou" : "flat", weather: sc.coldWinter ? "tmy3_cold" : "tmyx_main",
                           credit: sc.acCredit ? 4000 : 0, controller: "smart", lamIdx: sc.lamIdx, rebatesOn: sc.rebatesOn, incomeUsd: sc.incomeUsd });
    }
    return Model().run(inp);
  }

  // ---------- ResStock home type x size selection ----------
  // Dropdown options come from ResStock (ui/resstock.js, built from datasets/resstock). A (city, type, bin) cell can be
  // thin (<5 models) or empty; an empty choice falls back to the nearest non-empty bin and says so.
  const RS = window.RESSTOCK || { fine: [], coarse: [], cells: {} };
  // Boston's typical home is built from the Boston ResStock extract (single-family detached, weighted medians/modes).
  // That extract is the definitive reference for the Boston typical home (Gavin, 2026-11-08); see docs/DECISIONS.md D-025.
  const TB = RS.typical && RS.typical.boston;
  if (TB) Object.assign(REGIONS.boston.typicalHome, {
    floorAreaSqft: TB.sqft, currentHeat: TB.fuel, envelope: TB.envelope,
    why: `a typical Boston single-family home from ResStock: about ${(Math.round(TB.sqft / 50) * 50).toLocaleString()} sq ft, drafty, heated by ${FUELS[TB.fuel].short}`
  });
  const HOME_TYPES = [
    { id: "sfd", label: "Single-family detached", rs: "Single-Family Detached", on: true },
    { id: "sfa", label: "Single-family attached (townhouse, rowhouse)", rs: "Single-Family Attached", on: true }
  ];
  const BIN_MID = { fine: [625, 875, 1250, 1750, 2250, 2750, 3500], coarse: [1000, 2000, 3000] };
  const BIN_EDGES = { fine: [750, 1000, 1500, 2000, 2500, 3000], coarse: [1500, 2500] };
  const binList = lvl => RS[lvl];
  const binFor = (lvl, sqft) => binList(lvl)[BIN_EDGES[lvl].filter(e => sqft >= e).length];
  // Display only: the top bin (3000-3999 in the data) is shown as "3000+" (Gavin 2026-11-08); the data is still capped at 3999.
  const binLabel = b => b === "3000-3999" ? "3000+" : b.endsWith("+") ? b.slice(0, -1) + "+" : b.replace("-", "–");
  const cellOf = (r, type, lvl, bin) => (RS.cells[r.id] || {})[`${type}|${lvl}|${bin}`] || null;
  const hasRS = r => !!RS.cells[r.id];
  function selection(r, ov) {
    const type = ov.homeType || "sfd", lvl = "fine", own = ov.floorAreaSqft > 0 ? ov.floorAreaSqft : null;  // 7 ResStock size bins only (the 4-group toggle was removed)
    const list = binList(lvl), dflt = binFor(lvl, r.typicalHome.floorAreaSqft);
    const want = own ? binFor(lvl, own) : list.includes(ov.sizeBin) ? ov.sizeBin : dflt;
    let bin = want;
    if (hasRS(r) && !(cellOf(r, type, lvl, want) || {}).n) {
      const wi = list.indexOf(want);
      const ok = list.map((b, i) => [b, i]).filter(([b]) => (cellOf(r, type, lvl, b) || {}).n).sort((a, b) => Math.abs(a[1] - wi) - Math.abs(b[1] - wi));
      if (ok.length) bin = ok[0][0];
    }
    const cell = cellOf(r, type, lvl, bin), i = list.indexOf(bin);
    return { type, lvl, want, bin, fellBack: bin !== want, cell, sqft: own || (cell && cell.sqft ? cell.sqft : BIN_MID[lvl][i]) };
  }
  const typeLabel = id => (HOME_TYPES.find(t => t.id === id) || HOME_TYPES[0]).label;
  const selText = sel => `${typeLabel(sel.type).split(" (")[0].toLowerCase()}, ${binLabel(sel.bin)} sq ft`;
  // ResStock reference figures for the chosen cell (population medians, not model output).
  function refHtml(r, sel) {
    if (!hasRS(r)) return `<b>No ResStock reference for ${r.name}.</b> ResStock covers US homes only; ${r.name} uses placeholder values.`;
    const c = sel.cell, label = `${typeLabel(sel.type).split(" (")[0].toLowerCase()}, ${binLabel(sel.bin)} sq ft`;
    if (!c || !c.n) return `<b>No ResStock reference</b> for that choice in ${r.name}.`;
    const fuel = [`${c.kwh.toLocaleString()} kWh electricity`];
    if (c.therms) fuel.push(`${c.therms.toLocaleString()} therms gas`);
    if (c.otherKwh) fuel.push(`${c.otherKwh.toLocaleString()} kWh of propane or fuel oil`);
    return `<b>ResStock reference, not our model:</b> the median ${label} home in ${r.name} uses about ${fuel.join(", ")} a year, all uses included.` +
      "";
  }

  // Typical (synthetic) home + regional prices, then the user's overrides on top.
  function typical(r, ov) {
    const heat = ov.currentHeat || r.typicalHome.currentHeat;
    const sel = selection(r, ov), dsel = selection(r, {});
    const sqft = sel.sqft;
    const env = ov.envelope || r.typicalHome.envelope;
    return {
      floorAreaSqft: sqft,
      homeType: dsel.type, binLevel: dsel.lvl, sizeBin: dsel.bin,
      envelope: r.typicalHome.envelope,
      currentHeat: r.typicalHome.currentHeat,
      thermostatF: r.typicalHome.thermostatF,
      insulationR: ENV_R[r.typicalHome.envelope],
      heatLossWPerF: Math.round(sqft * INS_W[ov.insulationR ?? ENV_R[env]] / 5) * 5,
      electricityUsdPerKWh: r.electricityUsdPerKWh,
      fuelUsdPerUnit: heat === "electric" ? (ov.electricityUsdPerKWh ?? r.electricityUsdPerKWh) : r.fuelPrices[heat],
      rebatesUsd: 0,   // rebates follow the notebook rule: none / partial / full (see rebateType)
      installedUsdPerTon: INSTALLED_USD_PER_TON,
      timeOfUse: false
    };
  }
  function effective() {
    const r = region(), d = typical(r, state.overrides);
    const h = Object.assign({}, d, state.overrides);
    const sel = selection(r, state.overrides);   // home type and size come from the dropdowns; sq ft is derived
    h.floorAreaSqft = d.floorAreaSqft; h.homeType = sel.type; h.binLevel = sel.lvl; h.sizeBin = sel.bin;
    return h;
  }
  function modelInputs(sizeTons, rebatesOn = state.rebatesOn, tou = null, lamIdx = null) {
    const r = region(), h = effective(), f = FUELS[h.currentHeat];
    const fuelPrice = h.currentHeat === "electric" ? h.electricityUsdPerKWh : h.fuelUsdPerUnit;
    const fuelCo2 = h.currentHeat === "electric" ? r.gridKgCo2PerKWh : f.co2;
    return {
      schemaVersion: 1,
      region: { id: r.id, name: r.full, designTempF: r.designTempF, monthlyMeanF: r.monthlyMeanF, monthlySdF: r.monthlySdF, dataStatus: r.dataStatus },
      home: { source: Object.keys(state.overrides).length ? "custom" : "typical", floorAreaSqft: h.floorAreaSqft, envelope: h.envelope, insulationR: h.insulationR,
              homeType: h.homeType, sizeBin: h.sizeBin, binLevel: h.binLevel,
              resstockRef: (c => c && c.n ? { n: c.n, medianKWh: c.kwh, medianTherms: c.therms, medianOtherFuelKWh: c.otherKwh } : null)(selection(r, state.overrides).cell),
              heatLossWPerF: h.heatLossWPerF, thermostatF: h.thermostatF, currentHeat: h.currentHeat },
      prices: { electricityUsdPerKWh: h.electricityUsdPerKWh, fuelUsdPerUnit: fuelPrice, fuelUnit: f.unit, timeOfUse: tou == null ? !!h.timeOfUse : tou,
                fuelUsdPerKWhHeat: fuelPrice / (f.kwh * f.eff) },
      emissions: { gridKgCo2PerKWh: r.gridKgCo2PerKWh, fuelKgCo2PerUnit: fuelCo2, fuelKgCo2PerKWhHeat: fuelCo2 / (f.kwh * f.eff) },
      costs: { installedUsdPerTon: h.installedUsdPerTon, rebatesUsd: 0, rebateType: rebatesOn ? state.income : "none", lifetimeYears: LIFETIME_YEARS },
      priority: state.prioSet ? state.priority : (isV1(r) ? DEFAULT_LAM_IDX / DIAL_STEPS : state.priority),
      sizeTons: sizeTons ?? null,
      scenario: { coldWinter: state.cold, acCredit: state.acCredit, rebatesOn, incomeUsd: incomeUsd(), lamIdx: lamIdx ?? dialIdx(), carbonUsd: carbonUsd() }  // used by model v1
    };
  }

  // ---------- Navigation ----------
  function go(i, push = true) {
    i = Math.max(0, Math.min(Number.isInteger(i) ? i : 0, state.regionId ? state.maxStep : 0));
    current = i;
    document.querySelectorAll(".step").forEach((s, k) => s.classList.toggle("active", k === i));
    const navI = Math.min(i, 3); // the rebates page lives under step 4
    document.querySelectorAll("#steps button").forEach((b, k) => {
      b.disabled = k > state.maxStep;
      b.classList.toggle("done", k < Math.min(state.maxStep, 3) && k !== navI);
      if (k === navI) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current");
      b.title = k > state.maxStep ? "Finish the earlier steps first" : "";
    });
    if (i === 1) renderClimate();
    if (i === 2) renderHome();
    if (i === 3 || i === 4) renderResults();
    const hash = "#" + ROUTES[i];
    if (location.hash !== hash) { if (push) history.pushState(null, "", hash); else history.replaceState(null, "", hash); }
    const h = $("h" + i); if (h && push) { window.scrollTo({ top: 0 }); h.focus({ preventScroll: true }); }
    save();
  }
  function unlock(i) { state.maxStep = Math.max(state.maxStep, i); }
  const routeIndex = () => Math.max(0, ROUTES.indexOf(location.hash.slice(1)));
  window.addEventListener("popstate", () => go(routeIndex(), false));
  document.querySelectorAll("#steps button").forEach(b => b.addEventListener("click", () => go(+b.dataset.go)));
  document.querySelectorAll("[data-to-results]").forEach(b => b.addEventListener("click", () => go(3)));
  document.querySelectorAll("[data-back]").forEach(b => b.addEventListener("click", () => go(current - 1)));

  // ---------- Step 1: location ----------
  const quick = $("quick");
  Object.values(REGIONS).forEach(r => {
    const b = document.createElement("button"); b.type = "button"; b.textContent = r.short; b.dataset.region = r.id;
    b.addEventListener("click", () => chooseRegion(r.id)); quick.appendChild(b);
  });
  function chooseRegion(id) {
    if (state.regionId && state.regionId !== id) {
      // New region: drop price overrides (they were for the old region) and the size pick; keep home details.
      PRICE_KEYS.forEach(k => delete state.overrides[k]);
      state.sizeTons = null;
    }
    state.regionId = id;
    $("place").value = REGIONS[id].short;
    $("locMsg").className = "loc-msg"; $("locMsg").textContent = "";
    markQuick();
    unlock(1); go(1);
  }
  function markQuick() { quick.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", b.dataset.region === state.regionId)); }
  $("whereForm").addEventListener("submit", e => {
    e.preventDefault();
    const raw = $("place").value, id = matchPlace(raw);
    if (id) return chooseRegion(id);
    const msg = $("locMsg"); msg.className = "loc-msg warn";
    msg.textContent = raw.trim() ? `We don't have data for "${raw.trim()}" yet. Pick the closest of the three regions above.` : "Type a city or ZIP code, or pick a region.";
  });

  // ---------- Step 2: climate ----------
  // Content lives in ui/regions.js (CLIMATE, CLIMATE_TYPES, SOURCES); each claim is tagged; source numbers stay in the data and in docs/REFERENCES.md, not on the page.
  const { SOURCES, CLIMATE_TYPES } = window.HP_DATA;
  const ico = {
    sun: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    leaf: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15"/><path d="M5 19l7-7"/></svg>',
    snow: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linecap="round"><path d="M12 2v20M4 7l16 10M20 7 4 17"/></svg>'
  };
  const pct = v => Math.round(v * 100) + "%";
  const TAGS = { research: "Research", data: "Team data", reasoning: "Our reasoning", gap: "Not researched" };
  const tagHtml = t => `<span class="tag tag-${t}">${TAGS[t]}</span>`;
  function renderClimate() {
    const r = region(); if (!r) return;
    const c = r.climate;
    $("cKicker").textContent = "Your climate · " + r.full;
    $("h1").textContent = c.headline;
    $("cIntro").textContent = c.status === "researched" ? "Here is what the research and the team's data say about heat pumps where you live." : c.status === "limited" ? "We have less research for this region, so some of this page is our own reasoning, marked as such." : "This is a hard case for heat pumps, and we say so plainly below.";
    $("cSpecialist").hidden = !c.specialist; $("cSpecialist").innerHTML = c.specialist ? `<b>Needs a specialist.</b> ${c.specialist}` : "";
    const icons = ["sun", "leaf", "snow"];
    $("cFacts").innerHTML = c.cards.map((f, i) => `<div class="fact ${f.less ? "less" : ""}"><div class="ico">${ico[f.ico || icons[i]]}</div><p class="muted" style="font-size:13px;font-weight:600">${f.k}</p><h3>${f.h}</h3><p style="margin-top:6px">${f.p}</p><p style="margin-top:8px">${tagHtml(f.tag)}</p></div>`).join("");
    $("cTypes").innerHTML = CLIMATE_TYPES.map(t => `<div class="ctype ${t.id === c.type ? "here" : ""}"><h3>${t.name}${t.id === c.type ? ' <span class="tag yours">Like yours</span>' : ""}</h3><p style="margin-top:6px;font-size:14px">${t.text}</p></div>`).join("");
  }
  $("toHome").addEventListener("click", () => { unlock(2); go(2); });

  // ---------- Step 3: home ----------
  const heatSel = $("heat");
  Object.entries(FUELS).forEach(([k, f]) => { const o = document.createElement("option"); o.value = k; o.textContent = f.label; heatSel.appendChild(o); });
  const FIELDS = [ // [inputId, key, parse]
    ["heat", "currentHeat", String], ["sqft", "floorAreaSqft", Number], ["tstat", "thermostatF", Number],
    ["elec", "electricityUsdPerKWh", Number], ["fuelPrice", "fuelUsdPerUnit", Number],
    ["ua", "heatLossWPerF", Number]
  ];
  function setOverride(key, val) {
    const r = region(), d = typical(r, state.overrides);
    if (key === "currentHeat") { delete state.overrides.fuelUsdPerUnit; delete state.overrides.rebatesUsd; }
    if (key === "floorAreaSqft" || key === "envelope" || key === "insulationR" || key === "homeType" || key === "sizeBin" || key === "binLevel") delete state.overrides.heatLossWPerF;
    if (val === "" || val == null || (typeof val === "number" && !isFinite(val)) || val === d[key]) delete state.overrides[key];
    else state.overrides[key] = val;
    state.sizeTons = null;
    renderHome(key); save();
  }
  $("ins").addEventListener("input", e => setOverride("insulationR", INS_LEVELS[+e.target.value]));
  FIELDS.forEach(([id, key, parse]) => {
    $(id).addEventListener("change", e => setOverride(key, e.target.value === "" ? "" : parse(e.target.value)));
  });
  // Home type + size dropdowns (ResStock options)

  function renderHome(skipKey) {
    const r = region(); if (!r) return;
    const d = typical(r, state.overrides), h = effective(), f = FUELS[h.currentHeat];
    $("qpRegion").textContent = r.name;
    $("qpWhy").textContent = `We'll model ${r.typicalHome.why}.`;
    const td = typical(r, {});


    { const k = Math.max(0, INS_LEVELS.indexOf(h.insulationR)); $("ins").value = k; $("insVal").textContent = INS_LABELS[k]; }
    FIELDS.forEach(([id, key]) => { if (key !== skipKey || id === "heat") $(id).value = h[key]; });
    $("fuelPriceL").textContent = h.currentHeat === "electric" ? "Fuel price (same as electricity)" : `${f.short[0].toUpperCase() + f.short.slice(1)} ($ per ${f.unit})`;
    $("fuelPrice").disabled = h.currentHeat === "electric";
    document.querySelectorAll("[data-src]").forEach(s => {
      const yours = s.dataset.src in state.overrides; s.textContent = yours ? "yours" : "typical"; s.classList.toggle("yours", yours);
    });
    renderDial();
    const n = Object.keys(state.overrides).length;
    $("homeStatus").textContent = n ? `You've changed ${n} detail${n > 1 ? "s" : ""}. Everything else uses typical values for ${r.name}.` : `Nothing changed yet: this is the typical ${r.name} home.`;
    $("useCustom").textContent = n ? "See my report →" : "See the report →";
  }
  $("useTypical").addEventListener("click", () => { state.overrides = {}; state.sizeTons = null; unlock(3); go(3); });
  $("useCustom").addEventListener("click", () => { unlock(3); go(3); });

  // ---------- Step 4: results ----------
  const money = v => (v < 0 ? "−" : "") + "$" + Math.abs(Math.round(v)).toLocaleString();
  const tonnes = kg => (Math.abs(kg) / 1000).toFixed(1) + " t";
  const kFmt = v => Math.abs(v) >= 1000 ? (v / 1000).toFixed(Math.abs(v) >= 10000 ? 0 : 1) + "k" : Math.round(v).toString();
  const css = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  let lastOut = null;
  async function renderResults() {
    const r = region(); if (!r) return;
    const h = effective(), f = FUELS[h.currentHeat];
    const out = await runModel(modelInputs(state.sizeTons));
    lastOut = out;
    const custom = Object.keys(state.overrides).length;
    const backup = h.currentHeat === "electric" ? "electric baseboards" : FUELS[h.currentHeat].short + " system";
    const nowName = "Today (" + f.short + ")";

    $("h3").textContent = custom ? `Your heat pump report for your ${r.name} home` : `Heat pump report for a typical ${r.name} home`;
    const rsel = selection(r, state.overrides);
    const v1 = out.v1, v1Failed = USE_V1 && r.id === V1.regionId && !v1;


    const a = out.annual, cut = a.today.co2Kg - a.heatPump.co2Kg, saveYr = a.today.costUsd - a.heatPump.costUsd;
    // One explicit suggestion for every city (no size picker); the dial on page 3 is the control.
    $("rSizeBox").hidden = true; document.querySelector(".reco").classList.add("single");
    if (isV1(r) && !out.sizeTons) {
      $("rReco").textContent = "Keep your gas furnace for now";
    } else if (out.nb && out.nb.winnerJson && out.nb.isWinner) {   // the notebook's winner.json row is the suggestion
      const W = out.nb.winnerJson;
      $("rReco").textContent = `${out.nb.brand.replace(/_/g, " ").toLowerCase().replace(/^./, c => c.toUpperCase())} ${W.machine_profile}: a ${W.nominal_tons.toFixed(2)}-ton (${Math.round(W.nominal_tons * 12)},000 BTU/h) cold-climate heat pump`;
    } else {
      $("rReco").textContent = `A ${out.sizeTons}-ton (${Math.round(out.sizeTons * 12)},000 BTU/h) cold-climate heat pump`;
    }
    renderDial(); renderTradeoff(out);

    // CO2
    const cars = Math.abs(cut) / 4600;
    $("co2Tiles").innerHTML = [
      ["hero-t", cut >= 0 ? "CO₂ cut per year" : "CO₂ added per year", tonnes(cut), a.today.co2Kg ? `${pct(Math.abs(cut) / a.today.co2Kg)} ${cut >= 0 ? "less" : "more"} than today · about ${cars.toFixed(1)} car${cars >= 1.05 ? "s" : ""} off the road` : ""],
      ["", "Heating CO₂ today", tonnes(a.today.co2Kg) + " / yr", `from ${f.short}`],
      ["", "With a heat pump", tonnes(a.heatPump.co2Kg) + " / yr", `electricity from ${r.gridNote}`],
      ["", `Over ${out.lifetimeYears} years`, tonnes(cut * out.lifetimeYears), cut >= 0 ? "less CO₂ in total" : "more CO₂ in total"]
    ].map(([c, k, v, s]) => `<div class="tile ${c}"><div class="k">${k}</div><div class="v">${v}</div><div class="s">${s}</div></div>`).join("");

    const cNow = css("--c-now"), cHp = css("--c-hp");
    ["lgNow1", "lgNow3"].forEach(id => $(id).textContent = nowName);
    HPCharts.lineChart($("chCo2"), {
      labels: MON, ariaLabel: "Monthly heating CO2, today versus with a heat pump",
      series: [{ name: "Today", color: cNow, values: out.monthly.map(m => m.today.co2Kg) }, { name: "Heat pump", color: cHp, values: out.monthly.map(m => m.heatPump.co2Kg) }],
      fmt: (v, tip) => tip ? Math.round(v).toLocaleString() + " kg" : kFmt(v) + " kg"
    });

    // Money
    const up = out.upfront, life = out.lifetimeYears;
    const lifeSave = life * saveYr - up.netUsd;
    $("moneyTiles").innerHTML = [
      ["hero-t", "Yearly heating bill", `${money(a.heatPump.costUsd)}`, `vs ${money(a.today.costUsd)} today · ${saveYr >= 0 ? money(saveYr) + " saved" : money(-saveYr) + " more"} per year`],
      ["", "Upfront costs, after rebates", money(up.netUsd), `${money(up.installedUsd)} installed − ${money(up.rebatesUsd)} rebates`],
      ["", "Pays for itself in", paybackLabel(out), out.paybackYears != null ? `heat pumps last about ${life} years` : "bills don't drop enough to repay the upfront cost"],
      ["", `Over ${life} years`, (lifeSave >= 0 ? "" : "") + money(Math.abs(lifeSave)), lifeSave >= 0 ? "saved overall, after upfront cost" : "more overall, after upfront cost"]
    ].map(([c, k, v, s]) => `<div class="tile ${c}"><div class="k">${k}</div><div class="v">${v}</div><div class="s">${s}</div></div>`).join("");

    $("sumTiles").innerHTML = [
      ["hero-t", "Yearly heating bill", money(a.heatPump.costUsd), `vs ${money(a.today.costUsd)} today · ${saveYr >= 0 ? money(saveYr) + " saved" : money(-saveYr) + " more"} per year`],
      ["", "Upfront costs, after rebates", money(up.netUsd), `${money(up.installedUsd)} installed − ${money(up.rebatesUsd)} rebates`],
      ["", "Pays for itself in", paybackLabel(out), !out.sizeTons ? "no heat pump at this setting" : out.paybackYears != null ? `heat pumps last about ${life} years` : "bills don't drop enough to repay the cost"],
      ["", !out.sizeTons ? "CO₂ change per year" : cut >= 0 ? "CO₂ cut per year" : "CO₂ added per year", tonnes(cut), !out.sizeTons ? "no heat pump at this setting" : a.today.co2Kg ? `${pct(Math.abs(cut) / a.today.co2Kg)} ${cut >= 0 ? "less" : "more"} than today` : ""]
    ].map(([c, k, v, s]) => `<div class="tile ${c}"><div class="k">${k}</div><div class="v">${v}</div><div class="s">${s}</div></div>`).join("");

    const nbw = out.nb && out.nb.winnerJson;
    if (nbw) {   // Patrick's notebook: lead with grand_operating_savings (bills + carbon at the dial's price) and show the winner.json row
      $("winnerFold").hidden = false;
      const fx = (v, d = 0) => v == null ? "none" : Number(v).toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: d });
      $("winnerNote").textContent = out.nb.isWinner ? `Winner at $${out.nb.carbonUsdPerTonne} per tonne of CO₂: the heat pump with the lowest grand operating cost among those that save money.`
        : `No heat pump has positive grand operating savings at $${out.nb.carbonUsdPerTonne} per tonne, so there is no winner. This is the lowest-cost heat pump, shown for comparison.`;
      $("winnerTbl").innerHTML = [["machine_profile", nbw.machine_profile], ["nominal_tons", fx(nbw.nominal_tons, 2)], ["hp_coverage_pct", fx(nbw.hp_coverage_pct, 1)],
        ["total_elec_kwh", fx(nbw.total_elec_kwh)], ["total_gas_therms", fx(nbw.total_gas_therms)], ["total_operating_cost", "$" + fx(nbw.total_operating_cost, 2)],
        ["total_co2_kg", fx(nbw.total_co2_kg)], ["capital_cost_usd", "$" + fx(nbw.capital_cost_usd, 2)], ["rebate_usd", "$" + fx(nbw.rebate_usd, 2)],
        ["grand_operating_cost", "$" + fx(nbw.grand_operating_cost, 2)], ["ng_baseline_grand_cost", "$" + fx(nbw.ng_baseline_grand_cost, 2)],
        ["grand_operating_savings", "$" + fx(nbw.grand_operating_savings, 2)], ["net_capital_cost_usd", "$" + fx(nbw.net_capital_cost_usd, 2)],
        ["grand_payback", nbw.grand_payback == null ? "none" : fx(nbw.grand_payback, 1) + " years"]].map(([k, v]) => `<tr><td><code>${k}</code></td><td>${v}</td></tr>`).join("");
      $("sumTiles").insertAdjacentHTML("afterbegin", `<div class="tile hero-t"><div class="k">Grand operating savings</div><div class="v">${money(nbw.grand_operating_savings)} / yr</div><div class="s">bills plus CO₂ at $${out.nb.carbonUsdPerTonne}/t, vs ${f.short}${out.nb.isWinner ? "" : " (no winner at this price)"}</div></div>`);
    } else $("winnerFold").hidden = true;
    HPCharts.lineChart($("chBill"), {
      labels: MON, ariaLabel: "Monthly heating bill",
      series: [{ name: "Today", color: cNow, values: out.monthly.map(m => m.today.costUsd) }, { name: "Heat pump", color: cHp, values: out.monthly.map(m => m.heatPump.costUsd) }],
      fmt: (v, tip) => tip ? money(v) : "$" + kFmt(v)
    });
    $("mTable").innerHTML = out.monthly.map((m, i) => `<tr><td>${MON[i]}</td><td>${money(m.today.costUsd)}</td><td>${money(m.heatPump.costUsd)}</td><td>${Math.round(m.today.co2Kg).toLocaleString()} kg</td><td>${Math.round(m.heatPump.co2Kg).toLocaleString()} kg</td></tr>`).join("");

    // Size trade-off (placeholder regions) or the dial sweep (model v1)
    const isSweep = !!out.sweep;
    $("sizeCharts").hidden = isSweep; $("lamTable").hidden = !isSweep;
    $("sizeFoldH").textContent = "Other sizes and settings";
    $("sizeFoldS").textContent = isSweep ? "what the model suggests at every dial setting" : "how bigger and smaller units compare";
    if (isSweep) renderLamTable(out); else {
    $("lifeYrs").textContent = life;
    const sIdx = out.sizes.findIndex(s => s.sizeTons === out.sizeTons);
    HPCharts.lineChart($("chSizeCost"), {
      labels: out.sizes.map(s => s.sizeTons + ""), ariaLabel: "Lifetime cost by heat pump size", highlight: sIdx >= 0 ? sIdx : null,
      tipLabel: i => `${out.sizes[i].sizeTons} tons`,
      series: [{ name: "Keep today's", color: cNow, dash: "5 5", values: out.sizes.map(() => out.lifetime.todayCostUsd) },
               { name: "Heat pump", color: cHp, values: out.sizes.map(s => s.lifetimeCostUsd) }],
      fmt: (v, tip) => tip ? money(v) : "$" + kFmt(v)
    });
    HPCharts.lineChart($("chSizeCo2"), {
      labels: out.sizes.map(s => s.sizeTons + ""), ariaLabel: "Lifetime CO2 by heat pump size", highlight: sIdx >= 0 ? sIdx : null,
      tipLabel: i => `${out.sizes[i].sizeTons} tons · heat pump covers ${pct(out.sizes[i].heatPumpShare)}`,
      series: [{ name: "Keep today's", color: cNow, dash: "5 5", values: out.sizes.map(() => out.lifetime.todayCo2Kg / 1000) },
               { name: "Heat pump", color: cHp, values: out.sizes.map(s => s.lifetimeCo2Kg / 1000) }],
      fmt: (v, tip) => (tip ? v.toFixed(1) : (v >= 10 ? Math.round(v) : v.toFixed(1))) + " t"
    });
    }

    // Scenario options only exist in the model v1 region


    await renderRebates(out);
  }



  // ---------- Carbon-price dial ----------
  const sizeLabel = k => k ? `${k / 12}-ton hybrid heat pump` : "Keep the gas furnace";
  const dollars = v => "$" + Math.round(v).toLocaleString();
  function dialSetText(idx) {
    if (isV1(region())) return `${dollars(carbonUsd())} per tonne of CO₂`;
    return idx === 0 ? "Lowest total cost" : idx === DIAL_STEPS ? "Lowest carbon" : idx < DIAL_STEPS / 2 ? "Leaning toward lower cost" : idx > DIAL_STEPS / 2 ? "Leaning toward lower carbon" : "A balance of cost and carbon";
  }
  ["dial", "dial2"].forEach(id => $(id).addEventListener("input", e => {
    if (isV1(region())) state.carbonUsd = +e.target.value;
    else { state.priority = +e.target.value / DIAL_STEPS; state.prioSet = true; }
    state.sizeTons = null; save(); renderDial();
    if (current === 3) renderResults();
  }));
  // Cost-versus-carbon trade-off: one dot per option the model considered (v1: one per dial setting; stand-in: one per size).
  function renderTradeoff(out) {
    const life = out.lifetimeYears, t = v => Math.round(v).toLocaleString();
    let pts = [];
    if (out.v1) {
      const seen = new Set();
      V1.sweep(out.v1.scenario).forEach(r => {
        const cur = r.lamIdx === out.v1.lamIdx, k = `${r.sizeKbtuh}|${Math.round(r.lifetimeCostUsd)}|${Math.round(r.lifetimeCo2T)}`;
        if (seen.has(k) && !cur) return; seen.add(k);
        const name = r.sizeKbtuh ? `${r.sizeKbtuh / 12}-ton heat pump` : "Keep the furnace";
        pts.push({ x: r.lifetimeCo2T, y: r.lifetimeCostUsd, current: cur, label: cur ? name : `${name}: ${dollars(r.lifetimeCostUsd)}, ${t(r.lifetimeCo2T)} t CO₂` });
      });
    } else {
      pts.push({ x: out.lifetime.todayCo2Kg / 1000, y: out.lifetime.todayCostUsd, current: !out.sizeTons, label: "Keep today's heat" });
      out.sizes.forEach(s => { const cur = out.nb ? !out.nb.keepFurnace && s.profile === out.nb.profile : s.sizeTons === out.sizeTons, name = `${s.sizeTons}-ton heat pump`;
        pts.push({ x: s.lifetimeCo2Kg / 1000, y: s.lifetimeCostUsd, current: cur, label: cur ? name : `${name}: ${dollars(s.lifetimeCostUsd)}, ${t(s.lifetimeCo2Kg / 1000)} t CO₂` }); });
    }
    $("trCard").hidden = pts.length < 2;
    if (pts.length < 2) return;
    HPCharts.tradeoffChart($("chTrade"), { points: pts, ariaLabel: `Lifetime cost versus lifetime CO2 over ${life} years for each option`,
      xFmt: v => t(v), yFmt: v => "$" + kFmt(v), xTitle: `CO₂ over ${life} years (tonnes)`, yTitle: `Cost over ${life} years` });
  }
  function renderDial() {
    const nb = isV1(region());
    ["dial", "dial2"].forEach(id => { const el = $(id); el.max = nb ? 300 : DIAL_STEPS; el.step = nb ? 10 : 1; el.value = nb ? carbonUsd() : dialIdx(); });
    ["dialVal", "dialVal2"].forEach(id => { $(id).textContent = dialSetText(nb ? 0 : dialIdx()); });
    $("dial2Card").hidden = false;
  }
  function renderLamTable(out) {
    const rows = out.sweep;
    $("lamTable").innerHTML = `<p class="muted" style="max-width:70ch;margin:-4px 0 12px">Each row is one setting of the dial, with what the model recommends there. Your current setting is highlighted. Costs are ${out.lifetimeYears}-year totals with the model's own rebate assumption.</p>
      <div class="table-scroll"><table class="lamtbl"><thead><tr><th>Dial ($ per tonne CO₂)</th><th>Model picks</th><th>${out.lifetimeYears}-yr cost</th><th>${out.lifetimeYears}-yr CO₂</th><th>$ per tonne avoided</th></tr></thead><tbody>${
      rows.map(r => `<tr class="${r.lam === out.nb.carbonUsdPerTonne ? "cur" : ""}"><td>${dollars(r.lam)}</td><td>${r.sizeTons ? r.sizeTons + "-ton hybrid heat pump" : "Keep the gas furnace"}</td><td>${dollars(r.lifetimeCostUsd)}</td><td>${r.lifetimeCo2T.toFixed(0)} t</td><td>${r.usdPerTonne != null ? dollars(r.usdPerTonne) : "—"}</td></tr>`).join("")}</tbody></table></div>`;
  }
  // The model data loads asynchronously; refresh results once it is there.
  

  // ---------- Rebates section ----------
  const RB = window.HP_REBATES;
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  // Run the model with and without rebates at the same size, so both columns are always comparable.
  async function bothRebateCases(out, lamIdx = null) {
    const [w, wo] = await Promise.all([true, false].map(on => runModel(modelInputs(out.sizeTons, on, null, lamIdx))));
    return { w, wo };
  }
  const lifeNet = o => o.annual.today.costUsd * o.lifetimeYears - o.lifetime.costUsd; // saved vs keeping today's heat
  const paybackLabel = o => o.sizeTons === 0 ? "—" : o.paybackYears != null && o.paybackYears <= 40 ? o.paybackYears.toFixed(1) + " years" : "Not on bills alone";
  const paybackTxt = paybackLabel;
  async function renderRebates(out) {
    const r = region(), h = effective(), rb = RB.REGION[r.id];
    const { w, wo } = await bothRebateCases(out);
    const reb = w.upfront.rebatesUsd, life = out.lifetimeYears;
    $("rebLede").textContent = reb > 0
      ? `Counting about ${money(reb)} off the upfront cost.`
      : `No rebates counted for this home. Add one under "Prices, rebates and other details" on the home step.`;
    $("rebSeg").querySelectorAll("button").forEach(b => {
      b.setAttribute("aria-pressed", (b.dataset.reb === "1") === state.rebatesOn);
      b.onclick = () => { state.rebatesOn = b.dataset.reb === "1"; save(); renderResults(); };
    });
    $("incSeg").querySelectorAll("button").forEach(b => {
      b.setAttribute("aria-pressed", b.dataset.inc === state.income);
      b.onclick = () => { state.income = b.dataset.inc; save(); renderResults(); };
    });
    $("rebTotal").innerHTML = state.income !== "none"
      ? `Income-based rebate: ${money(w.upfront.rebatesUsd)}<small>${w.sizeTons ? `Your upfront cost comes down to ${money(w.upfront.netUsd)}.` : "It comes off the cost of a heat pump. At this setting of the dial we suggest keeping your gas furnace; the figures show the best heat pump for comparison."}</small>`
      : `Income-based rebate: none<small>Choose a range above if your household qualifies.</small>`;
    $("incBox").hidden = $("whatIf").hidden = false;
    $("incLede").textContent = state.income === "full" ? "Income at or under 80% of area median: the full rebate, up to $8,000, counted above."
      : state.income === "partial" ? "Income between 80% and 150% of area median: half the cost, up to $4,000, counted above."
      : "Income over 150% of area median: no income-based rebate.";
    const row = (k, a, b, d, on) => `<tr class="${on ? "on" : ""}"><td>${k}</td><td>${a}</td><td>${b}</td><td class="diff">${d}</td></tr>`;
    const dlt = (x, y, fmt) => { const v = x - y; return v === 0 ? "—" : fmt(v); };
    $("rebCmp").innerHTML = [
      row("Upfront costs (after rebates)", money(wo.upfront.netUsd), money(w.upfront.netUsd), dlt(wo.upfront.netUsd, w.upfront.netUsd, v => money(-v))),
      row("Break-even (pays for itself)", paybackTxt(wo), paybackTxt(w),
          wo.paybackYears != null && w.paybackYears != null ? dlt(wo.paybackYears, w.paybackYears, v => (v > 0 ? "−" : "+") + Math.abs(v).toFixed(1) + " years") : "—"),
      row(`Total cost over ${life} years`, money(wo.lifetime.costUsd), money(w.lifetime.costUsd), dlt(wo.lifetime.costUsd, w.lifetime.costUsd, v => money(-v))),
      row(`Saved vs. keeping today's heat (${life} yrs)`, money(lifeNet(wo)), money(lifeNet(w)), dlt(lifeNet(w), lifeNet(wo), v => "+" + money(v)))
    ].join("");
    $("rebCmpNote").textContent = "Rebates change what you pay up front, not your yearly heating bill or your carbon footprint. Heating bills and CO₂ are the same in both columns.";

    $("rebSources").innerHTML = RB.SOURCES.map(x => `<div class="src-card"><h3>${esc(x.title)}</h3><p class="muted">${esc(x.p)}</p></div>`).join("");
    $("rebRegionH").textContent = `What's available around ${r.name}`;
    $("rebRegionIntro").textContent = rb.intro;
    $("rebPrograms").innerHTML = rb.programs.map(p => `<div class="prog"><h3>${esc(p.name)} <span class="st ${p.status}">${RB.STATUS[p.status] || p.status}</span><span class="lvl">${esc(p.level)}</span></h3>
      <p class="amt">${esc(p.amount)}</p><p class="nt">${esc(p.note)}</p>
      ${p.url ? `<p style="margin-top:6px"><a href="${esc(p.url)}" target="_blank" rel="noopener">Official program page ↗</a>${p.checked ? "" : ' <span class="muted" style="font-size:12px">(link not verified)</span>'}</p>` : ""}</div>`).join("");
    $("rebCaveat").innerHTML = `<b>Good to know.</b> Amounts and deadlines are current as of ${RB.asOf}. ${esc(rb.amountsNote)} Ask your installer which rebates they handle.`;
  }

  // ---------- Printable report (saved as PDF through the browser's print dialog) ----------
  const TON_BTUH = 12000, KW_BTUH = 3412;
  const roundTo = (v, n) => Math.round(v / n) * n;
  async function buildReport() {
    const r = region(), h = effective(), f = FUELS[h.currentHeat], rb = RB.REGION[r.id];
    const base = lastOut || await runModel(modelInputs(state.sizeTons));
    // Model v1 can say "keep your furnace" at a low dial setting; the installer sheet then uses the model's best heat pump option.
    const keepNote = !!(base.v1 && !base.sizeTons);
    const { w, wo } = await bothRebateCases(base, keepNote ? DIAL_STEPS : null);
    const out = w, a = out.annual, life = out.lifetimeYears;
    const dialLam = base.v1 ? base.v1.lam : null;
    const sizes = out.v1 ? V1.meta().sizes_kbtuh.map(k => k / 12) : (Model().sizes || out.sizes.map(s => s.sizeTons));
    const i = sizes.indexOf(out.sizeTons);
    const lo = sizes[Math.max(0, i - 1)], hi = sizes[Math.min(sizes.length - 1, i + 1)];
    const loadBtuh = out.designLoadKw * KW_BTUH;
    const capBtuh = out.capacityKwAt5F != null ? out.capacityKwAt5F * KW_BTUH : null;
    const ov = state.overrides, tag = k => k in ov ? '<span class="tg you">you entered</span>' : '<span class="tg">typical for area</span>';
    const date = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
    const backupLine = h.currentHeat === "electric"
      ? "Keep your existing electric baseboards or furnace as backup for the coldest hours. Ask for a control that only turns on electric backup when the heat pump can't keep up."
      : `Keep your existing ${f.short} system as backup (a "hybrid" setup). Ask for a control that switches to it below a set outdoor temperature, and ask what switchover temperature the rebate programs require.`;
    const pay = o => o.paybackYears != null && o.paybackYears <= 40 ? o.paybackYears.toFixed(1) + " years" : "not on bills alone";
    const cut = a.today.co2Kg - a.heatPump.co2Kg;
    const stat = id => (RB.STATUS[id] || id);
    const ov0 = state.overrides;
    const rows = [
      ["Home type and size", `${Math.round(selection(r, ov0).sqft).toLocaleString()} sq ft`, "sizeBin"],
      ["How well insulated", INS_LABELS[Math.max(0, INS_LEVELS.indexOf(h.insulationR))], "insulationR"],
      ["Current heating", f.label, "currentHeat"],
      ["Winter thermostat", `${h.thermostatF} °F`, "thermostatF"],
      ["Heat loss", `${h.heatLossWPerF} W per °F`, "heatLossWPerF"],
      ["Electricity price", `$${h.electricityUsdPerKWh.toFixed(3)} per kWh`, "electricityUsdPerKWh"],
      ...(h.currentHeat === "electric" ? [] : [[`${f.short[0].toUpperCase() + f.short.slice(1)} price`, `$${h.fuelUsdPerUnit.toFixed(2)} per ${f.unit}`, "fuelUsdPerUnit"]]),
      ["Income range", { full: "80% of area median or less", partial: "80–150% of area median", none: "Over 150% of area median" }[state.income], "income"]
    ];
    const questions = [
      "Will you do a full Manual J load calculation for my home, and can I have a copy?",
      `Is a ${out.sizeTons}-ton cold-climate model (range ${lo}–${hi} tons) the right size once you've measured the house? Why or why not?`,
      "What is the model's rated heating capacity at 5 °F and at the coldest night in my area, and what is its efficiency (HSPF2 / COP) at those temperatures?",
      "Is it on the NEEP cold-climate list and on my utility's qualified product list?",
      "How will backup heat work, and at what outdoor temperature does it take over? Can you set it to meet my rebate's requirements?",
      "Which rebates and loans do you handle paperwork for, and is any discount already in your quote?",
      "Does the quote include electrical work, a new thermostat or controls, removal of old equipment, permits and ductwork changes?",
      "What are the warranty terms on parts, compressor and labor, and who services it after install?",
      "How long will the install take, and is a permit and inspection included?",
      "Can I get itemized quotes from at least two other installers to compare?"
    ];
    const docs = ["Photo ID and proof you own the home", "Recent electric bill (and gas bill if you use gas) with account numbers", "Recent bill or delivery receipt for oil, propane or other fuel", "Photos of your current furnace or boiler, its nameplate, and your electrical panel", "Floor plan or square footage, and notes on rooms that are too hot or cold", "Any past energy audit, insulation or air-sealing invoices", "Income documents, if you may qualify for income-based rebates", ...rb.paperwork.filter(p => !/income/i.test(p))];
    const progs = rb.programs.map(p => `<tr><td><b>${esc(p.name)}</b><br><span style="font-size:9pt">${esc(p.level)}</span></td><td>${stat(p.status)}</td><td>${esc(p.amount)}${p.url ? `<br><span style="font-size:8.5pt;color:#555">${esc(p.url)}</span>` : ""}</td></tr>`).join("");

    $("report").innerHTML = `
      <header><p style="font-weight:700;color:#3E5A33">Heat pump request sheet · for your installer</p>
        <h1>${esc(r.full)}</h1>
        <p>Prepared ${esc(date)} with ResiOpt. ${Object.keys(ov).length ? `${Object.keys(ov).length} detail${Object.keys(ov).length > 1 ? "s" : ""} entered by the homeowner; the rest are typical values for the area.` : "All home details are typical values for the area; the homeowner has not yet entered their own."}</p></header>

      <div class="warn"><b>Next step: your installer.</b> Bring this report to a licensed installer, who will run the load calculation (ACCA Manual J) and system design to confirm the equipment.</div>

      <section><h2>1. What I'm asking for</h2>
        ${out.v1 ? `<p style="margin-bottom:4pt"><b>Carbon dial:</b> ${dollars(dialLam)} per tonne of CO₂ (how much I value cutting emissions).${keepNote ? ` At that setting the model says keeping the gas furnace is cheapest overall; the request below is the model's best heat pump option, for if I decide to go ahead anyway.` : ""}</p>` : ""}
        <div class="grid2">
          <div class="box"><div class="big">${out.sizeTons}-ton cold-climate air-source heat pump</div>
            <p>Please quote ${lo} to ${hi} tons. About ${roundTo(out.sizeTons * TON_BTUH, 1000).toLocaleString()} BTU/h nominal.</p>
            ${capBtuh != null ? `<p>Rated heating output near 5 °F: about ${roundTo(capBtuh, 500).toLocaleString()} BTU/h (${out.capacityKwAt5F.toFixed(1)} kW).</p>` : "<p>Ask the installer for the rated output at 5 °F and at the design temperature.</p>"}</div>
          <div class="box"><div class="big">About ${roundTo(loadBtuh, 1000).toLocaleString()} BTU/h</div>
            <p>Heating load on the coldest design night (${degF(r.designTempF)}), ${out.designLoadKw.toFixed(1)} kW.</p>
            <p>Covers about ${pct(a.heatPump.heatPumpShare)} of yearly heating with the heat pump alone.</p></div>
        </div>
        <p style="margin-top:6pt"><b>Backup / supplemental heat:</b> ${esc(backupLine)}</p>
        ${!out.v1 && out.sizeTons !== out.recommendedSizeTons ? `<p>(The size picker was set to ${out.sizeTons} tons; for the chosen cost-vs-carbon priority we'd suggest ${out.recommendedSizeTons} tons.)</p>` : ""}
      </section>

      <section><h2>2. Location and climate</h2>
        <table><tbody>
          <tr><td>Location</td><td>${esc(r.full)}</td></tr>
          <tr><td>Winter design temperature (99%)</td><td>${degF(r.designTempF)} <span class="tg">${r.dataStatus === "data.zip" ? "from ASHRAE data" : "design temperature"}</span></td></tr>
          <tr><td>Coldest month average</td><td>${degF(Math.min(...r.monthlyMeanF))}</td></tr>
          <tr><td>Grid electricity</td><td>${esc(r.gridNote)} (~${r.gridKgCo2PerKWh} kg CO₂ per kWh)</td></tr>
        </tbody></table></section>

      <section><h2>3. Your home details</h2>
        <table><thead><tr><th>Detail</th><th>Value</th><th>Source</th></tr></thead><tbody>
        ${rows.map(([k, v, key]) => `<tr><td>${k}</td><td>${esc(v)}</td><td>${tag(key)}</td></tr>`).join("")}
        </tbody></table>
        <p style="font-size:9.5pt;margin-top:3pt">Please correct anything that's wrong; "typical" values are guesses for a home like mine.</p></section>

      <section><h2>4. Rebates I may qualify for</h2>
        <table><thead><tr><th>Program</th><th>Status</th><th>What it pays / where</th></tr></thead><tbody>${progs}</tbody></table>
        <p style="margin-top:4pt"><b>Rebates counted in the numbers below:</b> ${money(w.upfront.rebatesUsd)} total.</p>
        <p><b>Paperwork to bring or ask the installer about:</b></p>
        <ul>${rb.paperwork.map(p => `<li>${esc(p)}</li>`).join("")}</ul></section>

      <section><h2>5. Cost and CO₂ summary</h2>
        <table><thead><tr><th></th><th>Without standard rebates</th><th>With standard rebates</th></tr></thead><tbody>
          <tr><td>Installed price (${out.sizeTons} tons)</td><td>${money(wo.upfront.installedUsd)}</td><td>${money(w.upfront.installedUsd)}</td></tr>
          <tr><td>Rebates</td><td>$0</td><td>−${money(w.upfront.rebatesUsd)}</td></tr>
          <tr><td>Upfront costs after rebates</td><td>${money(wo.upfront.netUsd)}</td><td>${money(w.upfront.netUsd)}</td></tr>
          <tr><td>Break-even</td><td>${pay(wo)}</td><td>${pay(w)}</td></tr>
          <tr><td>Total cost over ${life} years</td><td>${money(wo.lifetime.costUsd)}</td><td>${money(w.lifetime.costUsd)}</td></tr>
          <tr><td>Yearly heating bill: today → heat pump</td><td colspan="2">${money(a.today.costUsd)} → ${money(a.heatPump.costUsd)}</td></tr>
          <tr><td>Yearly heating CO₂: today → heat pump</td><td colspan="2">${tonnes(a.today.co2Kg)} → ${tonnes(a.heatPump.co2Kg)} (${cut >= 0 ? "cut of" : "increase of"} ${tonnes(cut)})</td></tr>
        </tbody></table></section>

      <section><h2>6. Questions to ask the installer</h2><ol>${questions.map(q => `<li>${esc(q)}</li>`).join("")}</ol></section>

      <section><h2>7. Documents to have ready</h2><ul class="cb">${docs.map(d => `<li>${esc(d)}</li>`).join("")}</ul></section>

      <p class="foot">Prepared in your browser from your answers; nothing was sent anywhere.</p>`;
  }
  async function printReport() {
    if (!region()) return;
    await buildReport();
    const old = document.title;
    document.title = `Heat-pump-report-${region().name}`;
    const restore = () => { document.title = old; window.removeEventListener("afterprint", restore); };
    window.addEventListener("afterprint", restore);
    window.print();
  }
  document.querySelectorAll("[data-report]").forEach(b => b.addEventListener("click", printReport));
  window.HP_buildReport = buildReport; // used by tests
  $("toRebates").addEventListener("click", () => { unlock(4); go(4); });
  $("restart").addEventListener("click", () => { state = blank(); save(); $("place").value = ""; markQuick(); go(0); });

  // ---------- Boot ----------
  if (state.regionId) { $("place").value = region().short; markQuick(); }
  go(routeIndex(), false);
})();
