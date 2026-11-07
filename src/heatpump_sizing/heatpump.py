"""Air-source heat pump performance vs. outdoor temperature.

Capacity and COP are interpolated from a normalized performance table for a generic
cold-climate heat pump. TODO: replace with a real unit's data (NEEP ccASHP list,
manufacturer extended tables) or a COMSOL refrigerant-cycle model.
"""
from dataclasses import dataclass

import numpy as np

# Outdoor temp (C) -> capacity as fraction of rated (rated at 8.3 C / 47 F), and COP.
_T = np.array([-30.0, -25.0, -15.0, -8.3, 0.0, 8.3, 15.0])
_CAP_FRAC = np.array([0.45, 0.55, 0.75, 0.85, 0.92, 1.00, 1.05])
_COP = np.array([1.4, 1.6, 2.0, 2.5, 3.0, 3.6, 4.2])


@dataclass(frozen=True)
class HeatPump:
    rated_kw: float           # heating capacity at 8.3 C
    cutoff_c: float = -30.0   # below this the unit shuts off

    def capacity_kw(self, temp_c):
        t = np.asarray(temp_c, dtype=float)
        cap = self.rated_kw * np.interp(t, _T, _CAP_FRAC)
        return np.where(t < self.cutoff_c, 0.0, cap)

    def cop(self, temp_c):
        t = np.asarray(temp_c, dtype=float)
        return np.where(t < self.cutoff_c, np.nan, np.interp(t, _T, _COP))
