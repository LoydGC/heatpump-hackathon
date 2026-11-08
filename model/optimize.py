"""model.ipynb (Patrick O'Toole) as a plain Python module and CLI, with every parameter live.

Same data, functions and selection rule as the notebook (main d5db450). Differences, all deliberate:
  1. The notebook hardcodes ResStock building 274938. Here the home is picked from the parameters with the notebook's own
     find_closest_row(df, heating_fuel, heating_setpoint, unified_r, area), so square_footage, chosen_set_point and
     current_heating_system change the result. insulation_r (unified R, the dashboard's insulation slider) is the one input
     the notebook does not have as a parameter; find_closest_row needs it.
     --building 274938 reproduces the notebook's own run exactly.
  2. run_thermal_hp_sim is vectorized with numpy (same arithmetic, ~100x faster than the per-hour .iloc loop).
  3. resample('H') -> resample('h') (newer pandas rejects 'H').
  4. No winner (no heat pump with positive grand operating savings): the notebook crashes on idxmin; here winner is None.
  5. location: only "Minneapolis" has data (MN metadata, MN parquet loads, mn.csv weather). Anything else raises.

Usage:
  python3 model/optimize.py                      # notebook defaults, home picked by find_closest_row
  python3 model/optimize.py --building 274938    # the notebook's hardcoded run
  python3 model/optimize.py --dollars-per-ton-co2 150 --square-footage 2200 --chosen-set-point 70 --rebate-type full
Writes winner.json (same keys as the notebook) and heat_pump_selection_results.csv to --out-dir (default: current dir).
Run from the repo root (paths are relative to it, as in the notebook).
"""
from __future__ import annotations

import argparse
import json
import os
import re
from functools import lru_cache

import numpy as np
import pandas as pd

# ---------------------------------------------------------------- notebook constants (cell "Constants")
UNFINISHED_R_VALUES = {"floor_r": 2.0, "foundation_wall_r": 2.0, "ceiling_r": 2.5, "rim_joist_r": 2.5, "roof_r": 3.0}
columns_of_interest = [
    "MN_upgrade0.csv", "in.city", "in.sqft..ft2", "in.heating_fuel", "in.heating_setpoint", "in.insulation_ceiling",
    "in.insulation_floor", "in.insulation_foundation_wall", "in.insulation_rim_joist", "in.insulation_roof",
    "in.geometry_building_type_recs", "out.params.size_heat_pump_backup_primary..kbtu_per_hr",
    "out.params.size_heating_system_primary..kbtu_per_hr", "out.params.size_heating_system_secondary..kbtu_per_hr",
]
column_renames = {
    "MN_upgrade0.csv": "building_id", "in.city": "city", "in.sqft..ft2": "area", "in.heating_fuel": "heating_fuel",
    "in.heating_setpoint": "heating_setpoint", "in.insulation_ceiling": "ceiling_r", "in.insulation_floor": "floor_r",
    "in.insulation_foundation_wall": "foundation_wall_r", "in.insulation_rim_joist": "rim_joist_r", "in.insulation_roof": "roof_r",
    "in.geometry_building_type_recs": "building_type",
    "out.params.size_heat_pump_backup_primary..kbtu_per_hr": "heat_pump_backup_primary_size",
    "out.params.size_heating_system_primary..kbtu_per_hr": "heating_system_primary_size",
    "out.params.size_heating_system_secondary..kbtu_per_hr": "heating_system_secondary_size",
}
# Dashboard "Heating today" ids -> ResStock in.heating_fuel strings (only these four occur in the Minneapolis homes)
FUEL_IDS = {"gas": "Natural Gas", "electric": "Electricity", "propane": "Propane", "oil": "Fuel Oil", "wood": "Other Fuel", "kerosene": "Other Fuel"}


# ---------------------------------------------------------------- notebook functions (cell "Functions")
def c2f(celsius):
    return celsius * 9.0 / 5.0 + 32.0


def get_parquet_file_path(state_abbreviation: str, building_id: str) -> str:
    return f"data/raw/nrel_parquet/{state_abbreviation.lower()}/{building_id}-0.parquet"


def parse_r_value(val, default_r: float, col_name: str = "not specified") -> float:
    if pd.isna(val):
        return default_r
    match = re.search(r"r-(\d+(?:\.\d+)?)", str(val), flags=re.IGNORECASE)
    return float(match.group(1)) if match else default_r


def load_neep_machine_profiles(csv_path="data/raw/heat_pumps/neep_ccashp_heating_performance.csv", cop_col="cop_rated"):
    df = pd.read_csv(csv_path, skiprows=1)
    profiles = {}
    for (brand, outdoor_unit, pid), group in df.groupby(["brand", "outdoor_unit", "product_id"]):
        group = group.sort_values("outdoor_F")
        cop_series = group[cop_col].fillna(group["cop_min"])
        cap_ratings = dict(zip(group["outdoor_F"].astype(float), group["capacity_max_btuh"].astype(float)))
        cop_ratings = dict(zip(group["outdoor_F"].astype(float), cop_series.astype(float)))
        profiles[f"AHRI {pid}"] = {"cop_ratings": cop_ratings, "capacity_ratings": cap_ratings,
                                   "nominal_tons": cap_ratings.get(47.0, 0.0) / 12000.0, "brand": brand,
                                   "outdoor_unit": outdoor_unit, "product_id": pid}
    return profiles


def calculate_unified_r(df: pd.DataFrame, area_weights: dict | None = None) -> pd.DataFrame:
    df_out = df.copy()
    r_cols = list(UNFINISHED_R_VALUES.keys())
    num_cols = []
    for col in r_cols:
        num_col = f"{col}_float"
        default = UNFINISHED_R_VALUES[col]
        df_out[num_col] = df_out[col].apply(lambda x: parse_r_value(x, default, col_name=col))
        num_cols.append(num_col)
    u_values = 1.0 / df_out[num_cols].values
    if area_weights:
        weights = np.array([area_weights[col] for col in r_cols])
        df_out["unified_r_value"] = weights.sum() / (u_values @ weights)
    else:
        df_out["unified_r_value"] = len(r_cols) / u_values.sum(axis=1)
    return df_out


def capital_cost(tons):
    if tons <= 0:
        return 0
    return 1075.2 * tons + 1193


def get_rebate(capital_cost: float, type):
    if type == "full":
        return min(capital_cost, 8000)
    elif type == "partial":
        return min(capital_cost / 2, 4000)
    else:
        return -0


def find_closest_row(df, heating_fuel, heating_setpoint, unified_r, area):
    numeric_columns = ["heating_setpoint", "unified_r_value", "area"]
    numeric_values = df[numeric_columns].copy()
    numeric_values["heating_setpoint"] = pd.to_numeric(
        numeric_values["heating_setpoint"].astype("string").str.extract(r"([-+]?\d+(?:\.\d+)?)", expand=False), errors="coerce")
    numeric_values[["unified_r_value", "area"]] = numeric_values[["unified_r_value", "area"]].apply(pd.to_numeric, errors="coerce")
    candidates = df[df["heating_fuel"] == heating_fuel]
    if candidates.empty:
        raise ValueError(f"No rows found for heating_fuel={heating_fuel!r}")
    candidate_values = numeric_values.loc[candidates.index].dropna()
    if candidate_values.empty:
        raise ValueError(f"No numeric rows found for heating_fuel={heating_fuel!r}")
    setpoint = pd.to_numeric(pd.Series([heating_setpoint], dtype="string").str.extract(r"([-+]?\d+(?:\.\d+)?)", expand=False).iloc[0], errors="coerce")
    target = pd.Series([setpoint, unified_r, area], index=numeric_columns, dtype=float)
    scales = numeric_values.std().replace(0, 1)
    distances = (((candidate_values - target) / scales) ** 2).sum(axis=1)
    return df.loc[distances.idxmin()]


# ---------------------------------------------------------------- data (cells "Imports" .. "Model")
@lru_cache(maxsize=1)
def load_buildings() -> pd.DataFrame:
    data = pd.read_csv("data/raw/buildstock/MN_upgrade0.csv", dtype={"MN_upgrade0.csv": "str"}, low_memory=False)
    df = data[columns_of_interest].copy()
    df.rename(columns=column_renames, inplace=True)
    df["building_id"] = df["building_id"].astype("str")
    df = df.where((df["city"] == "MN, Minneapolis") & (df["building_type"] == "Single-Family Detached"), axis=0).dropna()
    return calculate_unified_r(df)


@lru_cache(maxsize=1)
def load_weather_f() -> np.ndarray:
    df_temp = pd.read_csv("./data/raw/weather/mn.csv", index_col="date_time")
    return df_temp["Dry Bulb Temperature [°C]"].apply(c2f).values


@lru_cache(maxsize=256)
def load_hourly_demand_btu(building_id: str) -> np.ndarray:
    df_ts = pd.read_parquet(get_parquet_file_path("MN", building_id))
    df_ts.set_index("timestamp", inplace=True)
    return (df_ts["out.load.heating.energy_delivered..kbtu"].resample("h").sum() * 1000.0).values


def run_thermal_hp_sim(t_amb_f, heating_demand, cop_ratings=None, capacity_ratings=None, gas_furnace_eff=0.80,
                       elec_rate_per_kwh=0.15, gas_rate_per_therm=1.20, grid_co2_kg_per_kwh=0.45, gas_co2_kg_per_therm=5.30):
    """Vectorized run_thermal_hp_sim: identical per-hour arithmetic, returns the notebook's summary dict."""
    on = (heating_demand > 0) & ~np.isnan(t_amb_f)
    need = np.where(on, heating_demand, 0.0)
    if capacity_ratings and cop_ratings and max(capacity_ratings.values()) > 0.0:
        tc = np.array(sorted(cop_ratings)); vc = np.array([cop_ratings[t] for t in tc])
        tp = np.array(sorted(capacity_ratings)); vp = np.array([capacity_ratings[t] for t in tp])
        cop = np.interp(t_amb_f, tc, vc)          # == interp1d linear with end values held (bounds_error=False, fill_value=(first, last))
        cap = np.interp(t_amb_f, tp, vp)
        hp = np.minimum(need, cap)
        kwh = np.where(on, (hp / np.maximum(1.0, cop)) / 3412.14, 0.0)
    else:
        hp = np.zeros_like(need); kwh = np.zeros_like(need)
    aux = np.maximum(0.0, need - hp)
    therms = (aux / gas_furnace_eff) / 100000.0
    cost = kwh * elec_rate_per_kwh + therms * gas_rate_per_therm
    co2 = kwh * grid_co2_kg_per_kwh + therms * gas_co2_kg_per_therm
    return {"total_elec_kwh": kwh.sum(), "total_gas_therms": therms.sum(), "total_operating_cost": cost.sum(),
            "total_co2_kg": co2.sum(), "hp_coverage_pct": hp.sum() / max(1.0, hp.sum() + aux.sum()) * 100}


# ---------------------------------------------------------------- the notebook run (cells "Parameter search" + "Heat pump selection")
def optimize(dollars_per_ton_co2=300, location="Minneapolis", square_footage=1500, current_heating_system="Natural Gas",
             chosen_set_point=68, price_per_kWh_electric=0.12, price_per_therm_secondary=None, rebate_type="partial",
             insulation_r=2.5, building_id: str | None = None):
    if location not in ("Minneapolis", "minneapolis"):
        raise ValueError(f"No data for location={location!r}; the notebook only has Minneapolis.")
    price_per_kWh_electric = 0.12 if price_per_kWh_electric is None else price_per_kWh_electric
    price_per_therm_secondary = 1.20 if price_per_therm_secondary is None else price_per_therm_secondary
    fuel = FUEL_IDS.get(current_heating_system, current_heating_system)

    df = load_buildings()
    if building_id is None:
        try:
            home = find_closest_row(df, heating_fuel=fuel, heating_setpoint=chosen_set_point, unified_r=insulation_r, area=square_footage)
            fuel_fallback = False
        except ValueError:   # no ResStock home with that fuel: match among gas homes
            home = find_closest_row(df, heating_fuel="Natural Gas", heating_setpoint=chosen_set_point, unified_r=insulation_r, area=square_footage)
            fuel_fallback = True
        building_id = home["building_id"]
    else:
        home = df[df["building_id"] == str(building_id)].iloc[0]; fuel_fallback = False

    t_amb_vals = load_weather_f()
    heating_demand_vals = load_hourly_demand_btu(str(building_id))
    min_len = min(len(t_amb_vals), len(heating_demand_vals), 8760)
    t, d = t_amb_vals[:min_len], heating_demand_vals[:min_len]

    rates = dict(elec_rate_per_kwh=price_per_kWh_electric, gas_rate_per_therm=price_per_therm_secondary)
    results = [dict(run_thermal_hp_sim(t, d, **rates), machine_profile="NG only", nominal_tons=0.0)]
    for label, p in load_neep_machine_profiles(cop_col="cop_max").items():
        results.append(dict(run_thermal_hp_sim(t, d, p["cop_ratings"], p["capacity_ratings"], **rates), machine_profile=label, nominal_tons=p["nominal_tons"]))
    cols = ["machine_profile", "nominal_tons", "hp_coverage_pct", "total_elec_kwh", "total_gas_therms", "total_operating_cost", "total_co2_kg"]
    r = pd.DataFrame(results)[cols].sort_values(by="nominal_tons")
    r["capital_cost_usd"] = r["nominal_tons"].apply(capital_cost)
    r["rebate_usd"] = r["nominal_tons"].apply(lambda tons: get_rebate(capital_cost(tons), rebate_type))
    r["grand_operating_cost"] = r["total_operating_cost"] + (r["total_co2_kg"] * dollars_per_ton_co2) / 1000

    ng = r.loc[r["nominal_tons"] == 0.0, "grand_operating_cost"].values[0]
    r["grand_operating_savings"] = ng - r["grand_operating_cost"]
    r["net_capital_cost_usd"] = r["capital_cost_usd"] - r["rebate_usd"]
    w = r.loc[(r["nominal_tons"] > 0.0) & (r["grand_operating_savings"] > 0)].copy()
    w["grand_payback"] = w["net_capital_cost_usd"] / w["grand_operating_savings"]
    winner = w.loc[w["grand_operating_cost"].idxmin()] if len(w) else None
    return {
        "winner": None if winner is None else {k: (v.item() if hasattr(v, "item") else v) for k, v in winner.items()},
        "results": r, "ng_baseline_grand_cost": float(ng),
        "home": {"building_id": str(building_id), "area": float(home["area"]), "heating_fuel": home["heating_fuel"],
                 "heating_setpoint": home["heating_setpoint"], "unified_r_value": float(home["unified_r_value"]),
                 "fuel_fallback": fuel_fallback},
    }


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--dollars-per-ton-co2", type=float, default=300)
    ap.add_argument("--location", default="Minneapolis")
    ap.add_argument("--square-footage", type=float, default=1500)
    ap.add_argument("--current-heating-system", default="Natural Gas")
    ap.add_argument("--chosen-set-point", type=float, default=68)
    ap.add_argument("--price-per-kwh-electric", type=float, default=0.12)
    ap.add_argument("--price-per-therm-secondary", type=float, default=None)
    ap.add_argument("--rebate-type", default="partial", choices=["full", "partial", "none"])
    ap.add_argument("--insulation-r", type=float, default=2.5, help="unified R target for find_closest_row (dashboard: 2.5, 3.5, 4.5, 5)")
    ap.add_argument("--building", default=None, help="force a ResStock building id (274938 = the notebook's hardcoded home)")
    ap.add_argument("--out-dir", default=".")
    a = ap.parse_args()
    out = optimize(a.dollars_per_ton_co2, a.location, a.square_footage, a.current_heating_system, a.chosen_set_point,
                   a.price_per_kwh_electric, a.price_per_therm_secondary, a.rebate_type, a.insulation_r, a.building)
    os.makedirs(a.out_dir, exist_ok=True)
    out["results"].to_csv(os.path.join(a.out_dir, "heat_pump_selection_results.csv"), index=False)
    with open(os.path.join(a.out_dir, "winner.json"), "w") as f:
        json.dump(out["winner"], f)
    print("home:", out["home"])
    print("winner:", json.dumps(out["winner"], indent=1) if out["winner"] else "none (no heat pump has positive grand operating savings)")


if __name__ == "__main__":
    main()
