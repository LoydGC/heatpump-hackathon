// Wizard: Location -> Climate -> Home -> Results.
// Steps are gated: you can go back to any step you've reached, never forward past it.
(function () {
  const { FUELS, ENVELOPES, REGIONS, matchPlace } = window.HP_DATA;
  const Model = () => window.HeatPumpModel;
  const $ = id => document.getElementById(id);
  const ROUTES = ["where", "climate", "home", "results"];
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
  const blank = () => ({ regionId: null, maxStep: 0, overrides: {}, priority: 0.5, sizeTons: null, usedTypical: true });
  let state = blank();
  try { const s = JSON.parse(sessionStorage.getItem("hp-wizard")); if (s && (s.regionId === null || REGIONS[s.regionId])) state = Object.assign(blank(), s); } catch (e) {}
  const save = () => { try { sessionStorage.setItem("hp-wizard", JSON.stringify(state)); } catch (e) {} };
  let current = 0;

  const region = () => REGIONS[state.regionId];

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
  function modelInputs(sizeTons) {
    const r = region(), h = effective(), f = FUELS[h.currentHeat];
    const fuelPrice = h.currentHeat === "electric" ? h.electricityUsdPerKWh : h.fuelUsdPerUnit;
    const fuelCo2 = h.currentHeat === "electric" ? r.gridKgCo2PerKWh : f.co2;
    return {
      schemaVersion: 1,
      region: { id: r.id, name: r.full, designTempF: r.designTempF, monthlyMeanF: r.monthlyMeanF, monthlySdF: r.monthlySdF, dataStatus: r.dataStatus },
      home: { source: Object.keys(state.overrides).length ? "custom" : "typical", floorAreaSqft: h.floorAreaSqft, envelope: h.envelope,
              heatLossWPerF: h.heatLossWPerF, thermostatF: h.thermostatF, currentHeat: h.currentHeat },
      prices: { electricityUsdPerKWh: h.electricityUsdPerKWh, fuelUsdPerUnit: fuelPrice, fuelUnit: f.unit, timeOfUse: !!h.timeOfUse,
                fuelUsdPerKWhHeat: fuelPrice / (f.kwh * f.eff) },
      emissions: { gridKgCo2PerKWh: r.gridKgCo2PerKWh, fuelKgCo2PerUnit: fuelCo2, fuelKgCo2PerKWhHeat: fuelCo2 / (f.kwh * f.eff) },
      costs: { installedUsdPerTon: h.installedUsdPerTon, rebatesUsd: h.rebatesUsd, lifetimeYears: LIFETIME_YEARS },
      priority: state.priority,
      sizeTons: sizeTons ?? null
    };
  }

  // ---------- Navigation ----------
  function go(i, push = true) {
    i = Math.max(0, Math.min(i, state.maxStep));
    current = i;
    document.querySelectorAll(".step").forEach((s, k) => s.classList.toggle("active", k === i));
    document.querySelectorAll("#steps button").forEach((b, k) => {
      b.disabled = k > state.maxStep;
      b.classList.toggle("done", k < state.maxStep && k !== i);
      if (k === i) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current");
      b.title = k > state.maxStep ? "Finish the earlier steps first" : "";
    });
    if (i === 1) renderClimate();
    if (i === 2) renderHome();
    if (i === 3) renderResults();
    const hash = "#" + ROUTES[i];
    if (location.hash !== hash) { if (push) history.pushState(null, "", hash); else history.replaceState(null, "", hash); }
    const h = $("h" + i); if (h && push) { window.scrollTo({ top: 0 }); h.focus({ preventScroll: true }); }
    save();
  }
  function unlock(i) { state.maxStep = Math.max(state.maxStep, i); }
  const routeIndex = () => Math.max(0, ROUTES.indexOf(location.hash.slice(1)));
  window.addEventListener("popstate", () => go(routeIndex(), false));
  document.querySelectorAll("#steps button").forEach(b => b.addEventListener("click", () => go(+b.dataset.go)));
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
  $("prio").addEventListener("input", e => { state.priority = +e.target.value / 100; state.sizeTons = null; $("prioText").textContent = prioText(+e.target.value); save(); });

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
    $("prio").value = Math.round(state.priority * 100); $("prioText").textContent = prioText(+$("prio").value);
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

  async function renderResults() {
    const r = region(); if (!r) return;
    const h = effective(), f = FUELS[h.currentHeat];
    const out = await Promise.resolve(Model().run(modelInputs(state.sizeTons)));
    const custom = Object.keys(state.overrides).length;
    const backup = h.currentHeat === "electric" ? "electric baseboards" : FUELS[h.currentHeat].short + " system";
    const nowName = "Today (" + f.short + ")";

    $("h3").textContent = custom ? `Your heat pump report for your ${r.name} home` : `Heat pump report for a typical ${r.name} home`;
    $("rSub").textContent = `${h.floorAreaSqft.toLocaleString()} sq ft, ${ENVELOPES[h.envelope].label.toLowerCase()}, heated by ${f.short} today. ` +
      (custom ? `${custom} detail${custom > 1 ? "s" : ""} from you, the rest typical for the area.` : "All details are typical for the area; go back to add yours.");
    $("rBanner").hidden = !out.isPlaceholder;

    const a = out.annual, cut = a.today.co2Kg - a.heatPump.co2Kg, saveYr = a.today.costUsd - a.heatPump.costUsd;
    $("rReco").textContent = `A ${out.sizeTons}-ton cold-climate heat pump`;
    $("rRecoSub").textContent = `It would cover about ${pct(a.heatPump.heatPumpShare)} of your heating, with your ${backup} as backup for the coldest hours.` +
      (out.sizeTons !== out.recommendedSizeTons ? ` For your priorities we'd suggest ${out.recommendedSizeTons} tons.` : "");
    $("rSizes").innerHTML = out.sizes.map(s => `<button data-size="${s.sizeTons}" aria-pressed="${s.sizeTons === out.sizeTons}">${s.sizeTons} t${s.sizeTons === out.recommendedSizeTons ? '<span class="star" aria-label="suggested">★</span>' : ""}</button>`).join("");
    $("rSizes").querySelectorAll("button").forEach(b => b.addEventListener("click", () => { state.sizeTons = +b.dataset.size; save(); renderResults(); }));

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
      ["", "Pays for itself in", out.paybackYears != null && out.paybackYears <= 40 ? out.paybackYears.toFixed(1) + " years" : "Not on bills alone", out.paybackYears != null ? `heat pumps last about ${life} years` : "bills don't drop enough to repay the upfront cost"],
      ["", `Over ${life} years`, (lifeSave >= 0 ? "" : "") + money(Math.abs(lifeSave)), lifeSave >= 0 ? "saved overall, after upfront cost" : "more overall, after upfront cost"]
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

    // Size trade-off
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

    $("rNotes").innerHTML = (out.isPlaceholder ? out.notes : []).concat(
      r.dataStatus === "placeholder" ? [`Climate, prices and grid carbon for ${r.name} are placeholders until the team's data for this region is in.`]
        : [`Climate, prices and grid carbon for ${r.name} come from the team's data pack (TMYx 2011–2025 weather, EIA prices, MISO 2025 grid).`]
    ).map(n => `<li>${n}</li>`).join("");
  }
  $("restart").addEventListener("click", () => { state = blank(); save(); $("place").value = ""; markQuick(); go(0); });

  // ---------- Boot ----------
  if (state.regionId) { $("place").value = region().short; markQuick(); }
  go(routeIndex(), false);
})();
