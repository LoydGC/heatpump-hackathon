"""Step 3: smart rule vs best FIXED switchover, flat prices, annual operating objective
   obj = annual cost + lam * annual tonnes CO2   (installed cost not included yet)."""
import numpy as np, pandas as pd
from simulate import *
pd.set_option("display.width", 200)
SIZES = [18, 24, 30, 36, 48, 60]; LAMS = [0, 25, 50, 100, 200, 500]
T_SW = list(np.arange(-26, 5, 1.0)) + [4.5, 99.0]        # 99 = never use the heat pump

def obj(a, lam): return a["cost"] + lam * a["co2_t"]

def best_fixed(size, lam, house, wx, force=None):
    best = None
    for t in T_SW:
        if force is not None and t > force: continue     # CenterPoint: switchover <= 4.5 C
        a = annual(simulate(size, "switch", house, weather=wx, t_switch=t))
        if best is None or obj(a, lam) < obj(best, lam): best = dict(a, t_sw=t)
    return best

def run(house=House(), wx="tmyx_main", force=None):
    rows = []
    for lam in LAMS:
        g = annual(simulate(None, house=house, weather=wx))
        for s in SIZES:
            f = best_fixed(s, lam, house, wx, force)
            sm = annual(simulate(s, "smart", house, weather=wx, lam=lam, hp_force_above_C=force))
            rows.append(dict(lam=lam, size=s, gas_obj=obj(g, lam), fix_tsw=f["t_sw"], fix_obj=obj(f, lam),
                fix_cost=f["cost"], fix_co2=f["co2_t"], sm_obj=obj(sm, lam), sm_cost=sm["cost"],
                sm_co2=sm["co2_t"], sm_share=sm["hp_share"], sm_gain=1 - obj(sm, lam) / obj(f, lam)))
    return pd.DataFrame(rows)

if __name__ == "__main__":
    r = run()
    show = r.copy()
    for c in ("gas_obj", "fix_obj", "fix_cost", "sm_obj", "sm_cost"): show[c] = show[c].round(0)
    for c in ("fix_co2", "sm_co2"): show[c] = show[c].round(2)
    show["sm_gain"] = (100 * show.sm_gain).round(1); show["sm_share"] = (100 * show.sm_share).round(0)
    print(show.to_string(index=False))
