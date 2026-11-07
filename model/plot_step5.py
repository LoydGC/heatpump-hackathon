"""Step 5 exhibits (flat tariff, TMYx main, 15 kW home):
 (b) monthly baseline vs new cost / CO2 with shaded difference
 (c) load-duration curve with heat pump capacity lines
 (d) implied $/tonne of each size step
Example config: lam = $500/t, 30 kBtu/h, smart controller, CenterPoint rule on."""
import numpy as np, pandas as pd
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
from simulate import simulate, annual, House, Prices
from heatpump import HeatPump
from data import load_hp_curves, load_weather
import recommend as R

LAM, SIZE = 500, 30
house = House()
base = simulate(None, house=house)
new = simulate(SIZE, "smart", house, lam=LAM, hp_force_above_C=4.5)
MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

# ---------- (b) monthly bars ----------
mb = base.groupby("month")[["cost_usd", "co2_kg"]].sum(); mn = new.groupby("month")[["cost_usd", "co2_kg"]].sum()
fig, axs = plt.subplots(1, 2, figsize=(11, 4.2))
for ax, col, scale, unit, title in [(axs[0], "cost_usd", 1, "$ per month", "Energy cost"), (axs[1], "co2_kg", 1, "kg CO2 per month", "CO2")]:
    b, n = mb[col].to_numpy(), mn[col].to_numpy(); x = np.arange(12)
    common = np.minimum(b, n); diff = b - n
    ax.bar(x - 0.2, b, 0.38, color="0.75", label="Gas furnace only")
    ax.bar(x + 0.2, common, 0.38, color="tab:blue", label=f"{SIZE} kBtu/h hybrid (smart)")
    ax.bar(x + 0.2, np.where(diff > 0, diff, 0), 0.38, bottom=common, color="tab:green", alpha=.6, hatch="//", label="Saved vs gas-only")
    ax.bar(x + 0.2, np.where(diff < 0, -diff, 0), 0.38, bottom=common, color="tab:red", alpha=.6, hatch="//", label="Extra vs gas-only")
    ax.set_xticks(x); ax.set_xticklabels(MON, fontsize=8); ax.set_ylabel(unit); ax.set_title(title); ax.grid(axis="y", alpha=.3)
axs[0].legend(fontsize=7, loc="upper center")
fig.suptitle(f"Minneapolis, 15 kW home, flat rates, carbon price ${LAM}/t: annual cost "
             f"${base.cost_usd.sum():,.0f} -> ${new.cost_usd.sum():,.0f}, CO2 {base.co2_kg.sum()/1000:.2f} -> {new.co2_kg.sum()/1000:.2f} t", fontsize=10)
fig.tight_layout(); fig.savefig("step5b_monthly.png", dpi=150)

# ---------- (c) load-duration curve with capacity lines ----------
T = load_weather("tmyx_main")["drybulb_C"].to_numpy()
order = np.argsort(T)                       # coldest hour first => highest load first
Ts = T[order]; load = house.UA * np.clip(house.t_balance_C - Ts, 0, None); hrs = np.arange(1, 8761)
fig, ax = plt.subplots(figsize=(8, 4.8))
ax.fill_between(hrs, load, color="0.88", label="Heat need (load-duration)")
ax.plot(hrs, load, color="0.4", lw=1)
cur = load_hp_curves()
for s, c in zip([18, 24, 30, 36, 48, 60], plt.cm.viridis(np.linspace(0, .9, 6))):
    ax.plot(hrs, HeatPump(cur, s).cap_max(Ts), color=c, lw=2 if s == SIZE else 1.2, label=f"{s} kBtu/h max output", ls="-" if s == SIZE else "--")
ax.set_xlim(0, 6000); ax.set_ylim(0, 17)
ax.set_xlabel("Hours per year (coldest first)"); ax.set_ylabel("kW of heat")
ax.set_title("Load-duration curve vs heat pump max output (15 kW home, Minneapolis)\nwhere a capacity line is below the grey, gas covers the gap", fontsize=10)
ax.grid(alpha=.3); ax.legend(fontsize=7, ncol=2); fig.tight_layout(); fig.savefig("step5c_load_duration.png", dpi=150)

# ---------- (d) implied $/t of each size step ----------
rows = []
for label, tariff, credit in [("Flat rates", "flat", 0), ("TOU + $4k AC credit", "tou", 4000)]:
    sw = R._SW[(R._SW.tariff == tariff) & (R._SW.weather == "tmyx_main")]
    d = R.economics(sw[(sw.controller == "gas") | ((sw.controller == "smart") & (sw.lam == LAM))], LAM, credit)
    g = d[d.controller == "gas"].iloc[0]
    for s in [18, 24, 30, 36, 48, 60]:
        r = d[d["size"] == s].sort_values("objective").iloc[0]
        t_saved = g.life_co2 - r.life_co2
        rows.append(dict(scenario=label, size=s, extra_cost=r.life_cost - g.life_cost, t_saved=t_saved,
                         avg_usd_per_t=(r.life_cost - g.life_cost) / t_saved if t_saved > 0 else np.nan))
D = pd.DataFrame(rows)
# incremental $/t between consecutive "efficient" sizes (each must save more tonnes than the previous efficient one)
inc = []
for sc, g in D.groupby("scenario", sort=False):
    prev = dict(extra_cost=0.0, t_saved=0.0, size=0); 
    for _, r in g.iterrows():
        if r.t_saved > prev["t_saved"] + 1e-9 and r.extra_cost > prev["extra_cost"]:
            inc.append(dict(scenario=sc, size=r["size"], inc=(r.extra_cost - prev["extra_cost"]) / (r.t_saved - prev["t_saved"]))); prev = r
        elif r.t_saved > prev["t_saved"] + 1e-9:
            prev = r
D.to_csv("results/step5_size_steps.csv", index=False); pd.DataFrame(inc).to_csv("results/step5_incremental.csv", index=False)
fig, axs = plt.subplots(1, 2, figsize=(10.5, 4.3), sharey=True)
for ax, (sc, g) in zip(axs, D.groupby("scenario", sort=False)):
    x = np.arange(len(g)); ax.bar(x, g.avg_usd_per_t.fillna(0), color="tab:blue", label="Average vs gas-only")
    for xi, (_, r) in zip(x, g.iterrows()):
        txt = "saves\nless CO2" if np.isnan(r.avg_usd_per_t) else f"${r.avg_usd_per_t:,.0f}"
        ax.annotate(txt, (xi, 0 if np.isnan(r.avg_usd_per_t) else r.avg_usd_per_t), ha="center", xytext=(0, 3), textcoords="offset points", fontsize=8)
    ii = pd.DataFrame(inc); ii = ii[ii.scenario == sc]
    for _, r in ii.iterrows():
        xi = list(g["size"]).index(r["size"]); ax.plot(xi, r.inc, "D", color="tab:red", label="Incremental step" if r["size"] == ii["size"].iloc[0] else None)
    ax.set_xticks(x); ax.set_xticklabels([f"{int(s)}" for s in g["size"]]); ax.set_xlabel("Heat pump size (kBtu/h)")
    ax.set_title(sc, fontsize=10); ax.set_yscale("log"); ax.grid(axis="y", alpha=.3); ax.axhline(190, color="k", ls=":", lw=1)
    ax.annotate("~$190/t (EPA 2023\nSC-CO2 est., verify)", (len(g) - 0.5, 190), ha="right", va="bottom", fontsize=7)
axs[0].set_ylabel("15-year $ per tonne CO2 avoided (log)"); axs[0].legend(fontsize=7, loc="upper left")
fig.suptitle(f"Implied cost of carbon avoided, smart controller, λ=${LAM}/t, 15 kW home", fontsize=10)
fig.tight_layout(); fig.savefig("step5d_usd_per_tonne.png", dpi=150)

print("MONTHLY (cost $, base -> new | CO2 kg, base -> new)")
for m in range(1, 13):
    print(f"{MON[m-1]}: ${mb.cost_usd[m]:6.0f} -> ${mn.cost_usd[m]:6.0f} | {mb.co2_kg[m]:6.0f} -> {mn.co2_kg[m]:6.0f}")
print(D.round(1).to_string(index=False)); print(pd.DataFrame(inc).round(0).to_string(index=False))
