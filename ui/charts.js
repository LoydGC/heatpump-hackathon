// Small dependency-free SVG line charts with a crosshair tooltip.
// One y-axis per chart. Series identity: color + legend + direct end labels.
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const el = (t, a, parent) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); if (parent) parent.appendChild(e); return e; };
  function niceStep(raw) { const p = Math.pow(10, Math.floor(Math.log10(raw || 1))); const f = raw / p; return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * p; }

  /**
   * lineChart(host, opts)
   * opts: { labels:[...], series:[{name, color, values:[...], dash?}], fmt:(v)=>string,
   *         tipLabel?:(i)=>string, marker?:{index, text}, highlight?:index, height?, ariaLabel, xEvery? }
   */
  function lineChart(host, o) {
    host.innerHTML = "";
    host.classList.add("chart-host");
    const W = 640, H = o.height || 280, m = { l: 62, r: 96, t: 14, b: 30 };
    const iw = W - m.l - m.r, ih = H - m.t - m.b, n = o.labels.length;
    const all = o.series.flatMap(s => s.values);
    const lo = Math.min(0, ...all), max = Math.max(...all, 1);
    const step = niceStep((max - lo) / 4), top = Math.ceil(max / step) * step, bot = Math.floor(lo / step) * step;
    const x = i => m.l + iw * (n === 1 ? 0.5 : i / (n - 1));
    const y = v => m.t + ih * (1 - (v - bot) / (top - bot));
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "chart", role: "img", "aria-label": o.ariaLabel || "" }, host);
    for (let v = bot; v <= top + 1e-9; v += step) {
      el("line", { x1: m.l, x2: m.l + iw, y1: y(v), y2: y(v), stroke: v === 0 ? "var(--axis)" : "var(--grid)", "stroke-width": 1 }, svg);
      const t = el("text", { x: m.l - 8, y: y(v) + 4, "text-anchor": "end", class: "tick" }, svg); t.textContent = o.fmt(v);
    }
    const every = o.xEvery || (n > 12 ? Math.ceil(n / 8) : 1);
    o.labels.forEach((l, i) => { if (i % every && i !== n - 1) return; const t = el("text", { x: x(i), y: H - 8, "text-anchor": "middle", class: "tick" }, svg); t.textContent = l; });

    if (o.marker) {
      const mx = x(o.marker.index);
      el("line", { x1: mx, x2: mx, y1: m.t, y2: m.t + ih, stroke: "var(--muted)", "stroke-dasharray": "3 4", "stroke-width": 1 }, svg);
      const t = el("text", { x: mx + 6, y: m.t + 12, class: "tick marker-label" }, svg); t.textContent = o.marker.text;
    }

    // Lines, then end labels (nudged apart if they collide)
    const ends = [];
    o.series.forEach(s => {
      const d = s.values.map((v, i) => (i ? "L" : "M") + x(i).toFixed(1) + "," + y(v).toFixed(1)).join("");
      el("path", { d, fill: "none", stroke: s.color, "stroke-width": 2, "stroke-linejoin": "round", "stroke-linecap": "round", "stroke-dasharray": s.dash || "" }, svg);
      if (n <= 12) s.values.forEach((v, i) => el("circle", { cx: x(i), cy: y(v), r: 2.5, fill: s.color }, svg));
      ends.push({ s, yy: y(s.values[n - 1]) });
    });
    ends.sort((a, b) => a.yy - b.yy);
    for (let i = 1; i < ends.length; i++) if (ends[i].yy - ends[i - 1].yy < 15) ends[i].yy = ends[i - 1].yy + 15;
    ends.forEach(e => { const t = el("text", { x: m.l + iw + 8, y: e.yy + 4, class: "end-label" }, svg); t.textContent = e.s.name; });

    if (o.highlight != null) {
      o.series.forEach(s => el("circle", { cx: x(o.highlight), cy: y(s.values[o.highlight]), r: 6, fill: s.color, stroke: "var(--panel)", "stroke-width": 2 }, svg));
    }

    // Hover layer: crosshair + tooltip
    const cross = el("line", { y1: m.t, y2: m.t + ih, stroke: "var(--ink)", "stroke-width": 1, opacity: 0 }, svg);
    const dots = o.series.map(s => el("circle", { r: 5, fill: s.color, stroke: "var(--panel)", "stroke-width": 2, opacity: 0 }, svg));
    const tip = document.createElement("div"); tip.className = "tip"; tip.hidden = true; host.appendChild(tip);
    const hit = el("rect", { x: m.l - 10, y: m.t, width: iw + 20, height: ih, fill: "transparent" }, svg);
    function show(i) {
      cross.setAttribute("x1", x(i)); cross.setAttribute("x2", x(i)); cross.setAttribute("opacity", 0.35);
      dots.forEach((d, k) => { d.setAttribute("cx", x(i)); d.setAttribute("cy", y(o.series[k].values[i])); d.setAttribute("opacity", 1); });
      tip.innerHTML = `<b>${o.tipLabel ? o.tipLabel(i) : o.labels[i]}</b>` + o.series.map(s =>
        `<div><i style="background:${s.color}"></i>${s.name}<span>${o.fmt(s.values[i], true)}</span></div>`).join("");
      tip.hidden = false;
      const r = svg.getBoundingClientRect(), px = x(i) / W * r.width;
      tip.style.left = Math.min(Math.max(px - tip.offsetWidth / 2, 0), r.width - tip.offsetWidth) + "px";
      tip.style.top = (m.t / H * r.height) + "px";
    }
    function hide() { cross.setAttribute("opacity", 0); dots.forEach(d => d.setAttribute("opacity", 0)); tip.hidden = true; }
    hit.addEventListener("pointermove", ev => {
      const r = svg.getBoundingClientRect(); const vx = (ev.clientX - r.left) / r.width * W;
      show(Math.max(0, Math.min(n - 1, Math.round((vx - m.l) / iw * (n - 1)))));
    });
    hit.addEventListener("pointerleave", hide);
    svg.setAttribute("tabindex", "0");
    let ki = -1;
    svg.addEventListener("keydown", ev => {
      if (ev.key === "ArrowRight" || ev.key === "ArrowLeft") { ki = Math.max(0, Math.min(n - 1, ki + (ev.key === "ArrowRight" ? 1 : -1))); show(ki); ev.preventDefault(); }
      if (ev.key === "Escape") hide();
    });
    svg.addEventListener("blur", hide);
  }

  window.HPCharts = { lineChart };
})();
