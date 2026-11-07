"""Exhibit (a): lifetime cost vs lifetime CO2 trade-off, fixed switchover vs smart (flat tariff)."""
import numpy as np, pandas as pd
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
import recommend as R

def pareto(d):
    d = d.sort_values(["life_co2", "plain"]); best = np.inf; keep = []
    for i, r in d.iterrows():
        if r.plain < best - 1e-9: keep.append(i); best = r.plain
    return d.loc[keep]

sw = R._SW[(R._SW.tariff == "flat") & (R._SW.weather == "tmyx_main")]
def prep(df):
    d = R.economics(df, 0.0); d["plain"] = d.life_cost; return d      # lam=0 -> plain lifetime $
fixed = prep(sw[sw.controller.isin(["gas", "fixed"])])
smart = prep(sw[sw.controller.isin(["gas", "smart"])])
dumb  = prep(sw[sw.controller == "dumb"])
gas = fixed[fixed.controller == "gas"].iloc[0]

fig, ax = plt.subplots(figsize=(8, 5.2))
for s in sorted(fixed["size"].unique()):
    if s == 0: continue
    f = fixed[(fixed["size"] == s) & (fixed.t_sw < 90)].sort_values("t_sw")   # switchover -26 .. 4.5 C
    ax.plot(f.life_co2, f.life_cost, color="0.8", lw=1, zorder=1)
    ax.annotate(f"{int(s)}", (f.life_co2.iloc[0], f.life_cost.iloc[0]), textcoords="offset points", xytext=(-14, -3), fontsize=8, color="0.45")
for d, c, lab in [(fixed, "tab:blue", "Best fixed switchover"), (smart, "tab:orange", "Smart (hourly)")]:
    p = pareto(d)
    ax.plot(p.life_co2, p.life_cost, "o-", color=c, lw=2, ms=5, label=lab, zorder=3)
ax.scatter(dumb.life_co2, dumb.life_cost, marker="x", color="tab:red", zorder=2, label="Dumb (run to capacity)")
for _, r in dumb.iterrows(): ax.annotate(f"{int(r['size'])}", (r.life_co2, r.life_cost), textcoords="offset points", xytext=(4, 3), fontsize=7, color="tab:red")
ax.plot(gas.life_co2, gas.life_cost, "k*", ms=14, label="Gas furnace only")
ax.set_xlabel("15-year CO2 (tonnes)"); ax.set_ylabel("15-year cost: install - rebates + energy ($)")
ax.set_title("Minneapolis, 15 kW home, flat rates: cost vs CO2 trade-off\n(grey curves: each size as the switchover temperature varies; labeled by kBtu/h at the -26 C end)", fontsize=10)
ax.grid(alpha=.3); ax.legend(fontsize=8); fig.tight_layout(); fig.savefig("step4_tradeoff.png", dpi=150)
