"""Step 6: does pre-heating (thermal mass + look-ahead) change cost, CO2, peak, or the best size?"""
import numpy as np, pandas as pd
from simulate import simulate, annual, House, Prices
from preheat import simulate_preheat
from prices import tou_prices
import recommend as R

SIZES = [18, 24, 30, 36, 48, 60]; LAMS = [0, 100, 200, 500, 1000]
TAR = {"flat": Prices(), "tou": Prices(elec_usd_kWh=tou_prices())}

def rows(C=10.0, band=(19.0, 22.0), sizes=SIZES, lams=LAMS, tariffs=("flat", "tou"), weather="tmyx_main"):
    out = []
    for tn in tariffs:
        pr = TAR[tn]
        for lam in lams:
            for s in sizes:
                sw = R._SW[(R._SW.tariff == tn) & (R._SW.weather == weather) & (R._SW["size"] == s)]
                fx = sw[sw.controller == "fixed"]; fx = fx[fx.cp_ok]
                fx = fx.loc[(fx.cost + lam * fx.co2_t).idxmin()]
                sm = sw[(sw.controller == "smart") & (sw.lam == lam) & sw.cp_ok].iloc[0]
                df = simulate_preheat(s, House(), pr, weather, lam, C, band, cp_rule=True); ph = annual(df)
                for name, a in [("fixed", fx), ("smart", sm), ("preheat", ph)]:
                    out.append(dict(tariff=tn, lam=lam, size=s, controller=name, cost=a["cost"], co2_t=a["co2_t"],
                                    hp_share=a["hp_share"], peak_kW=a["peak_elec_kW"], cp_ok=True,
                                    viol_h=df.attrs["comfort_violations_h"] if name == "preheat" else 0, t_sw=np.nan))
    return pd.DataFrame(out)

if __name__ == "__main__":
    D = rows(); D.to_csv("results/step6_preheat.csv", index=False)
    D["op_obj"] = D.cost + D.lam * D.co2_t
    pv = D.pivot_table(index=["tariff", "lam", "size"], columns="controller", values=["op_obj", "cost", "co2_t", "peak_kW"])
    # (1) operating-objective gain of preheat over smart, and over best fixed
    g = pd.DataFrame({"gain_vs_smart_%": 100 * (1 - pv["op_obj"]["preheat"] / pv["op_obj"]["smart"]),
                      "gain_vs_fixed_%": 100 * (1 - pv["op_obj"]["preheat"] / pv["op_obj"]["fixed"]),
                      "cost_smart": pv["cost"]["smart"], "cost_pre": pv["cost"]["preheat"],
                      "co2_smart": pv["co2_t"]["smart"], "co2_pre": pv["co2_t"]["preheat"],
                      "peak_smart": pv["peak_kW"]["smart"], "peak_pre": pv["peak_kW"]["preheat"]}).round(2)
    print("== size 30 and 48, annual operating objective gain of pre-heat (violations in comfort band: ",
          int(D[D.controller == 'preheat'].viol_h.sum()), "h total) ==")
    print(g.loc[(slice(None), slice(None), [30, 48]), :].to_string())
    # (2) best size by LIFETIME objective for each controller
    print("\n== best size by lifetime objective (rebates on, no AC credit) ==")
    res = []
    for (tn, lam), grp in D.groupby(["tariff", "lam"]):
        for ctrl in ("fixed", "smart", "preheat"):
            c = grp[grp.controller == ctrl].copy(); c["size"] = c["size"].astype(int)
            e = R.economics(c, lam); gasrow = R.economics(R._SW[(R._SW.tariff == tn) & (R._SW.weather == "tmyx_main") & (R._SW.controller == "gas")], lam).iloc[0]
            b = e.loc[e.objective.idxmin()]
            hp_wins = b.objective < gasrow.objective
            res.append(dict(tariff=tn, lam=lam, controller=ctrl, best_size=int(b["size"]) if hp_wins else 0,
                            life_obj=round(min(b.objective, gasrow.objective)), peak_kW=round(b.peak_kW, 1)))
    print(pd.DataFrame(res).pivot_table(index=["tariff", "lam"], columns="controller", values=["best_size", "life_obj", "peak_kW"]).to_string())
    # (3) thermal mass sensitivity, size 30, TOU
    print("\n== thermal mass sensitivity, size 30, TOU, λ=0 and 500 ==")
    for C in (5, 10, 20, 40):
        for lam in (0, 500):
            r = rows(C=C, sizes=[30], lams=[lam], tariffs=("tou",)); r["op"] = r.cost + r.lam * r.co2_t
            sm = r[r.controller == "smart"].iloc[0]; ph = r[r.controller == "preheat"].iloc[0]
            print(f"C={C:2d} kWh/C λ={lam:3d}: smart ${sm.cost:.0f}/{sm.co2_t:.2f}t -> preheat ${ph.cost:.0f}/{ph.co2_t:.2f}t, gain {100*(1-ph.op/sm.op):.1f}%, peak {sm.peak_kW:.1f}->{ph.peak_kW:.1f} kW")
