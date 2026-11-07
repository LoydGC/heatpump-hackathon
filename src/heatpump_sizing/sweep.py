"""Sweep heat pump size x supplemental source x city and find the trade-off frontier."""
import numpy as np
import pandas as pd

from .heatpump import HeatPump
from .load import heating_load_kw
from .parameters import CITIES, SUPPLEMENTAL, House
from .simulate import simulate_year
from .weather import load_hourly_temps


def run_sweep(cities=None, backups=None, sizes_kw=None, year: int = 2023,
              offline: bool = False, house: House = House()) -> pd.DataFrame:
    cities = cities or list(CITIES)
    backups = backups or list(SUPPLEMENTAL)
    sizes_kw = sizes_kw if sizes_kw is not None else np.arange(0, 26, 1.0)  # 0 = no heat pump baseline

    rows = []
    for c in cities:
        temps = load_hourly_temps(c, year, offline=offline)
        load = heating_load_kw(temps, house)
        for b in backups:
            for s in sizes_kw:
                rows.append(simulate_year(temps, load, HeatPump(rated_kw=float(s)), c, b))
    return pd.DataFrame(rows)


def pareto_front(df: pd.DataFrame, x: str = "total_cost_usd_yr", y: str = "co2_kg_yr") -> pd.DataFrame:
    """Rows not dominated on (x, y), both minimized."""
    d = df.sort_values([x, y])
    keep, best_y = [], np.inf
    for i, v in zip(d.index, d[y]):
        if v < best_y:
            keep.append(i)
            best_y = v
    return d.loc[keep]
