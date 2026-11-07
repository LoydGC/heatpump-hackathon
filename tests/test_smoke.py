import numpy as np

from heatpump_sizing.heatpump import HeatPump
from heatpump_sizing.load import heating_load_kw
from heatpump_sizing.simulate import simulate_year
from heatpump_sizing.sweep import pareto_front, run_sweep
from heatpump_sizing.weather import synthetic_temps


def test_bigger_hp_covers_more_load():
    t = synthetic_temps("montreal")
    load = heating_load_kw(t)
    small = simulate_year(t, load, HeatPump(4), "montreal", "gas")
    big = simulate_year(t, load, HeatPump(16), "montreal", "gas")
    assert big["hp_share"] > small["hp_share"]
    assert 0 <= small["hp_share"] <= 1


def test_hp_off_below_cutoff():
    hp = HeatPump(10, cutoff_c=-30)
    assert hp.capacity_kw(-35) == 0
    assert np.isnan(hp.cop(-35))


def test_sweep_and_pareto():
    df = run_sweep(cities=["boston"], backups=["gas", "electric"], sizes_kw=[4, 8, 12], offline=True)
    assert len(df) == 6
    assert len(pareto_front(df)) >= 1
