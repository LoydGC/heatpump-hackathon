"""Hourly dispatch: heat pump first, supplemental source covers the rest.

TODO ideas: part-load COP degradation (cycling when oversized), a switchover
temperature control strategy, demand charges / time-of-use rates, marginal grid CO2.
"""
import numpy as np
import pandas as pd

from .heatpump import HeatPump
from .parameters import CITIES, SUPPLEMENTAL, HeatPumpCost


def capital_recovery_factor(rate: float, years: int) -> float:
    return rate * (1 + rate) ** years / ((1 + rate) ** years - 1)


def simulate_year(temps_c: pd.Series, load_kw: pd.Series, hp: HeatPump,
                  city_key: str, backup_key: str,
                  hp_cost: HeatPumpCost = HeatPumpCost()) -> dict:
    city = CITIES[city_key]
    backup = SUPPLEMENTAL[backup_key]

    load = load_kw.to_numpy()
    cap = hp.capacity_kw(temps_c.to_numpy())
    hp_heat = np.minimum(load, cap)
    backup_heat = load - hp_heat
    cop = np.nan_to_num(hp.cop(temps_c.to_numpy()), nan=1.0)

    hp_elec_kwh = (hp_heat / cop).sum()          # hourly steps -> kWh
    backup_fuel_kwh = (backup_heat / backup.efficiency).sum()

    if backup_key == "electric":
        backup_price, backup_co2 = city.elec_price_usd_kwh, city.grid_co2_kg_kwh
    else:
        backup_price = city.fuel_price_usd_kwh[backup_key]
        backup_co2 = backup.co2_kg_per_kwh_fuel

    opex = hp_elec_kwh * city.elec_price_usd_kwh + backup_fuel_kwh * backup_price
    co2 = hp_elec_kwh * city.grid_co2_kg_kwh + backup_fuel_kwh * backup_co2
    hp_capex = hp_cost.fixed_usd + hp_cost.per_kw_usd * hp.rated_kw if hp.rated_kw > 0 else 0.0
    capex = hp_capex + backup.capex_usd
    annualized_capex = capex * capital_recovery_factor(hp_cost.discount_rate, hp_cost.lifetime_yr)

    total_heat = load.sum()
    return {
        "city": city_key,
        "backup": backup_key,
        "hp_rated_kw": hp.rated_kw,
        "annual_heat_kwh": total_heat,
        "hp_share": hp_heat.sum() / total_heat if total_heat else np.nan,
        "hp_elec_kwh": hp_elec_kwh,
        "backup_fuel_kwh": backup_fuel_kwh,
        "seasonal_cop": hp_heat.sum() / hp_elec_kwh if hp_elec_kwh else np.nan,
        "opex_usd_yr": opex,
        "capex_usd": capex,
        "total_cost_usd_yr": opex + annualized_capex,
        "co2_kg_yr": co2,
    }
