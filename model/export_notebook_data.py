"""Export the data model.ipynb (Patrick) reads, as a JS file the dashboard can run his simulation on.

Mirrors the notebook's data prep exactly (same columns, same Minneapolis / Single-Family Detached filter, same
unified-R and find_closest_row logic, same hourly resample of out.load.heating.energy_delivered..kbtu, same NEEP
profile loader with cop_col='cop_max'). Output: ui/notebook-data.js  (window.NB_DATA).

Run from the repo root:  python3 model/export_notebook_data.py
"""
import json
import re
import numpy as np
import pandas as pd

UNFINISHED_R_VALUES = {"floor_r": 2.0, "foundation_wall_r": 2.0, "ceiling_r": 2.5, "rim_joist_r": 2.5, "roof_r": 3.0}
COLS = {
    "MN_upgrade0.csv": "building_id", "in.city": "city", "in.sqft..ft2": "area", "in.heating_fuel": "heating_fuel",
    "in.heating_setpoint": "heating_setpoint", "in.insulation_ceiling": "ceiling_r", "in.insulation_floor": "floor_r",
    "in.insulation_foundation_wall": "foundation_wall_r", "in.insulation_rim_joist": "rim_joist_r",
    "in.insulation_roof": "roof_r", "in.geometry_building_type_recs": "building_type",
}
# The dashboard's insulation slider (2.5 / 3.5 / 4.5 / 5 = Not well / Fair / Decent / Good) is on the notebook's unified-R scale (2.7-5.1 in the Minneapolis homes).
# Too few ResStock homes sit at each level to pick one per level, so the page takes the typical-insulation home of the right size and scales its
# heating load by (home's unified R / slider R): heat loss is proportional to 1/R.
BINS = {"500-749": 625, "750-999": 875, "1000-1499": 1250, "1500-1999": 1750, "2000-2499": 2250, "2500-2999": 2750, "3000-3999": 3500}


def parse_r(val, default):
    if pd.isna(val):
        return default
    m = re.search(r"r-(\d+(?:\.\d+)?)", str(val), flags=re.IGNORECASE)
    return float(m.group(1)) if m else default


def main():
    data = pd.read_csv("data/raw/buildstock/MN_upgrade0.csv", dtype={"MN_upgrade0.csv": "str"})
    df = data[list(COLS)].copy().rename(columns=COLS)
    df["building_id"] = df["building_id"].astype("str")
    df = df.where((df["city"] == "MN, Minneapolis") & (df["building_type"] == "Single-Family Detached"), axis=0).dropna()
    nums = []
    for c, d in UNFINISHED_R_VALUES.items():
        df[c + "_float"] = df[c].apply(lambda x: parse_r(x, d)); nums.append(c + "_float")
    df["unified_r_value"] = len(nums) / (1.0 / df[nums].values).sum(axis=1)
    df["setpoint"] = pd.to_numeric(df["heating_setpoint"].astype("string").str.extract(r"([-+]?\d+(?:\.\d+)?)", expand=False), errors="coerce")
    df["area"] = pd.to_numeric(df["area"], errors="coerce")

    import os
    have = {f.split("-")[0] for f in os.listdir("data/raw/nrel_parquet/mn")}
    cand = df[(df["heating_fuel"] == "Natural Gas") & df["building_id"].isin(have)]
    scales = df[["setpoint", "unified_r_value", "area"]].std().replace(0, 1)
    r_med = cand["unified_r_value"].median()

    temps = pd.read_csv("data/raw/weather/mn.csv", index_col="date_time")["Dry Bulb Temperature [°C]"] * 9 / 5 + 32

    homes, index, grid = [], {}, {}
    for r_level in [r_med]:
        for label, area in BINS.items():
            # notebook's find_closest_row: nearest (setpoint, unified R, area) in standard-deviation units, gas homes only
            d = (((cand[["setpoint", "unified_r_value", "area"]] - pd.Series({"setpoint": 68.0, "unified_r_value": r_level, "area": area})) / scales) ** 2).sum(axis=1)
            row = cand.loc[d.idxmin()]
            bid = row["building_id"]
            if bid not in index:
                ts = pd.read_parquet(f"data/raw/nrel_parquet/mn/{bid}-0.parquet").set_index("timestamp")
                dem = (ts["out.load.heating.energy_delivered..kbtu"].resample("h").sum() * 1000.0).values
                n = min(len(temps), len(dem), 8760)
                index[bid] = len(homes)
                homes.append({"buildingId": bid, "areaSqft": float(row["area"]), "unifiedR": round(float(row["unified_r_value"]), 2),
                              "setpointF": float(row["setpoint"]), "demandBtu": [int(round(x / 10.0)) for x in dem[:n]]})  # tens of BTU
            grid.setdefault('ref', {})[label] = index[bid]
            print(r_level, label, bid, row["area"], "R", round(row["unified_r_value"], 2))
    # the home hardcoded in the notebook (data/raw/nrel_parquet/mn/274938-0.parquet); the dashboard uses it for Minneapolis
    if "274938" not in index:
        row = df[df["building_id"] == "274938"].iloc[0]
        ts = pd.read_parquet("data/raw/nrel_parquet/mn/274938-0.parquet").set_index("timestamp")
        dem = (ts["out.load.heating.energy_delivered..kbtu"].resample("h").sum() * 1000.0).values
        nn = min(len(temps), len(dem), 8760)
        index["274938"] = len(homes)
        homes.append({"buildingId": "274938", "areaSqft": float(row["area"]), "unifiedR": round(float(row["unified_r_value"]), 2),
                      "setpointF": float(row["setpoint"]), "demandBtu": [int(round(x / 10.0)) for x in dem[:nn]]})
    n = min(len(temps), 8760)

    heat = pd.read_csv("data/raw/heat_pumps/neep_ccashp_heating_performance.csv", skiprows=1)
    profiles = []
    for (brand, unit, pid), g in heat.groupby(["brand", "outdoor_unit", "product_id"]):
        g = g.sort_values("outdoor_F")
        cop = g["cop_max"].fillna(g["cop_min"])
        cap = dict(zip(g["outdoor_F"].astype(float), g["capacity_max_btuh"].astype(float)))
        profiles.append({"id": f"AHRI {pid}", "brand": brand, "outdoorUnit": unit,
                         "nominalTons": cap.get(47.0, 0.0) / 12000.0,
                         "t": [float(t) for t in g["outdoor_F"]], "cop": [float(c) for c in cop], "cap": [float(c) for c in g["capacity_max_btuh"]]})
    profiles.sort(key=lambda p: p["nominalTons"])

    out = {"source": "model.ipynb data prep (Patrick O'Toole), exported by model/export_notebook_data.py", "hours": n,
           "tempF": [round(float(t), 1) for t in temps.values[:n]], "homes": homes, "grid": grid, "notebookHome": index["274938"], "binMidSqft": BINS, "profiles": profiles}
    with open("ui/notebook-data.js", "w") as f:
        f.write("// Generated by model/export_notebook_data.py from the data model.ipynb reads. Do not edit by hand.\nwindow.NB_DATA = ")
        json.dump(out, f, separators=(",", ":"))
        f.write(";\n")
    print("profiles", len(profiles), "hours", n)


if __name__ == "__main__":
    main()
