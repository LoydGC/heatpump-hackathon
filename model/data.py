"""Data loaders for the Minneapolis heat pump model.

Everything reads from <repo>/data/processed/. No modelling here, just loading
and light validation. Hours are aligned by row index: row 0 = local hour 0 on
Jan 1 (weather `hour_of_year` and grid `hour_of_year` both run 0..8759).
"""
import json
from pathlib import Path

import numpy as np
import pandas as pd

REPO = Path(__file__).resolve().parent.parent
PROC = REPO / "data" / "processed"

WEATHER_FILES = {
    "tmyx_main": "msp_weather_TMYx.2011-2025.csv",   # main typical year
    "tmyx_alt":  "msp_weather_TMYx.2009-2023.csv",   # alternate typical year
    "tmy3_cold": "msp_weather_TMY3.csv",             # cold-winter stress test
}


def load_inputs():
    """Scalar inputs (prices, emission factors, rebates, design temps)."""
    with open(PROC / "model_inputs_minneapolis.json") as f:
        return json.load(f)


def load_weather(which="tmyx_main"):
    w = pd.read_csv(PROC / WEATHER_FILES[which])
    assert len(w) == 8760, f"{which}: expected 8760 rows, got {len(w)}"
    assert not w["drybulb_C"].isna().any()
    return w


def load_grid():
    """Hourly MISO grid carbon (g CO2 / kWh), local CST, 8,760 rows.

    ASSUMPTION (from data/README): average (not marginal) emissions, with EF
    coal 1000, gas 410, other 300, nuclear/renewables 0 g/kWh.
    """
    g = pd.read_csv(PROC / "miso_hourly_grid_carbon_2025.csv", comment="#")
    assert len(g) == 8760 and not g["co2_g_per_kWh"].isna().any()
    g["local_time"] = pd.to_datetime(g["local_time_cst"])
    return g


def load_hp_curves():
    """Raw Carrier 37MUHAQ rows (6 sizes x 4 outdoor temperatures)."""
    return pd.read_csv(PROC / "hp_carrier_37MUHAQ_heating_curves.csv", skiprows=1)
