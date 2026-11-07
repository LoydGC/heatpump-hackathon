"""Exhibit: what pre-heating does on a cold week (TOU tariff, lam=0, 30 kBtu/h, C=10 kWh/C)."""
import numpy as np, matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
from simulate import simulate, House, Prices
from preheat import simulate_preheat
from prices import tou_prices
pr = Prices(elec_usd_kWh=tou_prices()); h = House()
ph = simulate_preheat(30, h, pr, "tmyx_main", 0.0, 10.0, (19, 22), cp_rule=True)
sm = simulate(30, "smart", h, pr, lam=0.0, hp_force_above_C=4.5)
Tm = ph["T"].to_numpy(); mo = ph["month"].to_numpy()
# first Mon-aligned 96 h window in Nov-Mar with mean outdoor temp between -9 and -3 C (heat pump active, still cold)
a = next(i for i in range(0, 8760 - 96, 24) if mo[i] in (1, 2, 3, 12) and -9 < Tm[i:i + 96].mean() < -3 and (i // 24) % 7 == 0)
b = a + 96; x = np.arange(a, b) - a
p = pr.elec_usd_kWh
fig, axs = plt.subplots(3, 1, figsize=(9, 7.5), sharex=True, gridspec_kw={"height_ratios": [1.1, 1.3, 0.8]})
axs[0].plot(x, ph["T"][a:b], color="tab:blue"); axs[0].set_ylabel("Outdoor °C")
axs[1].axhspan(19, 22, color="0.9"); axs[1].plot(x, ph["T_in"][a:b], color="tab:red", label="Indoor (pre-heat controller)")
axs[1].axhline(20, color="k", ls=":", lw=1, label="Setpoint 20 °C (no pre-heat)"); axs[1].set_ylabel("Indoor °C"); axs[1].legend(fontsize=7, loc="upper right")
axs[2].step(x, sm["q_hp"][a:b], where="post", color="tab:orange", label="Smart, no pre-heat"); axs[2].step(x, ph["q_hp"][a:b], where="post", color="tab:green", label="Smart + pre-heat")
axs[2].set_ylabel("Heat pump kW"); axs[2].legend(fontsize=7, loc="upper right")
for ax in axs:
    for t in range(a, b):                                                   # shade weekday 15-20h peak
        if abs(p[t] - 0.24) < 1e-9: ax.axvspan(t - a, t - a + 1, color="tab:red", alpha=.07, lw=0)
axs[2].set_xlabel("Hours (red bands = TOU peak 3-8 pm, weekdays)")
fig.suptitle("Pre-heating runs the heat pump in the 0-6 am off-peak; the house coasts through the 3-8 pm peak (indoor stays 19-22 °C)", fontsize=10)
fig.tight_layout(); fig.savefig("step6_preheat_week.png", dpi=150)
