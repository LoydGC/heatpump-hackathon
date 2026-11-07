"""Building heating load.

Starts with a simple UA / balance-point model: Q = UA * max(T_balance - T_out, 0).
TODO: replace or calibrate with a COMSOL building model (thermal mass, solar gains,
internal gains) and export an hourly load profile to data/processed/.
"""
import numpy as np
import pandas as pd

from .parameters import House


def heating_load_kw(temps_c: pd.Series, house: House = House()) -> pd.Series:
    q = house.ua_kw_per_k * np.clip(house.balance_temp_c - temps_c, 0, None)
    return q.rename("load_kw")


def design_load_kw(design_temp_c: float, house: House = House()) -> float:
    return house.ua_kw_per_k * max(house.balance_temp_c - design_temp_c, 0.0)
