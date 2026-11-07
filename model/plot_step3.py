"""Step 3 chart: how much does the hourly smart rule beat the BEST fixed switchover?"""
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
from step3 import *
from prices import tou_prices
LAMS_ = [0, 25, 50, 100, 200, 500]
def gain(size, lam, pr):
    f = min((annual(simulate(size, "switch", House(), pr, t_switch=t)) for t in T_SW), key=lambda a: obj(a, lam))
    sm = annual(simulate(size, "smart", House(), pr, lam=lam))
    return 100 * (1 - obj(sm, lam) / obj(f, lam))
fig, ax = plt.subplots(figsize=(7.5, 4.8))
for name, pr, ls in [("Flat 16.4 c/kWh", Prices(), "--"), ("TOU scenario (assumed)", Prices(elec_usd_kWh=tou_prices()), "-")]:
    for s, c in [(30, "tab:blue"), (48, "tab:orange")]:
        ax.plot(range(len(LAMS_)), [gain(s, l, pr) for l in LAMS_], ls, marker="o", color=c, label=f"{s} kBtu/h, {name}")
ax.set_xticks(range(len(LAMS_))); ax.set_xticklabels([f"${l}" for l in LAMS_])
ax.set_xlabel("Carbon price λ ($/t CO2)"); ax.set_ylabel("Smart rule gain over best fixed switchover (%)")
ax.set_title("Smart vs best fixed switchover (annual cost + λ·CO2), 15 kW home")
ax.grid(alpha=.3); ax.legend(fontsize=8); fig.tight_layout(); fig.savefig("step3_smart_gain.png", dpi=150)
