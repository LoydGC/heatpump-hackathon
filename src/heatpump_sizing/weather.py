"""Hourly outdoor temperature for each city.

`load_hourly_temps` returns a pandas Series of hourly dry-bulb temps (deg C) for one
year. It tries a local cache in data/raw, then Open-Meteo's free archive API, and
falls back to a synthetic profile so the pipeline still runs offline.

TODO: compare against TMY3 / EPW files (e.g. climate.onebuilding.org) and consider
running several years to capture extreme cold snaps.
"""
from pathlib import Path

import numpy as np
import pandas as pd

from .parameters import CITIES

DATA_RAW = Path(__file__).resolve().parents[2] / "data" / "raw"
OPEN_METEO_URL = "https://archive-api.open-meteo.com/v1/archive"

# Rough annual mean / seasonal amplitude (deg C) for the synthetic fallback only.
_SYNTH = {"boston": (10.5, 13.0), "montreal": (6.8, 16.0), "fairbanks": (-2.5, 22.0)}


def fetch_open_meteo(city_key: str, year: int) -> pd.Series:
    import requests

    c = CITIES[city_key]
    r = requests.get(OPEN_METEO_URL, timeout=60, params={
        "latitude": c.lat, "longitude": c.lon,
        "start_date": f"{year}-01-01", "end_date": f"{year}-12-31",
        "hourly": "temperature_2m", "timezone": "UTC",
    })
    r.raise_for_status()
    h = r.json()["hourly"]
    return pd.Series(h["temperature_2m"], index=pd.to_datetime(h["time"]), name="temp_c")


def synthetic_temps(city_key: str, year: int = 2023, seed: int = 0) -> pd.Series:
    mean, amp = _SYNTH[city_key]
    idx = pd.date_range(f"{year}-01-01", periods=8760, freq="h")
    t = np.arange(8760)
    rng = np.random.default_rng(seed)
    seasonal = -amp * np.cos(2 * np.pi * (t / 8760 - 0.04))
    diurnal = -4.0 * np.cos(2 * np.pi * (t % 24 - 3) / 24)
    noise = np.convolve(rng.normal(0, 4, 8760 + 71), np.ones(72) / np.sqrt(72), "valid")
    return pd.Series(mean + seasonal + diurnal + noise, index=idx, name="temp_c")


def load_hourly_temps(city_key: str, year: int = 2023, offline: bool = False) -> pd.Series:
    cache = DATA_RAW / f"{city_key}_{year}_hourly.csv"
    if cache.exists():
        return pd.read_csv(cache, index_col=0, parse_dates=True)["temp_c"]
    if not offline:
        try:
            s = fetch_open_meteo(city_key, year).interpolate()
            DATA_RAW.mkdir(parents=True, exist_ok=True)
            s.to_csv(cache)
            return s
        except Exception as e:  # network down, API change, etc.
            print(f"[weather] Open-Meteo fetch failed for {city_key}: {e}; using synthetic data")
    return synthetic_temps(city_key, year)
