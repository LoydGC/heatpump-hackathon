"""Heat pump capacity / COP vs outdoor temperature from the NEEP/AHRI points.

Each size has 4 rated points (8.3, -8.3, -15, -30 degC). We interpolate linearly
between them.

DATA QUIRKS handled here (flag in the pitch):
  * For the 48 and 60 kBtu/h sizes, max capacity at -15 C is HIGHER than at
    -8.3 C (different compressor-speed test conditions). Physically capacity
    should not rise as it gets colder, so we take a running minimum from warm to
    cold (the conservative "monotone envelope").
  * cap_rated is blank at -30 C, and cop_min / cop_max are not always ordered
    (min-load COP should be >= max-load COP). We use cop_min at cap_min and
    cop_max at cap_max and interpolate COP between them by load.
  * At or below the low-temperature cutoff (-22 F = -30 C) capacity = 0.
"""
import numpy as np

CUTOFF_C = -30.0          # NEEP list view: low-temperature cutoff -22 F
CYCLING_PENALTY = 0.10    # ASSUMPTION: ~10% efficiency loss below min output


class HeatPump:
    def __init__(self, curves, size_kbtuh):
        d = curves[curves["nominal_size_kbtuh"] == size_kbtuh].sort_values("outdoor_C")
        assert len(d) == 4, f"size {size_kbtuh}: expected 4 rows"
        self.size = size_kbtuh
        self.T = d["outdoor_C"].to_numpy()              # ascending: -30, -15, -8.3, 8.3
        self.cap_max_pts = d["cap_max_kW"].to_numpy()
        self.cap_min_pts = d["cap_min_kW"].to_numpy()
        self.cop_max_pts = d["cop_max"].to_numpy()
        self.cop_min_pts = d["cop_min"].to_numpy()
        # monotone envelope: capacity may not increase as temperature falls.
        # self.T is ascending (cold -> warm), so a running min from the warm end:
        self.cap_max_pts = np.minimum.accumulate(self.cap_max_pts[::-1])[::-1]

    def cap_max(self, T):
        T = np.asarray(T, dtype=float)
        c = np.interp(T, self.T, self.cap_max_pts)      # clamps outside range
        return np.where(T <= CUTOFF_C, 0.0, c)

    def cap_min(self, T):
        T = np.asarray(T, dtype=float)
        return np.where(T <= CUTOFF_C, 0.0, np.interp(T, self.T, self.cap_min_pts))

    def cop_at_min(self, T):
        return np.interp(T, self.T, self.cop_min_pts)

    def cop_at_max(self, T):
        return np.interp(T, self.T, self.cop_max_pts)

    def cop(self, T, q_kW):
        """COP when delivering q_kW of heat at outdoor temp T (linear in load
        between (cap_min, cop_min) and (cap_max, cop_max)). Below min output the
        unit cycles: COP evaluated at min load, reduced by CYCLING_PENALTY."""
        T = np.asarray(T, dtype=float); q = np.asarray(q_kW, dtype=float)
        lo, hi = self.cap_min(T), self.cap_max(T)
        c_lo, c_hi = self.cop_at_min(T), self.cop_at_max(T)
        frac = np.clip((q - lo) / np.maximum(hi - lo, 1e-9), 0, 1)
        cop = c_lo + frac * (c_hi - c_lo)
        return np.where(q < lo, cop * (1 - CYCLING_PENALTY), cop)
