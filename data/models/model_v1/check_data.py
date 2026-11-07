"""Step 1: load everything, run sanity checks, print the summary."""
import numpy as np
from data import *
from heatpump import HeatPump

inp = load_inputs(); curves = load_hp_curves(); grid = load_grid()
print("=== WEATHER ===")
for k in WEATHER_FILES:
    w = load_weather(k); T = w.drybulb_C
    hdd65 = (18.333 - T).clip(lower=0).sum() / 24 * 1.8
    print(f"{k:10s} hours={len(w)}  min={T.min():6.1f}  mean={T.mean():5.2f}  "
          f"h<-20C={int((T<-20).sum()):3d}  h<-12C={int((T<-12).sum()):3d}  "
          f"h<4.5C={int((T<4.5).sum()):4d}  HDD65F={hdd65:5.0f}")

print("\n=== GRID CARBON (g/kWh) ===")
c = grid.co2_g_per_kWh
print(f"hours={len(grid)} mean={c.mean():.0f} min={c.min():.0f} max={c.max():.0f}  (eGRID MROW 417)")
hr = grid.local_time.dt.hour; mo = grid.local_time.dt.month
print("by hour of day: cleanest %02d:00 (%.0f), dirtiest %02d:00 (%.0f)" % (
    c.groupby(hr).mean().idxmin(), c.groupby(hr).mean().min(),
    c.groupby(hr).mean().idxmax(), c.groupby(hr).mean().max()))
print(f"winter (Dec-Feb) mean={c[mo.isin([12,1,2])].mean():.0f}; "
      f"TOU peak 15-20h mean={c[(hr>=15)&(hr<20)].mean():.0f}; off-peak 0-6h={c[hr<6].mean():.0f}")

print("\n=== HEAT PUMP: Carrier 37MUHAQ, max capacity & COP at full output ===")
print("size  | cap_max kW @ +8.3  -8.3  -15   -20   -25 | COP@max -8.3  -15  -20 | min cap kW @-8.3")
for s in sorted(curves.nominal_size_kbtuh.unique()):
    hp = HeatPump(curves, s)
    caps = [float(hp.cap_max(t)) for t in (8.3, -8.3, -15, -20, -25)]
    print(f"{s:3d}   |            {caps[0]:5.1f} {caps[1]:5.1f} {caps[2]:5.1f} {caps[3]:5.1f} {caps[4]:5.1f}"
          f" |          {float(hp.cop_at_max(-8.3)):4.2f} {float(hp.cop_at_max(-15)):4.2f} {float(hp.cop_at_max(-20)):4.2f} |   {float(hp.cap_min(-8.3)):4.2f}")

print("\n=== BREAK-EVEN COPs ===")
pe = inp["electricity"]["flat_all_in_usd_per_kWh"]; pf = inp["natural_gas"]["usd_per_kWh_fuel"]
eta = inp["furnace_efficiency_AFUE"]; cf = inp["emissions"]["gas_gCO2_per_kWh_fuel"]
print(f"cost break-even COP   = {pe/(pf/eta):.2f}   (gas heat {100*pf/eta:.2f} c/kWh_heat)")
print(f"carbon break-even COP = {c.mean()*eta/cf:.2f}   (annual-mean grid)")
