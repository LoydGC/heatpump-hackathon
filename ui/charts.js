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


  /**
   * tradeoffChart(host, opts): one dot per option, x = lifetime CO2, y = lifetime cost; lower-left is better.
   * opts: { points:[{x, y, label, current?}], xFmt, yFmt, xTitle, yTitle, ariaLabel }
   */
  function tradeoffChart(host, o) {
    host.innerHTML = ""; host.classList.add("chart-host");
    const W = 640, H = 300, m = { l: 70, r: 24, t: 16, b: 52 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
    const pts = o.points.slice().sort((a, b) => a.x - b.x);
    const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
    const pad = (a, b) => { const d = (b - a) || Math.abs(b) * 0.1 || 1; return [a - d * 0.12, b + d * 0.12]; };
    let [x0, x1] = pad(Math.min(...xs), Math.max(...xs)), [y0, y1] = pad(Math.min(...ys), Math.max(...ys));
    const xs_ = niceStep((x1 - x0) / 5), ys_ = niceStep((y1 - y0) / 4);
    x0 = Math.floor(x0 / xs_) * xs_; x1 = Math.ceil(x1 / xs_) * xs_; y0 = Math.floor(y0 / ys_) * ys_; y1 = Math.ceil(y1 / ys_) * ys_;
    const X = v => m.l + iw * (v - x0) / (x1 - x0), Y = v => m.t + ih * (1 - (v - y0) / (y1 - y0));
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "chart", role: "img", "aria-label": o.ariaLabel || "" }, host);
    for (let v = y0; v <= y1 + 1e-9; v += ys_) {
      el("line", { x1: m.l, x2: m.l + iw, y1: Y(v), y2: Y(v), stroke: "var(--grid)", "stroke-width": 1 }, svg);
      el("text", { x: m.l - 8, y: Y(v) + 4, "text-anchor": "end", class: "tick" }, svg).textContent = o.yFmt(v);
    }
    for (let v = x0; v <= x1 + 1e-9; v += xs_) el("text", { x: X(v), y: m.t + ih + 18, "text-anchor": "middle", class: "tick" }, svg).textContent = o.xFmt(v);
    el("line", { x1: m.l, x2: m.l + iw, y1: m.t + ih, y2: m.t + ih, stroke: "var(--axis)" }, svg);
    el("text", { x: m.l + iw / 2, y: H - 6, "text-anchor": "middle", class: "tick" }, svg).textContent = o.xTitle;
    const yt = el("text", { x: 14, y: m.t + ih / 2, "text-anchor": "middle", class: "tick", transform: `rotate(-90 14 ${m.t + ih / 2})` }, svg); yt.textContent = o.yTitle;
    el("polyline", { points: (() => { let lo = Infinity; return pts.filter(p => p.y < lo && (lo = p.y, true)); })().map(p => `${X(p.x)},${Y(p.y)}`).join(" ")  /* line joins only the best options: nothing else is both cheaper and cleaner */, fill: "none", stroke: "var(--c-hp)", "stroke-width": 2, "stroke-linejoin": "round", opacity: 0.6 }, svg);
    // An option is dominated when another one is at least as cheap and at least as clean, and better on one of the two: greyed out.
    const dom = p => pts.some(q => q !== p && q.x <= p.x && q.y <= p.y && (q.x < p.x || q.y < p.y));
    let nDom = 0;
    // dominated options are drawn first so the green circles sit on top where they overlap
    pts.filter(p => !p.current).sort((a, b) => dom(b) - dom(a)).forEach(p => {
      const d = dom(p); if (d) nDom++;
      const g = el("circle", { cx: X(p.x), cy: Y(p.y), r: 5, fill: d ? "#CBC9B8" : "var(--panel)", stroke: d ? "#A9A794" : "var(--c-hp)", "stroke-width": 2, opacity: 1 }, svg);
      g.__pt = p; if (d && p.tip) p.tip.lines = p.tip.lines.concat([["", "Greyed out: another option is cheaper and cleaner"]]);
      if (!p.tip) el("title", {}, g).textContent = d ? p.label + " (greyed out: another option is cheaper and cleaner)" : p.label;
    });
    pts.filter(p => p.current).forEach(p => {
      const g = el("circle", { cx: X(p.x), cy: Y(p.y), r: 8, fill: "var(--accent)", stroke: "var(--panel)", "stroke-width": 2 }, svg);
      g.__pt = p; if (!p.tip) el("title", {}, g).textContent = p.label;
      const left = X(p.x) > m.l + iw * 0.6;
      el("text", { x: X(p.x) + (left ? -14 : 14), y: Y(p.y) - 12, "text-anchor": left ? "end" : "start", class: "end-label" }, svg).textContent = p.label;
    });
    // Hover / focus tooltip with the model details (p.tip = {title, lines:[[k, v]]}); falls back to the native <title>.
    const tip = document.createElement("div"); tip.className = "tip"; tip.hidden = true; host.appendChild(tip);
    svg.querySelectorAll("circle").forEach((c, i) => {
      const p = c.__pt; if (!p || !p.tip) return;
      const show = () => {
        tip.innerHTML = `<b>${p.tip.title}</b>` + p.tip.lines.map(([k, v]) => `<div>${k}<span>${v}</span></div>`).join("");
        tip.hidden = false;
        const hb = host.getBoundingClientRect(), cb = c.getBoundingClientRect();
        let x = cb.right - hb.left + 12, y = cb.top - hb.top + cb.height / 2 - tip.offsetHeight / 2;   // right of the circle, vertically centred
        if (x + tip.offsetWidth > hb.width) x = cb.left - hb.left - tip.offsetWidth - 12;
        tip.style.left = Math.max(0, x) + "px"; tip.style.top = Math.max(0, y) + "px";
      };
      c.setAttribute("tabindex", "0"); c.style.cursor = "pointer";
      c.addEventListener("mouseenter", show); c.addEventListener("focus", show);
      c.addEventListener("mouseleave", () => tip.hidden = true); c.addEventListener("blur", () => tip.hidden = true);
    });
    const lg = document.createElement("div"); lg.className = "legend"; lg.style.marginTop = "6px";
    lg.innerHTML = `<span><i style="border-color:var(--c-hp)"></i>Worth considering</span><span><i style="border-color:#A9A794"></i>Greyed out (${nDom}): another option is both cheaper and cleaner</span>`;
    host.appendChild(lg);
  }

  window.HPCharts = { lineChart, tradeoffChart };
})();
