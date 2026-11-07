"""Export everything the front end needs as ONE static JSON (results/frontend_data.json).

The slider is a lookup: recommendations[scenario_key][str(lam)] -> result dict.
Scenario key = f"{tariff}|{weather}|credit{credit}|{'smart' if smart else 'standard'}".
Re-run after changing any assumption:   python3 export_frontend.py   (from model/)
"""
import json
from pathlib import Path
import numpy as np
from simulate import simulate, House, Prices
from prices import tou_prices
from heatpump import HeatPump
from data import load_hp_curves, load_weather
import recommend as R
from sweep import LAMS

OUT = Path(__file__).resolve().parent / "results" / "frontend_data.json"
PRICES = {"flat": Prices(), "tou": Prices(elec_usd_kWh=tou_prices())}
TARIFFS, WEATHER, CREDITS = ["flat", "tou"], ["tmyx_main", "tmy3_cold"], [0, 4000]
house = House()

def monthly(rec, tariff, weather):
    """Monthly cost ($) and CO2 (kg): gas-only baseline vs the recommended system."""
    pr = PRICES[tariff]
    base = simulate(None, house=house, prices=pr, weather=weather)
    s, c = rec["size_kbtuh"], rec["controller"]
    if s == 0: new = base
    elif c == "smart": new = simulate(s, "smart", house, pr, weather, lam=rec["lam"], hp_force_above_C=4.5 if rec["centerpoint_rule"] else None)
    elif c == "fixed": new = simulate(s, "switch", house, pr, weather, t_switch=rec["switchover_C"])
    else: new = simulate(s, "dumb", house, pr, weather)
    g = lambda d, col: [round(float(v), 2) for v in d.groupby("month")[col].sum()]
    return dict(base_cost=g(base, "cost_usd"), new_cost=g(new, "cost_usd"), base_co2_kg=g(base, "co2_kg"), new_co2_kg=g(new, "co2_kg"))

def load_duration(weather="tmyx_main", points=120):
    T = load_weather(weather)["drybulb_C"].to_numpy(); Ts = np.sort(T)       # coldest first
    load = house.UA * np.clip(house.t_balance_C - Ts, 0, None)
    idx = np.linspace(0, 8759, points).astype(int); cur = load_hp_curves()
    return dict(hours=[int(i) + 1 for i in idx], load_kW=[round(float(load[i]), 2) for i in idx],
                capacity_kW={str(s): [round(float(HeatPump(cur, s).cap_max(Ts[i])), 2) for i in idx] for s in (18, 24, 30, 36, 48, 60)})

def main():
    recs = {}
    for tariff in TARIFFS:
        for wx in WEATHER:
            for credit in CREDITS:
                for smart in (False, True):
                    key = f"{tariff}|{wx}|credit{credit}|{'smart' if smart else 'standard'}"; recs[key] = {}
                    for lam in LAMS:
                        r = R.recommend(lam, smart, tariff, wx, credit)
                        r["lifetime_co2_t"] = round(r["annual_co2_t"] * R.LIFETIME_YEARS, 1)
                        r["monthly"] = monthly(r, tariff, wx)
                        recs[key][str(lam)] = r
    meta = dict(city="Minneapolis-St. Paul, MN", lambda_grid_usd_per_t=LAMS, lifetime_years=R.LIFETIME_YEARS,
                tariffs=TARIFFS, weather=WEATHER, ac_credit_options_usd=CREDITS, sizes_kbtuh=[18, 24, 30, 36, 48, 60],
                assumptions=dict(design_load_kW=house.design_load_kW, design_temp_C=house.t_design_C, balance_temp_C=house.t_balance_C,
                                 installed_cost_fixed_usd=R.INSTALL_FIXED, installed_cost_per_kBtuh=R.INSTALL_PER_KBTUH,
                                 rebate_xcel_usd=R.XCEL, rebate_centerpoint_usd=R.CENTERPOINT, discount_rate=R.DISCOUNT,
                                 note="PLACEHOLDERS: installed cost curve, house load, TOU rates, AC credit. See README."),
                fields=dict(size_kbtuh="0 = keep gas furnace only", controller="gas|fixed|smart|dumb", switchover_C="fixed controller only",
                            payback_years="null when the heat pump never pays back on energy savings", usd_per_tonne="15-yr extra cost per tonne CO2 avoided vs gas-only"))
    OUT.write_text(json.dumps(dict(meta=meta, recommendations=recs, load_duration=load_duration()), indent=1, default=lambda o: None if o != o else o))
    print("wrote", OUT, f"({OUT.stat().st_size/1e6:.2f} MB, {sum(len(v) for v in recs.values())} recommendations)")

if __name__ == "__main__":
    main()
