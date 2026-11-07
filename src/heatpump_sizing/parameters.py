"""Shared assumptions. Every number here is a PLACEHOLDER to verify and cite.

Keep all tunable inputs in this file so the team argues about numbers in one place.
When you replace a value, add the source in the comment next to it.
"""
from dataclasses import dataclass, field

KWH_PER_THERM = 29.307
KWH_PER_GAL_OIL = 40.6
KWH_PER_CORD_WOOD = 5860.0  # ~20 MMBtu/cord, hardwood. TODO verify


@dataclass(frozen=True)
class City:
    name: str
    lat: float
    lon: float
    design_temp_c: float          # ASHRAE 99.6% heating design temp. TODO verify
    elec_price_usd_kwh: float     # residential retail. TODO verify
    grid_co2_kg_kwh: float        # average grid intensity (consider marginal too). TODO verify
    fuel_price_usd_kwh: dict = field(default_factory=dict)  # price per kWh of fuel energy


CITIES = {
    "boston": City(
        "Boston, MA", 42.36, -71.06, design_temp_c=-14.0,
        elec_price_usd_kwh=0.30, grid_co2_kg_kwh=0.28,
        fuel_price_usd_kwh={"gas": 2.00 / KWH_PER_THERM, "oil": 4.00 / KWH_PER_GAL_OIL,
                            "wood": 400 / KWH_PER_CORD_WOOD},
    ),
    "montreal": City(
        "Montreal, QC", 45.50, -73.57, design_temp_c=-23.0,
        elec_price_usd_kwh=0.06, grid_co2_kg_kwh=0.002,  # Hydro-Quebec, near-zero
        fuel_price_usd_kwh={"gas": 1.20 / KWH_PER_THERM, "oil": 4.50 / KWH_PER_GAL_OIL,
                            "wood": 350 / KWH_PER_CORD_WOOD},
    ),
    "fairbanks": City(
        "Fairbanks, AK", 64.84, -147.72, design_temp_c=-42.0,
        elec_price_usd_kwh=0.26, grid_co2_kg_kwh=0.55,  # coal/oil heavy grid
        fuel_price_usd_kwh={"gas": 3.00 / KWH_PER_THERM, "oil": 4.00 / KWH_PER_GAL_OIL,
                            "wood": 300 / KWH_PER_CORD_WOOD},
    ),
}


@dataclass(frozen=True)
class SupplementalSource:
    name: str
    efficiency: float          # delivered heat / fuel energy
    co2_kg_per_kwh_fuel: float  # combustion CO2 per kWh of fuel energy
    capex_usd: float           # installed cost (0 if assumed already present)


# CO2 for "electric" is taken from the city grid at run time (see simulate.py).
SUPPLEMENTAL = {
    "gas": SupplementalSource("Natural gas furnace", 0.95, 0.181, 5000),
    "oil": SupplementalSource("Heating oil boiler", 0.85, 0.263, 7000),
    # Wood: biogenic CO2 is debated. 0.0 = "carbon neutral" assumption,
    # ~0.39 = stack emissions. Run both and report the sensitivity.
    "wood": SupplementalSource("Wood stove", 0.70, 0.0, 4000),
    "electric": SupplementalSource("Electric resistance", 1.00, float("nan"), 1500),
}


@dataclass(frozen=True)
class HeatPumpCost:
    fixed_usd: float = 6000.0        # TODO verify
    per_kw_usd: float = 1000.0       # TODO verify
    lifetime_yr: int = 15
    discount_rate: float = 0.05


@dataclass(frozen=True)
class House:
    ua_kw_per_k: float = 0.45        # whole-house heat loss coefficient
    balance_temp_c: float = 15.5     # no heating needed above this
