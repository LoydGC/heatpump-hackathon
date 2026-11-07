"""Electricity price scenarios (hourly arrays, 8,760)."""
import numpy as np
from data import load_inputs, load_grid

def tou_prices():
    """Xcel-style winter TOU from the JSON. ASSUMPTION (verify vs rate book A72/A74):
    weekday 15-20h peak, 0-6h off-peak, otherwise base. Applied all year (heating
    season is what matters). Weekday from the 2025 calendar (grid file's year)."""
    t = load_inputs()["electricity"]["tou_scenario_usd_per_kWh"]
    lt = load_grid()["local_time"]
    hr, wd = lt.dt.hour.to_numpy(), lt.dt.weekday.to_numpy()
    p = np.full(8760, t["base"])
    p[hr < 6] = t["offpeak_0_6h"]
    p[(hr >= 15) & (hr < 20) & (wd < 5)] = t["peak_weekday_15_20h"]
    return p
