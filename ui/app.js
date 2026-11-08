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
  const PRICE_KEYS = ["electricityUsdPerKWh", "fuelUsdPerUnit", "rebatesUsd"];

  // ---------- Theme (same ?theme= values as before) ----------
  (() => {
    const valid = ["lichen", "sand", "sage", "paper"];
    let t = new URLSearchParams(location.search).get("theme");
    if (!valid.includes(t)) { try { t = localStorage.getItem("hp-theme"); } catch (e) {} }
    if (!valid.includes(t)) t = "lichen";
    const apply = v => {
      if (v === "lichen") document.documentElement.removeAttribute("data-theme"); else document.documentElement.setAttribute("data-theme", v);
      document.querySelectorAll("[data-theme-btn]").forEach(b => b.setAttribute("aria-pressed", b.dataset.themeBtn === v));
      try { localStorage.setItem("hp-theme", v); } catch (e) {}
      const u = new URL(location.href); u.searchParams.set("theme", v); history.replaceState(null, "", u);
    };
    document.querySelectorAll("[data-theme-btn]").forEach(b => b.addEventListener("click", () => { apply(b.dataset.themeBtn); if (current === 3) renderResults(); }));
    apply(t);
  })();

  // ---------- State ----------
  const blank = () => ({ regionId: null, maxStep: 0, overrides: {}, priority: 0.5, prioSet: false, sizeTons: null, usedTypical: true, rebatesOn: true, cold: false, acCredit: false });
  let state = blank();
  try { const s = JSON.parse(sessionStorage.getItem("hp-wizard")); if (s && (s.regionId === null || REGIONS[s.regionId])) state = Object.assign(blank(), s); } catch (e) {}
  const save = () => { try { sessionStorage.setItem("hp-wizard", JSON.stringify(state)); } catch (e) {} };
  let current = 0;

  const region = () => REGIONS[state.regionId];

  // ---------- Model v1 (Minneapolis) ----------
  const V1 = window.HeatPumpModelV1;
  const DEFAULT_LAM_IDX = 10;                       // $500/t: about where the model's heat pump starts to win
  const DIAL_STEPS = 12;                            // 13 slider positions = the model's lambda grid
  const dialIdx = () => state.prioSet ? Math.round(state.priority * DIAL_STEPS) : DEFAULT_LAM_IDX;
  const isV1 = r => !!r && r.id === V1.regionId && V1.loaded();
  async function runModel(inp) {
    if (inp.region.id === V1.regionId && V1.loaded()) {
      const sc = inp.scenario;
      return V1.run(inp, { tariff: inp.prices.timeOfUse ? "tou" : "flat", weather: sc.coldWinter ? "tmy3_cold" : "tmyx_main",
                           credit: sc.acCredit ? 4000 : 0, controller: "smart", lamIdx: sc.lamIdx, rebatesOn: sc.rebatesOn });
    }
    return Model().run(inp);
  }

  // Typical (synthetic) home + regional prices, then the user's overrides on top.
  function typical(r, ov) {
    const heat = ov.currentHeat || r.typicalHome.currentHeat;
    const sqft = ov.floorAreaSqft || r.typicalHome.floorAreaSqft;
    const env = ov.envelope || r.typicalHome.envelope;
    return {
      floorAreaSqft: r.typicalHome.floorAreaSqft,
      envelope: r.typicalHome.envelope,
      currentHeat: r.typicalHome.currentHeat,
      thermostatF: r.typicalHome.thermostatF,
      heatLossWPerF: Math.round(sqft * ENVELOPES[env].wPerFPerSqft / 5) * 5,
      electricityUsdPerKWh: r.electricityUsdPerKWh,
      fuelUsdPerUnit: heat === "electric" ? (ov.electricityUsdPerKWh ?? r.electricityUsdPerKWh) : r.fuelPrices[heat],
      rebatesUsd: r.rebatesUsd + (heat === "gas" && r.rebateIfGasBackupUsd ? r.rebateIfGasBackupUsd : 0),
      installedUsdPerTon: INSTALLED_USD_PER_TON,
      timeOfUse: false
    };
  }
  function effective() {
    const r = region(), d = typical(r, state.overrides);
    return Object.assign({}, d, state.overrides);
  }
  function modelInputs(sizeTons, rebatesOn = state.rebatesOn, tou = null, lamIdx = null) {
    const r = region(), h = effective(), f = FUELS[h.currentHeat];
    const fuelPrice = h.currentHeat === "electric" ? h.electricityUsdPerKWh : h.fuelUsdPerUnit;
    const fuelCo2 = h.currentHeat === "electric" ? r.gridKgCo2PerKWh : f.co2;
    return {
      schemaVersion: 1,
      region: { id: r.id, name: r.full, designTempF: r.designTempF, monthlyMeanF: r.monthlyMeanF, monthlySdF: r.monthlySdF, dataStatus: r.dataStatus },
      home: { source: Object.keys(state.overrides).length ? "custom" : "typical", floorAreaSqft: h.floorAreaSqft, envelope: h.envelope,
              heatLossWPerF: h.heatLossWPerF, thermostatF: h.thermostatF, currentHeat: h.currentHeat },
      prices: { electricityUsdPerKWh: h.electricityUsdPerKWh, fuelUsdPerUnit: fuelPrice, fuelUnit: f.unit, timeOfUse: tou == null ? !!h.timeOfUse : tou,
                fuelUsdPerKWhHeat: fuelPrice / (f.kwh * f.eff) },
      emissions: { gridKgCo2PerKWh: r.gridKgCo2PerKWh, fuelKgCo2PerUnit: fuelCo2, fuelKgCo2PerKWhHeat: fuelCo2 / (f.kwh * f.eff) },
      costs: { installedUsdPerTon: h.installedUsdPerTon, rebatesUsd: rebatesOn ? h.rebatesUsd : 0, lifetimeYears: LIFETIME_YEARS },
      priority: state.prioSet ? state.priority : (isV1(r) ? DEFAULT_LAM_IDX / DIAL_STEPS : state.priority),
      sizeTons: sizeTons ?? null,
      scenario: { coldWinter: state.cold, acCredit: state.acCredit, rebatesOn, lamIdx: lamIdx ?? dialIdx() }  // used by model v1
    };
  }

  // ---------- Navigation ----------
  function go(i, push = true) {
    i = Math.max(0, Math.min(i, state.maxStep));
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
    msg.textContent = raw.trim() ? `We don't have data for "${raw.trim()}" yet. Pick the closest of the four regions above.` : "Type a city or ZIP code, or pick a region.";
  });

  // ---------- Step 2: climate ----------
  // Content lives in ui/regions.js (CLIMATE, CLIMATE_TYPES, SOURCES); each claim is tagged and cited.
  const { SOURCES, CLIMATE_TYPES } = window.HP_DATA;
  const ico = {
    sun: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    leaf: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15"/><path d="M5 19l7-7"/></svg>',
    snow: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linecap="round"><path d="M12 2v20M4 7l16 10M20 7 4 17"/></svg>'
  };
  const pct = v => Math.round(v * 100) + "%";
  const TAGS = { research: "Research", data: "Team data", reasoning: "Our reasoning", gap: "Not researched" };
  const tagHtml = t => `<span class="tag tag-${t}">${TAGS[t]}</span>`;
  const cite = ids => ids && ids.length ? ids.map(n => `<sup><a href="#src-${n}" class="cite">${n}</a></sup>`).join("") : "";
  function renderClimate() {
    const r = region(); if (!r) return;
    const c = r.climate;
    $("cKicker").textContent = "Your climate · " + r.full;
    $("h1").textContent = c.headline;
    $("cIntro").textContent = c.status === "researched" ? "Here is what the research and the team's data say about heat pumps where you live." : c.status === "limited" ? "We have less research for this region, so some of this page is our own reasoning, marked as such." : "This is a hard case for heat pumps, and we say so plainly below.";
    $("cMini").innerHTML = c.design ? `<div><b>${c.design.text}</b>${c.design.label}${cite(c.design.src)}</div>` : "";
    $("cSpecialist").hidden = !c.specialist; $("cSpecialist").innerHTML = c.specialist ? `<b>Needs a specialist.</b> ${c.specialist}` : "";
    const icons = ["sun", "leaf", "snow"];
    $("cFacts").innerHTML = c.cards.map((f, i) => `<div class="fact ${i === 2 ? "less" : ""}"><div class="ico">${ico[icons[i]]}</div><p class="muted" style="font-size:13px;font-weight:600">${f.k}</p><h3>${f.h}</h3><p style="margin-top:6px">${f.p}${cite(f.src)}</p><p style="margin-top:8px">${tagHtml(f.tag)}</p></div>`).join("");
    $("cTypes").innerHTML = CLIMATE_TYPES.map(t => `<div class="ctype ${t.id === c.type ? "here" : ""}"><h3>${t.name}${t.id === c.type ? ' <span class="tag yours">Like yours</span>' : ""}</h3><p style="margin-top:6px;font-size:14px">${t.text}${cite(t.src)}</p></div>`).join("");
    $("cNotes").innerHTML = c.notes.map(n => `<li>${tagHtml(n.tag)} ${n.text}${cite(n.src)}</li>`).join("");
    $("cSources").innerHTML = Object.entries(SOURCES).map(([n, s]) => `<li id="src-${n}" value="${n}">${s.u ? `<a href="${s.u}" target="_blank" rel="noopener">${s.t}</a>` : s.t}</li>`).join("");
  }
  $("toHome").addEventListener("click", () => { unlock(2); go(2); });

  // ---------- Step 3: home ----------
  const heatSel = $("heat");
  Object.entries(FUELS).forEach(([k, f]) => { const o = document.createElement("option"); o.value = k; o.textContent = f.label; heatSel.appendChild(o); });
  Object.entries(ENVELOPES).forEach(([k, e]) => {
    const b = document.createElement("button"); b.type = "button"; b.dataset.env = k; b.textContent = e.label;
    b.addEventListener("click", () => setOverride("envelope", k)); $("envSeg").appendChild(b);
  });
  const FIELDS = [ // [inputId, key, parse]
    ["sqft", "floorAreaSqft", Number], ["heat", "currentHeat", String], ["tstat", "thermostatF", Number],
    ["elec", "electricityUsdPerKWh", Number], ["fuelPrice", "fuelUsdPerUnit", Number], ["rebates", "rebatesUsd", Number],
    ["costTon", "installedUsdPerTon", Number], ["ua", "heatLossWPerF", Number]
  ];
  function setOverride(key, val) {
    const r = region(), d = typical(r, state.overrides);
    if (key === "currentHeat") { delete state.overrides.fuelUsdPerUnit; delete state.overrides.rebatesUsd; }
    if (key === "floorAreaSqft" || key === "envelope") delete state.overrides.heatLossWPerF;
    if (val === "" || val == null || (typeof val === "number" && !isFinite(val)) || val === d[key]) delete state.overrides[key];
    else state.overrides[key] = val;
    state.sizeTons = null;
    renderHome(key); save();
  }
  FIELDS.forEach(([id, key, parse]) => {
    $(id).addEventListener("change", e => setOverride(key, e.target.value === "" ? "" : parse(e.target.value)));
  });
  $("tou").addEventListener("change", e => setOverride("timeOfUse", e.target.checked));
  const prioText = v => v < 20 ? "We'll favor the lowest total cost." : v > 80 ? "We'll favor the lowest carbon." : v < 45 ? "Leaning toward lower cost." : v > 55 ? "Leaning toward lower carbon." : "A balance of cost and carbon.";
  $("prio").addEventListener("input", e => { state.priority = +e.target.value / 100; state.prioSet = true; state.sizeTons = null; $("prioText").textContent = prioText(+e.target.value); save(); });

  function renderHome(skipKey) {
    const r = region(); if (!r) return;
    const d = typical(r, state.overrides), h = effective(), f = FUELS[h.currentHeat];
    $("qpRegion").textContent = r.name;
    $("qpWhy").textContent = `We'll model ${r.typicalHome.why}.`;
    const td = typical(r, {});
    $("qpList").innerHTML = [
      `${td.floorAreaSqft.toLocaleString()} sq ft, ${ENVELOPES[td.envelope].label.toLowerCase()}`,
      `Heated today by ${FUELS[td.currentHeat].short}`,
      `Thermostat at ${td.thermostatF} °F`,
      `Local prices: electricity $${td.electricityUsdPerKWh.toFixed(2)}/kWh${td.currentHeat !== "electric" ? `, ${FUELS[td.currentHeat].short} $${td.fuelUsdPerUnit.toFixed(2)}/${FUELS[td.currentHeat].unit}` : ""}`,
      `Rebates: $${td.rebatesUsd.toLocaleString()}`
    ].map(x => `<li>${x}</li>`).join("");

    FIELDS.forEach(([id, key]) => { if (key !== skipKey || id === "heat") $(id).value = h[key]; });
    $("fuelPriceL").textContent = h.currentHeat === "electric" ? "Fuel price (same as electricity)" : `${f.short[0].toUpperCase() + f.short.slice(1)} ($ per ${f.unit})`;
    $("fuelPrice").disabled = h.currentHeat === "electric";
    $("tou").checked = !!h.timeOfUse;
    document.querySelectorAll("#envSeg button").forEach(b => b.setAttribute("aria-pressed", b.dataset.env === h.envelope));
    $("prio").value = Math.round((state.prioSet ? state.priority : 0.5) * 100); $("prioText").textContent = prioText(+$("prio").value);
    document.querySelectorAll("[data-src]").forEach(s => {
      const yours = s.dataset.src in state.overrides; s.textContent = yours ? "yours" : "typical"; s.classList.toggle("yours", yours);
    });
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
    $("rSub").textContent = `${h.floorAreaSqft.toLocaleString()} sq ft, ${ENVELOPES[h.envelope].label.toLowerCase()}, heated by ${f.short} today. ` +
      (custom ? `${custom} detail${custom > 1 ? "s" : ""} from you, the rest typical for the area.` : "All details are typical for the area; go back to add yours.") +
      (out.v1 ? " The v1 model uses a fixed typical house, so these details aren't used in its numbers yet." : "");
    const v1 = out.v1, v1Failed = r.id === V1.regionId && !v1;
    $("rBanner").innerHTML = v1
      ? "<b>Model v1.</b> These numbers come from the team's first Python model: not exactly what our end model will be, but closer to what we're thinking. It uses one fixed typical house, so your home details and price edits don't change these figures yet, and several inputs (installed cost, rebates, time-of-use rates, AC credit, grid carbon) are placeholders."
      : "<b>Placeholder numbers.</b> The team's model isn't plugged in for this region yet. These come from a simple stand-in so the layout can be reviewed." + (v1Failed ? " (The Minneapolis model data couldn't be loaded, so this is the stand-in too. Open the site through the local server or the deployed URL.)" : "");
    $("rBanner").hidden = false;

    const a = out.annual, cut = a.today.co2Kg - a.heatPump.co2Kg, saveYr = a.today.costUsd - a.heatPump.costUsd;
    $("rSizeBox").hidden = !!v1; document.querySelector(".reco").classList.toggle("single", !!v1);
    if (v1 && !out.sizeTons) {
      $("rReco").textContent = "Keep your gas furnace for now";
      $("rRecoSub").textContent = `At $${v1.lam.toLocaleString()} per tonne of CO₂ the model finds a heat pump costs more than it's worth. Turn the dial below up to see when that changes.`;
    } else if (v1) {
      $("rReco").textContent = `A ${out.sizeTons}-ton (${v1.sizeKbtuh},000 BTU/h) cold-climate heat pump`;
      $("rRecoSub").textContent = `It would cover about ${pct(a.heatPump.heatPumpShare)} of your heating, with your ${backup} as backup. ` +
        (v1.centerpointRule ? "A smart controller picks the heat pump or the furnace hour by hour, and the heat pump runs whenever it's above 40 °F, as CenterPoint's rebate requires." : "A smart controller picks the heat pump or the furnace hour by hour.");
    } else {
      $("rReco").textContent = `A ${out.sizeTons}-ton cold-climate heat pump`;
      $("rRecoSub").textContent = `It would cover about ${pct(a.heatPump.heatPumpShare)} of your heating, with your ${backup} as backup for the coldest hours.` +
        (out.sizeTons !== out.recommendedSizeTons ? ` For your priorities we'd suggest ${out.recommendedSizeTons} tons.` : "");
    }
    renderDial(out);
    if (!v1) $("rSizes").innerHTML = out.sizes.map(s => `<button data-size="${s.sizeTons}" aria-pressed="${s.sizeTons === out.sizeTons}">${s.sizeTons} t${s.sizeTons === out.recommendedSizeTons ? '<span class="star" aria-label="suggested">★</span>' : ""}</button>`).join("");
    if (!v1) $("rSizes").querySelectorAll("button").forEach(b => b.addEventListener("click", () => { state.sizeTons = +b.dataset.size; save(); renderResults(); }));

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
      ["", "Upfront, after rebates", money(up.netUsd), `${money(up.installedUsd)} installed − ${money(up.rebatesUsd)} rebates`],
      ["", "Pays for itself in", paybackLabel(out), out.paybackYears != null ? `heat pumps last about ${life} years` : "bills don't drop enough to repay the upfront cost"],
      ["", `Over ${life} years`, (lifeSave >= 0 ? "" : "") + money(Math.abs(lifeSave)), lifeSave >= 0 ? "saved overall, after upfront cost" : "more overall, after upfront cost"]
    ].map(([c, k, v, s]) => `<div class="tile ${c}"><div class="k">${k}</div><div class="v">${v}</div><div class="s">${s}</div></div>`).join("");

    $("sumTiles").innerHTML = [
      ["hero-t", "Yearly heating bill", money(a.heatPump.costUsd), `vs ${money(a.today.costUsd)} today · ${saveYr >= 0 ? money(saveYr) + " saved" : money(-saveYr) + " more"} per year`],
      ["", "Upfront, after rebates", money(up.netUsd), `${money(up.installedUsd)} installed − ${money(up.rebatesUsd)} rebates`],
      ["", "Pays for itself in", paybackLabel(out), !out.sizeTons ? "no heat pump at this setting" : out.paybackYears != null ? `heat pumps last about ${life} years` : "bills don't drop enough to repay the cost"],
      ["", !out.sizeTons ? "CO₂ change per year" : cut >= 0 ? "CO₂ cut per year" : "CO₂ added per year", tonnes(cut), !out.sizeTons ? "no heat pump at this setting" : a.today.co2Kg ? `${pct(Math.abs(cut) / a.today.co2Kg)} ${cut >= 0 ? "less" : "more"} than today` : ""]
    ].map(([c, k, v, s]) => `<div class="tile ${c}"><div class="k">${k}</div><div class="v">${v}</div><div class="s">${s}</div></div>`).join("");

    $("lgNow2").textContent = "Keep " + f.short;
    const yrs = Array.from({ length: life + 1 }, (_, y) => y);
    HPCharts.lineChart($("chCum"), {
      labels: yrs.map(String), xEvery: 5, ariaLabel: "Cumulative spending over time",
      tipLabel: i => `After ${i} year${i === 1 ? "" : "s"}`,
      series: [{ name: "Keep today's", color: cNow, values: yrs.map(y => y * a.today.costUsd) }, { name: "Heat pump", color: cHp, values: yrs.map(y => up.netUsd + y * a.heatPump.costUsd) }],
      marker: out.paybackYears != null && out.paybackYears <= life ? { index: out.paybackYears, text: "Break even" } : null,
      fmt: (v, tip) => tip ? money(v) : "$" + kFmt(v)
    });
    $("cumSub").textContent = `Upfront cost plus heating bills, year by year (years on the bottom)`;
    HPCharts.lineChart($("chBill"), {
      labels: MON, ariaLabel: "Monthly heating bill",
      series: [{ name: "Today", color: cNow, values: out.monthly.map(m => m.today.costUsd) }, { name: "Heat pump", color: cHp, values: out.monthly.map(m => m.heatPump.costUsd) }],
      fmt: (v, tip) => tip ? money(v) : "$" + kFmt(v)
    });
    $("mTable").innerHTML = out.monthly.map((m, i) => `<tr><td>${MON[i]}</td><td>${money(m.today.costUsd)}</td><td>${money(m.heatPump.costUsd)}</td><td>${Math.round(m.today.co2Kg).toLocaleString()} kg</td><td>${Math.round(m.heatPump.co2Kg).toLocaleString()} kg</td></tr>`).join("");

    // Size trade-off (placeholder regions) or the dial sweep (model v1)
    const isSweep = !!out.v1;
    $("sizeCharts").hidden = isSweep; $("lamTable").hidden = !isSweep;
    $("sizeFoldH").textContent = isSweep ? "How the recommendation changes with the dial" : "Bigger or smaller?";
    $("sizeFoldS").textContent = isSweep ? "every setting of the CO₂ dial" : "heat pump size trade-offs";
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
    $("v1Opts").hidden = !out.v1;
    $("coldSeg").querySelectorAll("button").forEach(b => { b.setAttribute("aria-pressed", (b.dataset.cold === "1") === state.cold);
      b.onclick = () => { state.cold = b.dataset.cold === "1"; save(); renderResults(); }; });
    $("acSeg").querySelectorAll("button").forEach(b => { b.setAttribute("aria-pressed", (b.dataset.ac === "1") === state.acCredit);
      b.onclick = () => { state.acCredit = b.dataset.ac === "1"; save(); renderResults(); }; });

    $("rNotes").innerHTML = ((out.isPlaceholder || out.v1) ? out.notes : []).concat(
      r.dataStatus === "placeholder" ? [`Climate, prices and grid carbon for ${r.name} are placeholders until the team's data for this region is in.`]
        : [`Climate, prices and grid carbon for ${r.name} come from the team's data pack (TMYx 2011–2025 weather, EIA prices, MISO 2025 grid).`]
    ).map(n => `<li>${n}</li>`).join("");
    await renderMeter(out);
    await renderRebates(out);
  }



  // ---------- Carbon-price dial ----------
  const sizeLabel = k => k ? `${k / 12}-ton hybrid heat pump` : "Keep the gas furnace";
  const dollars = v => "$" + Math.round(v).toLocaleString();
  function dialSetText(idx) {
    if (isV1(region())) return `${dollars(V1.lambdas()[idx])} per tonne of CO₂`;
    return idx === 0 ? "Lowest total cost" : idx === DIAL_STEPS ? "Lowest carbon" : idx < DIAL_STEPS / 2 ? "Leaning toward lower cost" : idx > DIAL_STEPS / 2 ? "Leaning toward lower carbon" : "A balance of cost and carbon";
  }
  $("dial").addEventListener("input", e => {
    state.priority = +e.target.value / DIAL_STEPS; state.prioSet = true; state.sizeTons = null; save();
    $("dialVal").textContent = dialSetText(+e.target.value);   // instant label; results follow
    renderResults();
  });
  function renderDial(out) {
    const v1 = out.v1, idx = v1 ? v1.lamIdx : dialIdx();
    $("dial").value = idx; $("dialVal").textContent = dialSetText(idx);
    if (!v1) {
      $("dialH").textContent = "What matters more to you?";
      $("dialExplain").textContent = "Slide toward \"Most CO₂ cut\" to favor the heat pump that cuts the most carbon, or toward \"Lowest cost\" to favor the lowest total cost. The same setting is on the home step.";
      $("dialResult").textContent = "";
      return;
    }
    $("dialH").textContent = "How much do you care about CO₂?";
    $("dialExplain").textContent = "Think of it as a carbon tax dial: how many dollars would you pay to keep one tonne of CO₂ out of the air? At low settings the cheapest option wins, so you keep your furnace. Turn it up and the heat pump wins.";
    const sc = v1.scenario, hp = V1.bestHeatPump(sc), life = out.lifetimeYears;
    if (!hp) { $("dialResult").textContent = "The model finds no heat pump option for this scenario."; return; }
    const rebateAdj = sc.rebatesOn ? 0 : hp.up_front ? (hp.centerpoint_rule ? 3100 : 2000) : 0;
    const extra = hp.lifetime_cost + rebateAdj - out.lifetime.todayCostUsd;
    const perT = hp.tonnes_saved_15y ? extra / hp.tonnes_saved_15y : null;
    const wins = extra <= 0 || (perT != null && v1.lam >= perT);
    $("dialResult").textContent = `Over ${life} years the ${sizeLabel(hp.size_kbtuh).toLowerCase()} costs ${extra >= 0 ? dollars(extra) + " more" : dollars(-extra) + " less"} than gas alone and avoids ${hp.tonnes_saved_15y.toFixed(1)} tonnes of CO₂` +
      (extra > 0 && perT != null ? `, about ${dollars(perT)} per tonne. ${wins ? "That's at or below your dial, so the heat pump wins." : "That's above your dial, so keeping your furnace wins."}` : ". The heat pump wins on cost and carbon.");
  }
  function renderLamTable(out) {
    const rows = V1.sweep(out.v1.scenario);
    $("lamTable").innerHTML = `<p class="muted" style="max-width:70ch;margin:-4px 0 12px">Each row is one setting of the dial, with what the model recommends there. Your current setting is highlighted. Costs are ${out.lifetimeYears}-year totals with the model's own rebate assumption.</p>
      <div class="table-scroll"><table class="lamtbl"><thead><tr><th>Dial ($ per tonne CO₂)</th><th>Model picks</th><th>${out.lifetimeYears}-yr cost</th><th>${out.lifetimeYears}-yr CO₂</th><th>$ per tonne avoided</th></tr></thead><tbody>${
      rows.map(r => `<tr class="${r.lamIdx === out.v1.lamIdx ? "cur" : ""}"><td>${dollars(r.lam)}</td><td>${sizeLabel(r.sizeKbtuh)}</td><td>${dollars(r.lifetimeCostUsd)}</td><td>${r.lifetimeCo2T.toFixed(0)} t</td><td>${r.usdPerTonne != null ? dollars(r.usdPerTonne) : "—"}</td></tr>`).join("")}</tbody></table></div>`;
  }
  // The model data loads asynchronously; refresh results once it is there.
  V1.ready.then(ok => { if (ok && region() && (current === 3 || current === 4)) renderResults(); });

  // ---------- Smart meter comparison: heat pump vs heat pump + smart meter ----------
  async function renderMeter(out) {
    const run = tou => runModel(modelInputs(out.sizeTons, state.rebatesOn, tou));
    const [no, yes] = await Promise.all([run(false), run(true)]);
    const had = !!effective().timeOfUse;
    const meterSave = no.annual.heatPump.costUsd - yes.annual.heatPump.costUsd;
    $("meterLede").textContent = had ? "Counting your smart meter." : `Adding one could trim about ${money(meterSave)} a year (placeholder estimate).`;
    $("meterSeg").querySelectorAll("button").forEach(b => {
      b.setAttribute("aria-pressed", (b.dataset.meter === "1") === had);
      b.onclick = () => { setOverride("timeOfUse", b.dataset.meter === "1"); renderResults(); };
    });
    const d = (a, b) => { const v = a - b; return v === 0 ? "—" : (v > 0 ? "−" : "+") + money(Math.abs(v)); };
    const row = (k, a, b, c) => `<tr><td>${k}</td><td>${a}</td><td>${b}</td><td class="diff">${c}</td></tr>`;
    $("meterCmp").innerHTML = [
      row("Yearly heating bill", money(no.annual.heatPump.costUsd), money(yes.annual.heatPump.costUsd), d(no.annual.heatPump.costUsd, yes.annual.heatPump.costUsd)),
      row("Break-even", paybackTxt(no), paybackTxt(yes),
          no.paybackYears != null && yes.paybackYears != null ? (yes.paybackYears - no.paybackYears < 0 ? "−" : "+") + Math.abs(yes.paybackYears - no.paybackYears).toFixed(1) + " years" : "—"),
      row(`Total cost over ${out.lifetimeYears} years`, money(no.lifetime.costUsd), money(yes.lifetime.costUsd), d(no.lifetime.costUsd, yes.lifetime.costUsd))
    ].join("");
  }

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
    const row = (k, a, b, d, on) => `<tr class="${on ? "on" : ""}"><td>${k}</td><td>${a}</td><td>${b}</td><td class="diff">${d}</td></tr>`;
    const dlt = (x, y, fmt) => { const v = x - y; return v === 0 ? "—" : fmt(v); };
    $("rebCmp").innerHTML = [
      row("Upfront cost (after rebates)", money(wo.upfront.netUsd), money(w.upfront.netUsd), dlt(wo.upfront.netUsd, w.upfront.netUsd, v => money(-v))),
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
    $("rebCaveat").innerHTML = `<b>Verify before you rely on these.</b> Program names, amounts and deadlines were read from public pages on ${RB.asOf} and change often; some are placeholders. ${esc(rb.amountsNote)} Always confirm with the program and ask your installer which rebates they handle.`;
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
    const rows = [
      ["Home size", `${h.floorAreaSqft.toLocaleString()} sq ft`, "floorAreaSqft"],
      ["How well it holds heat", ENVELOPES[h.envelope].label, "envelope"],
      ["Current heating", f.label, "currentHeat"],
      ["Winter thermostat", `${h.thermostatF} °F`, "thermostatF"],
      ["Smart meter / time-of-use rate", h.timeOfUse ? "Yes (assumed 10% cheaper electricity)" : "No", "timeOfUse"],
      ["Heat loss (our estimate)", `${h.heatLossWPerF} W per °F`, "heatLossWPerF"],
      ["Electricity price", `$${h.electricityUsdPerKWh.toFixed(3)} per kWh`, "electricityUsdPerKWh"],
      ...(h.currentHeat === "electric" ? [] : [[`${f.short[0].toUpperCase() + f.short.slice(1)} price`, `$${h.fuelUsdPerUnit.toFixed(2)} per ${f.unit}`, "fuelUsdPerUnit"]]),
      ["Rebates assumed", money(h.rebatesUsd), "rebatesUsd"],
      ["Installed cost assumed", `$${h.installedUsdPerTon.toLocaleString()} per ton`, "installedUsdPerTon"]
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
    const docs = ["Photo ID and proof you own the home", "Recent electric bill (and gas bill if you use gas) with account numbers", "Recent bill or delivery receipt for oil, propane or other fuel", "Photos of your current furnace or boiler, its nameplate, and your electrical panel", "Home age, floor plan or square footage, and notes on rooms that are too hot or cold", "Any past energy audit, insulation or air-sealing invoices", "Income documents, if you may qualify for income-based rebates", ...rb.paperwork.filter(p => !/income/i.test(p))];
    const progs = rb.programs.map(p => `<tr><td><b>${esc(p.name)}</b><br><span style="font-size:9pt">${esc(p.level)}</span></td><td>${stat(p.status)}</td><td>${esc(p.amount)}${p.url ? `<br><span style="font-size:8.5pt;color:#555">${esc(p.url)}</span>` : ""}</td></tr>`).join("");

    $("report").innerHTML = `
      <header><p style="font-weight:700;color:#3E5A33">Heat pump request sheet · for your installer</p>
        <h1>${esc(r.full)}</h1>
        <p>Prepared ${esc(date)} with the Heat Pump Guide (prototype). ${Object.keys(ov).length ? `${Object.keys(ov).length} detail${Object.keys(ov).length > 1 ? "s" : ""} entered by the homeowner; the rest are typical values for the area.` : "All home details are typical values for the area; the homeowner has not yet entered their own."}</p></header>

      <div class="warn"><b>This is an estimate, not a Manual J.</b> The numbers come from a simplified model with placeholder inputs and rules of thumb. They are a starting point for a conversation. A licensed installer must measure the home and run a proper load calculation (ACCA Manual J) and system design (Manual S/D) before choosing equipment.${out.isPlaceholder ? " The team's full model is not plugged in yet, so figures are rough." : ""}${out.v1 ? " Minneapolis figures come from the team's model v1, which is not exactly the final model: it simulates one fixed typical house (so the details above did not change its numbers), and its installed cost, rebate, time-of-use rate, AC credit and grid carbon inputs are placeholders." : ""}</div>

      <section><h2>1. What I'm asking for</h2>
        ${out.v1 ? `<p style="margin-bottom:4pt"><b>Carbon dial:</b> ${dollars(dialLam)} per tonne of CO₂ (how much I value cutting emissions).${keepNote ? ` At that setting the model says keeping the gas furnace is cheapest overall; the request below is the model's best heat pump option, for if I decide to go ahead anyway.` : ""}</p>` : ""}
        <div class="grid2">
          <div class="box"><div class="big">${out.sizeTons}-ton cold-climate air-source heat pump</div>
            <p>Please quote ${lo} to ${hi} tons. About ${roundTo(out.sizeTons * TON_BTUH, 1000).toLocaleString()} BTU/h nominal.</p>
            ${capBtuh != null ? `<p>Rated heating output near 5 °F: about ${roundTo(capBtuh, 500).toLocaleString()} BTU/h (${out.capacityKwAt5F.toFixed(1)} kW).</p>` : "<p>Ask the installer for the rated output at 5 °F and at the design temperature.</p>"}</div>
          <div class="box"><div class="big">About ${roundTo(loadBtuh, 1000).toLocaleString()} BTU/h</div>
            <p>Estimated heating load on the coldest design night (${degF(r.designTempF)}), ${out.designLoadKw.toFixed(1)} kW.</p>
            <p>Estimated to cover about ${pct(a.heatPump.heatPumpShare)} of yearly heating with the heat pump alone.</p></div>
        </div>
        <p style="margin-top:6pt"><b>Backup / supplemental heat:</b> ${esc(backupLine)}</p>
        ${!out.v1 && out.sizeTons !== out.recommendedSizeTons ? `<p>(The size picker was set to ${out.sizeTons} tons; for the chosen cost-vs-carbon priority we'd suggest ${out.recommendedSizeTons} tons.)</p>` : ""}
      </section>

      <section><h2>2. Location and climate</h2>
        <table><tbody>
          <tr><td>Location</td><td>${esc(r.full)}</td></tr>
          <tr><td>Winter design temperature (99%)</td><td>${degF(r.designTempF)} <span class="tg">${r.dataStatus === "data.zip" ? "from ASHRAE data" : "placeholder, confirm locally"}</span></td></tr>
          <tr><td>Coldest month average</td><td>${degF(Math.min(...r.monthlyMeanF))}</td></tr>
          <tr><td>Grid electricity</td><td>${esc(r.gridNote)} (~${r.gridKgCo2PerKWh} kg CO₂ per kWh)</td></tr>
        </tbody></table></section>

      <section><h2>3. Home details I entered or assumed</h2>
        <table><thead><tr><th>Detail</th><th>Value</th><th>Source</th></tr></thead><tbody>
        ${rows.map(([k, v, key]) => `<tr><td>${k}</td><td>${esc(v)}</td><td>${tag(key)}</td></tr>`).join("")}
        </tbody></table>
        <p style="font-size:9.5pt;margin-top:3pt">Please correct anything that's wrong; "typical" values are guesses for a home like mine.</p></section>

      <section><h2>4. Rebates I may qualify for</h2>
        <table><thead><tr><th>Program</th><th>Status</th><th>What it pays / where</th></tr></thead><tbody>${progs}</tbody></table>
        <p style="margin-top:4pt"><b>Assumed in the numbers below:</b> ${money(h.rebatesUsd)} total. <b>Verify every figure with the program before signing.</b></p>
        <p><b>Paperwork to bring or ask the installer about:</b></p>
        <ul>${rb.paperwork.map(p => `<li>${esc(p)}</li>`).join("")}</ul></section>

      <section><h2>5. Cost and CO₂ summary</h2>
        <table><thead><tr><th></th><th>Without rebates</th><th>With rebates</th></tr></thead><tbody>
          <tr><td>Installed price (${out.sizeTons} tons)</td><td>${money(wo.upfront.installedUsd)}</td><td>${money(w.upfront.installedUsd)}</td></tr>
          <tr><td>Rebates</td><td>$0</td><td>−${money(w.upfront.rebatesUsd)}</td></tr>
          <tr><td>Upfront cost after rebates</td><td>${money(wo.upfront.netUsd)}</td><td>${money(w.upfront.netUsd)}</td></tr>
          <tr><td>Break-even</td><td>${pay(wo)}</td><td>${pay(w)}</td></tr>
          <tr><td>Total cost over ${life} years</td><td>${money(wo.lifetime.costUsd)}</td><td>${money(w.lifetime.costUsd)}</td></tr>
          <tr><td>Yearly heating bill: today → heat pump</td><td colspan="2">${money(a.today.costUsd)} → ${money(a.heatPump.costUsd)}</td></tr>
          <tr><td>Yearly heating CO₂: today → heat pump</td><td colspan="2">${tonnes(a.today.co2Kg)} → ${tonnes(a.heatPump.co2Kg)} (${cut >= 0 ? "cut of" : "increase of"} ${tonnes(cut)})</td></tr>
        </tbody></table></section>

      <section><h2>6. Questions to ask the installer</h2><ol>${questions.map(q => `<li>${esc(q)}</li>`).join("")}</ol></section>

      <section><h2>7. Documents to have ready</h2><ul class="cb">${docs.map(d => `<li>${esc(d)}</li>`).join("")}</ul></section>

      <p class="foot">Estimate only; not a Manual J, an engineering design, a quote or financial advice. Prices, rebates and climate values are placeholders or snapshots from ${RB.asOf} and may be out of date. Model: ${esc(out.modelVersion)}${out.isPlaceholder ? " (placeholder)" : ""}${out.v1 ? "; v1, not exactly the end model but closer to what the team is thinking" : ""}. Generated in your browser; nothing was sent anywhere.</p>`;
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
