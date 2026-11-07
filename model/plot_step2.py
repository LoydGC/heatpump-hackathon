"""Step 2 chart: annual cost vs CO2 by size, dumb vs fixed -12C switchover."""
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
from simulate import *
h = House(design_load_kW=15)
b = annual(simulate(None, house=h))
fig, ax = plt.subplots(figsize=(7.5, 5))
for ctrl, kw, c, lab in [("dumb", {}, "tab:red", "Dumb: run to capacity"),
                         ("switch", {"t_switch": -12}, "tab:blue", "Fixed switchover at -12 °C")]:
    pts = [annual(simulate(s, ctrl, h, **kw)) for s in (18, 24, 30, 36, 48, 60)]
    ax.plot([p["co2_t"] for p in pts], [p["cost"] for p in pts], "o-", color=c, label=lab)
    for s, p in zip((18, 24, 30, 36, 48, 60), pts):
        ax.annotate(str(s), (p["co2_t"], p["cost"]), textcoords="offset points", xytext=(5, 4), fontsize=8, color=c)
ax.plot(b["co2_t"], b["cost"], "k*", ms=14, label="Gas furnace only")
ax.set_xlabel("Annual CO2 (t)"); ax.set_ylabel("Annual energy cost ($)")
ax.set_title("Minneapolis, 15 kW home, flat rates (labels = kBtu/h)")
ax.legend(); ax.grid(alpha=.3); fig.tight_layout(); fig.savefig("step2_cost_vs_co2.png", dpi=150)
