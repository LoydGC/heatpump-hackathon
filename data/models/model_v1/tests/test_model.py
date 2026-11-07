"""Basic engine tests: python3 -m pytest tests  (run from model/)."""
import sys; sys.path.insert(0, ".")
import numpy as np
from simulate import simulate, annual, House, Prices

def test_heat_balance():
    for ctrl in ("dumb", "switch", "smart"):
        df = simulate(30, ctrl, lam=100)
        assert np.allclose(df.q_hp + df.q_bk, df.q)

def test_gas_only_matches_hand_calc():
    df = simulate(None); p = Prices()
    assert abs(df.fuel_kWh.sum() - df.q.sum() / p.furnace_eta) < 1e-6
    assert abs(df.co2_kg.sum() - df.fuel_kWh.sum() * p.gas_g_kWh / 1000) < 1e-6

def test_capacity_zero_below_cutoff_and_monotone():
    from heatpump import HeatPump
    from data import load_hp_curves
    hp = HeatPump(load_hp_curves(), 48)
    assert hp.cap_max(-31.0) == 0
    T = np.linspace(-29, 8, 50); c = hp.cap_max(T)
    assert np.all(np.diff(c) >= -1e-9)           # capacity never rises as it gets colder

def test_switchover_never_uses_hp_below_threshold():
    df = simulate(30, "switch", t_switch=-5.0)
    assert df.loc[df["T"] <= -5.0, "q_hp"].sum() == 0

def test_centerpoint_rule_forces_hp_above_4p5C():
    df = simulate(30, "smart", lam=0, hp_force_above_C=4.5)
    warm = df[(df["T"] > 4.5) & (df.q > 0)]
    assert (warm.q_hp > 0).all()

def test_smart_not_worse_than_gas_only_objective():
    for lam in (0, 100, 500):
        g = annual(simulate(None)); s = annual(simulate(30, "smart", lam=lam))
        assert s["cost"] + lam * s["co2_t"] <= g["cost"] + lam * g["co2_t"] + 5   # small cycling slack
