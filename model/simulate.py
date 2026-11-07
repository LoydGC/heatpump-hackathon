"""Hourly heat pump + backup simulation (no thermal mass yet).

simulate(hp_size, controller, ...) -> DataFrame of 8,760 hourly rows.
annual(df) -> dict of annual totals.

Controllers:
  'dumb'   : heat pump runs up to its capacity, backup covers the rest.
  'switch' : below `t_switch` (degC) the backup does everything; above it the
             heat pump runs up to capacity.
  'smart'  : each hour, compare cost-plus-carbon per kWh of HEAT:
               heat pump: (p_e + lam*c_e) / COP     backup: (p_f + lam*c_f) / eta
             and use the heat pump (up to capacity) only if it is cheaper.
             lam is a carbon price in $/tonne.

CenterPoint rebate rule: pass hp_force_above_C=4.5 to force the heat pump on
whenever T > 4.5 C (40 F) for any controller (fixed switchover needs
t_switch <= 4.5 for the same effect).
"""
from dataclasses import dataclass
import numpy as np
import pandas as pd
from data import load_inputs, load_weather, load_grid, load_hp_curves
from heatpump import HeatPump

_CURVES = load_hp_curves()
_INP = load_inputs()
_GRID = load_grid()


@dataclass
class House:
    # ASSUMPTIONS (all exposed as inputs; sweep for sensitivity)
    design_load_kW: float = 15.0   # heat loss at design temp; older MN single-family
    t_design_C: float = -20.6      # ASHRAE 99% (JSON)
    t_balance_C: float = 17.0      # heating off above this (internal gains)

    @property
    def UA(self):                  # kW per K
        return self.design_load_kW / (self.t_balance_C - self.t_design_C)


@dataclass
class Prices:
    elec_usd_kWh: object = _INP["electricity"]["flat_all_in_usd_per_kWh"]  # scalar or 8760 array
    gas_usd_kWh: float = _INP["natural_gas"]["usd_per_kWh_fuel"]           # per kWh of FUEL
    furnace_eta: float = _INP["furnace_efficiency_AFUE"]
    gas_g_kWh: float = _INP["emissions"]["gas_gCO2_per_kWh_fuel"]


def simulate(hp_size, controller="dumb", house=House(), prices=Prices(),
             weather="tmyx_main", t_switch=-12.0, lam=0.0, hp_force_above_C=None):
    w = load_weather(weather)
    T = w["drybulb_C"].to_numpy()
    carbon = _GRID["co2_g_per_kWh"].to_numpy()           # g/kWh, 2025 grid
    pe = np.broadcast_to(np.asarray(prices.elec_usd_kWh, dtype=float), T.shape)
    q = house.UA * np.clip(house.t_balance_C - T, 0, None)  # heat need, kW

    if hp_size is None:                                  # baseline: furnace only
        q_hp = np.zeros_like(q); cop = np.ones_like(q)
    else:
        hp = HeatPump(_CURVES, hp_size)
        cap = hp.cap_max(T)
        q_try = np.minimum(q, cap)                       # what the HP could deliver
        cop_try = hp.cop(T, q_try)
        if controller == "dumb":
            allow = np.ones_like(q, dtype=bool)
        elif controller == "switch":
            allow = T > t_switch
        elif controller == "smart":
            obj_hp = (pe + lam * 1e-6 * carbon) / cop_try          # $-equivalent per kWh heat
            obj_bk = (prices.gas_usd_kWh + lam * 1e-6 * prices.gas_g_kWh) / prices.furnace_eta
            allow = obj_hp < obj_bk
        else:
            raise ValueError(controller)
        if hp_force_above_C is not None:
            allow = allow | (T > hp_force_above_C)
        q_hp = np.where(allow, q_try, 0.0)
        cop = cop_try
    q_bk = q - q_hp
    e_hp = np.where(q_hp > 0, q_hp / cop, 0.0)           # electricity kWh (1 h steps)
    fuel = q_bk / prices.furnace_eta                     # gas kWh of fuel
    return pd.DataFrame({
        "month": w["month"].to_numpy(), "T": T, "q": q, "q_hp": q_hp, "q_bk": q_bk,
        "elec_kWh": e_hp, "fuel_kWh": fuel,
        "cost_usd": e_hp * pe + fuel * prices.gas_usd_kWh,
        "co2_kg": (e_hp * carbon + fuel * prices.gas_g_kWh) / 1000.0,
    })


def annual(df):
    return dict(
        cost=df.cost_usd.sum(), co2_t=df.co2_kg.sum() / 1000,
        hp_share=df.q_hp.sum() / df.q.sum(),
        seasonal_cop=(df.q_hp.sum() / df.elec_kWh.sum()) if df.elec_kWh.sum() > 0 else np.nan,
        backup_hours=int((df.q_bk > 1e-9).sum()),
        peak_elec_kW=df.elec_kWh.max(), heat_kWh=df.q.sum(),
    )
