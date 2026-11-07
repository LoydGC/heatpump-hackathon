"""Look-ahead / pre-heating controller on a lumped thermal-mass house.

Model (hourly):  C * dT_in/dt = q_hp + q_bk - vent + G - UA*(T_in - T_out)
  G = UA*(setpoint - t_balance)   internal+solar gains, so that at T_in = setpoint
                                  the heat need equals UA*(t_balance - T_out),
                                  i.e. identical to the no-mass model in simulate.py.
Controller: perfect-foresight LP over the whole year (thermal time constant
C/UA ~ 25 h, so only the next ~day matters; this is an UPPER BOUND on what
pre-heating can do). Minimises  sum[(p_e + lam*c_e)/COP * q_hp + (p_f + lam*c_f)/eta * q_bk].

Fairness constraints (so savings are load-shifting, not just colder living):
  * T_in stays in [band_lo, band_hi]  (comfort violations = 0 by construction)
  * the DAILY mean of T_in must be >= setpoint
After the LP, energy/cost/CO2 are re-evaluated with the exact heat pump COP
(including the cycling penalty), the same function the other controllers use.

Physical limits (added after the first run exploited unlimited furnace output to swing
the house 3 C in one hour): furnace output <= furnace_kW (~70 kBtu/h) and indoor
temperature may change by at most ramp_C_per_h per hour.

ASSUMPTIONS: C (kWh/degC), band 19-22 C, setpoint 20 C, hourly steps, LP planning
COP evaluated at the midpoint between min and max output.
"""
import numpy as np, pandas as pd
import scipy.sparse as sp
from scipy.optimize import linprog
from data import load_weather, load_grid, load_hp_curves
from heatpump import HeatPump
from simulate import House, Prices

_CURVES = load_hp_curves(); _GRID = load_grid()


def simulate_preheat(hp_size, house=House(), prices=Prices(), weather="tmyx_main", lam=0.0,
                     C_kWh_per_C=10.0, band=(19.0, 22.0), setpoint=20.0, cp_rule=True,
                     furnace_kW=20.0, ramp_C_per_h=0.5):
    w = load_weather(weather); T = w["drybulb_C"].to_numpy(); N = len(T)
    carbon = _GRID["co2_g_per_kWh"].to_numpy()
    pe = np.broadcast_to(np.asarray(prices.elec_usd_kWh, dtype=float), (N,))
    hp = HeatPump(_CURVES, hp_size)
    cap = hp.cap_max(T); mid = 0.5 * (hp.cap_min(T) + cap)
    UA, G = house.UA, house.UA * (setpoint - house.t_balance_C)
    c_bk = np.full(N, (prices.gas_usd_kWh + lam * 1e-6 * prices.gas_g_kWh) / prices.furnace_eta)
    # variable layout: [q_hp(N) | q_bk(N) | vent(N) | T_in(N+1)]
    nv = 3 * N + N + 1; iq, ib, iv, iT = 0, N, 2 * N, 3 * N
    # dynamics: T[t+1] - (1-UA/C) T[t] - (q_hp+q_bk-vent)/C = (G + UA*Tout)/C
    r = np.arange(N); A = sp.lil_matrix((N, nv))
    A[r, iT + r + 1] = 1.0; A[r, iT + r] = -(1 - UA / C_kWh_per_C)
    A[r, iq + r] = -1.0 / C_kWh_per_C; A[r, ib + r] = -1.0 / C_kWh_per_C; A[r, iv + r] = 1.0 / C_kWh_per_C
    beq = (G + UA * T) / C_kWh_per_C
    # daily mean of T_in >= setpoint:  -sum(T[24d+1..24d+24])/24 <= -setpoint
    D = N // 24; Aub = sp.lil_matrix((D + 2 * N, nv))
    for d in range(D): Aub[d, iT + 24 * d + 1: iT + 24 * d + 25] = -1.0 / 24
    # ramp limit: -ramp <= T[t+1]-T[t] <= ramp
    Aub[D + r, iT + r + 1] = 1.0; Aub[D + r, iT + r] = -1.0
    Aub[D + N + r, iT + r + 1] = -1.0; Aub[D + N + r, iT + r] = 1.0
    bub = np.concatenate([np.full(D, -setpoint), np.full(2 * N, ramp_C_per_h)])
    bounds = ([(0, float(c)) for c in cap]
              + [(0, 0.0) if (cp_rule and T[t] > 4.5) else (0, furnace_kW) for t in range(N)]
              + [(0, None)] * N
              + [(setpoint, setpoint)] + [band] * N)
    def solve(cop_lin):
        c_hp = (pe + lam * 1e-6 * carbon) / cop_lin
        cost = np.concatenate([c_hp, c_bk, np.zeros(N), np.zeros(N + 1)])
        res = linprog(cost, A_ub=Aub.tocsr(), b_ub=bub, A_eq=A.tocsr(), b_eq=beq, bounds=bounds, method="highs")
        if res.status != 0: raise RuntimeError(res.message)
        return res

    def exact(x):
        qh = np.where(x[iq:iq + N] < 1e-6, 0.0, x[iq:iq + N]); qb = np.where(x[ib:ib + N] < 1e-6, 0.0, x[ib:ib + N])
        e = np.where(qh > 0, qh / hp.cop(T, qh), 0.0)
        c = (e * pe).sum() + (qb / prices.furnace_eta * prices.gas_usd_kWh).sum()
        co2 = ((e * carbon).sum() + (qb / prices.furnace_eta).sum() * prices.gas_g_kWh) / 1e6
        return c + lam * co2

    # plan with COP at mid-output, then re-plan with COP at the previous solution's realised loads
    # (captures the cycling penalty); keep the plan that is best under the EXACT evaluation.
    res = solve(hp.cop(T, mid)); best = (exact(res.x), res)
    for _ in range(3):
        prev = np.where(res.x[iq:iq + N] > 1e-6, res.x[iq:iq + N], mid)
        res = solve(hp.cop(T, prev))
        if exact(res.x) < best[0] - 1e-9: best = (exact(res.x), res)
    res = best[1]
    x = res.x; q_hp = np.where(x[iq:iq + N] < 1e-6, 0.0, x[iq:iq + N]); q_bk = np.where(x[ib:ib + N] < 1e-6, 0.0, x[ib:ib + N])
    Tin = x[iT:iT + N + 1]
    e_hp = np.where(q_hp > 0, q_hp / hp.cop(T, q_hp), 0.0)          # exact COP incl. cycling penalty
    fuel = q_bk / prices.furnace_eta
    df = pd.DataFrame({"month": w["month"].to_numpy(), "T": T, "q": house.UA * np.clip(house.t_balance_C - T, 0, None),
                       "q_hp": q_hp, "q_bk": q_bk, "elec_kWh": e_hp, "fuel_kWh": fuel, "T_in": Tin[1:],
                       "cost_usd": e_hp * pe + fuel * prices.gas_usd_kWh,
                       "co2_kg": (e_hp * carbon + fuel * prices.gas_g_kWh) / 1000.0})
    df.attrs["comfort_violations_h"] = int(((Tin[1:] < band[0] - 1e-6) | (Tin[1:] > band[1] + 1e-6)).sum())
    df.attrs["lp_objective"] = res.fun
    return df
