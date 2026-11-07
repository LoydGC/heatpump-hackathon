"""Recommendation logic behind the slider.

recommend(lam, smart, ...) -> best size / switchover / economics for a carbon
price lam ($/t CO2). Minimizes
    lifetime cost + lam * lifetime CO2
    lifetime cost = installed - rebates - credit + N * annual energy cost
over {gas-only, 6 sizes} x controller settings (precomputed in sweep.csv).
"""
from pathlib import Path
import numpy as np, pandas as pd
from data import load_inputs
_RB = load_inputs()["rebates_usd"]

# ---- ASSUMPTIONS (expose in the app) --------------------------------------
INSTALL_FIXED = 5286.0        # $ fixed part of installed cost. PLACEHOLDER: fitted so 18 kBtu/h = $8.5k,
INSTALL_PER_KBTUH = 178.6     # 60 kBtu/h = $16k (cold-climate ducted MN range in the brief)
LIFETIME_YEARS = 15
DISCOUNT = 0.0                # optional 3-5%; 0 = simple 15 x annual
XCEL = _RB["xcel_ccashp_ducted_combo_gas"]; CENTERPOINT = _RB["centerpoint_hybrid_with_furnace"]
# ----------------------------------------------------------------------------
_SW = pd.read_csv(Path(__file__).resolve().parent / "results" / "sweep.csv")

def installed(size): return 0.0 if size == 0 else INSTALL_FIXED + INSTALL_PER_KBTUH * size
def _annuity(): return LIFETIME_YEARS if DISCOUNT == 0 else (1 - (1 + DISCOUNT) ** -LIFETIME_YEARS) / DISCOUNT

def economics(df, lam, credit=0.0, use_rebates=True):
    d = df.copy()
    reb = np.where(d["size"] == 0, 0.0, (XCEL if use_rebates else 0) + np.where(d.cp_ok, CENTERPOINT if use_rebates else 0, 0))
    d["up_front"] = d["size"].map(installed) - reb - np.where(d["size"] == 0, 0, credit)
    d["life_cost"] = d.up_front + _annuity() * d.cost
    d["life_co2"] = LIFETIME_YEARS * d.co2_t
    d["objective"] = d.life_cost + lam * d.life_co2
    return d

def recommend(lam, smart, tariff="flat", weather="tmyx_main", credit=0.0, use_rebates=True):
    sw = _SW[(_SW.tariff == tariff) & (_SW.weather == weather)]
    if smart:   # smart controller: uses the same lam internally; take the sweep row for this lam
        cand = sw[(sw.controller == "gas") | ((sw.controller == "smart") & (sw.lam == lam))]
    else:       # non-smart: installer picks a fixed switchover (or runs dumb)
        cand = sw[sw.controller.isin(["gas", "fixed", "dumb"])]
    d = economics(cand, lam, credit, use_rebates)
    best = d.loc[d.objective.idxmin()]
    gas = d[d.controller == "gas"].iloc[0]
    saved_t = gas.life_co2 - best.life_co2
    annual_sav = gas.cost - best.cost
    payback = best.up_front / annual_sav if (best["size"] > 0 and annual_sav > 0) else np.nan
    return dict(lam=lam, smart=smart, size_kbtuh=int(best["size"]), controller=best.controller,
                switchover_C=None if np.isnan(best.t_sw) else float(best.t_sw), centerpoint_rule=bool(best.cp_ok and best["size"] > 0),
                annual_cost=round(best.cost), annual_co2_t=round(best.co2_t, 2), hp_share=round(best.hp_share, 3),
                peak_kW=round(best.peak_elec_kW, 1), up_front=round(best.up_front),
                lifetime_cost=round(best.life_cost), tonnes_saved_15y=round(saved_t, 1),
                payback_years=None if np.isnan(payback) else round(payback, 1),
                usd_per_tonne=None if saved_t <= 0.05 else round((best.life_cost - gas.life_cost) / saved_t))
