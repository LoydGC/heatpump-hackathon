"""Precompute every simulation the slider can ask for -> results/sweep.csv.

Rows: weather x tariff x controller x size x (switchover | lam | CenterPoint flag).
Annual cost / CO2 do not depend on installed cost, rebates or the carbon price
(except smart, which uses lam inside the controller), so economics are applied
later in recommend.py and the slider stays instant.
"""
from pathlib import Path
import numpy as np, pandas as pd
from simulate import simulate, annual, House, Prices
from prices import tou_prices

SIZES = [18, 24, 30, 36, 48, 60]
LAMS = [0, 10, 25, 50, 75, 100, 150, 200, 300, 400, 500, 750, 1000]   # $/t slider steps
T_SW = list(np.arange(-26, 5, 1.0)) + [4.5, 99.0]                      # 99 = heat pump never used
WEATHER = ["tmyx_main", "tmy3_cold"]
TARIFFS = {"flat": Prices(), "tou": Prices(elec_usd_kWh=tou_prices())}

def run(house=House()):
    rows = []
    def add(**kw): rows.append(kw)
    for wx in WEATHER:
        for tn, pr in TARIFFS.items():
            base = dict(weather=wx, tariff=tn)
            a = annual(simulate(None, house=house, prices=pr, weather=wx))
            add(**base, controller="gas", size=0, t_sw=np.nan, lam=np.nan, cp_ok=False, **a)
            for s in SIZES:
                a = annual(simulate(s, "dumb", house, pr, wx))
                add(**base, controller="dumb", size=s, t_sw=np.nan, lam=np.nan, cp_ok=True, **a)
                for t in T_SW:
                    a = annual(simulate(s, "switch", house, pr, wx, t_switch=t))
                    add(**base, controller="fixed", size=s, t_sw=t, lam=np.nan, cp_ok=(t <= 4.5), **a)
                for lam in LAMS:
                    for force in (None, 4.5):
                        a = annual(simulate(s, "smart", house, pr, wx, lam=lam, hp_force_above_C=force))
                        add(**base, controller="smart", size=s, t_sw=np.nan, lam=lam, cp_ok=(force is not None), **a)
    return pd.DataFrame(rows)

if __name__ == "__main__":
    out = Path(__file__).resolve().parent / "results" / "sweep.csv"; out.parent.mkdir(exist_ok=True)
    df = run(); df.to_csv(out, index=False); print(len(df), "rows ->", out)
