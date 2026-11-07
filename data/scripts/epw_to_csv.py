"""Convert an EnergyPlus .epw weather file into a clean hourly CSV for the heat pump model."""
import csv, sys
from pathlib import Path

def epw_to_csv(epw_path, out_path):
    rows = list(csv.reader(open(epw_path, encoding="latin-1")))
    with open(out_path, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["hour_of_year", "month", "day", "hour", "drybulb_C", "dewpoint_C",
                    "rel_humidity_pct", "pressure_Pa", "ghi_Wm2", "dni_Wm2", "dhi_Wm2", "wind_speed_ms"])
        for i, r in enumerate(rows[8:]):
            w.writerow([i, r[1], r[2], r[3], r[6], r[7], r[8], r[9], r[13], r[14], r[15], r[21]])

if __name__ == "__main__":
    epw_to_csv(sys.argv[1], sys.argv[2])
