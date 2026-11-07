# Heat Pump Sizing in Cold Climates

MIT Climate Hackathon, COMSOL challenge.

## Challenge

Heat pump efficiency and capacity drop as outdoor temperature falls. An **oversized** heat pump covers extreme cold but costs more up front and may run inefficiently at part load. An **undersized** one runs efficiently in mild weather but leans on supplemental heat during cold snaps, which can raise operating cost and emissions.

**Question:** Is it better to undersize and rely on supplemental heat, or size for extreme weather? Which strategy best balances cost and carbon?

- Compare supplemental sources (natural gas, wood, electric resistance, ...) on efficiency, operating cost and emissions.
- Compare climates: **Boston, MA**, **Montreal, QC**, **Fairbanks, AK**.

## Approach

1. **Weather**: hourly outdoor temperature per city (`weather.py`).
2. **Heating load**: hourly building demand from temperature (`load.py`, UA / balance-point model to start; calibrate with COMSOL).
3. **Heat pump model**: capacity and COP vs. outdoor temperature, with low-temp cutoff (`heatpump.py`).
4. **Dispatch**: each hour the heat pump serves what it can; supplemental heat covers the rest (`simulate.py`).
5. **Sweep**: heat pump size x backup source x city -> annualized cost and CO2; find the Pareto front (`sweep.py`).
6. **Answer**: recommended sizing strategy per city, and how sensitive it is to prices, grid carbon and wood-carbon assumptions.

All tunable assumptions live in `src/heatpump_sizing/parameters.py`. **Every number there is a placeholder** until someone verifies it and adds a source.

## Quick start

```bash
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
pytest                            # smoke tests
python scripts/run_sweep.py       # writes results/sweep.csv + tradeoff_<city>.png
```

`run_sweep.py` pulls hourly temps from the free Open-Meteo archive API and caches them in `data/raw/`. Use `--offline` for synthetic weather (no network).

## Layout

```
src/heatpump_sizing/   Python package (weather, load, heatpump, simulate, sweep, parameters)
scripts/               Command-line entry points
notebooks/             Exploration; name as NN_initials_topic.ipynb
comsol/                COMSOL .mph models + export notes
data/raw/              Downloaded inputs (git-ignored)
data/processed/        Cleaned inputs, COMSOL exports (git-ignored)
results/               Figures and tables (git-ignored; copy keepers into the slides)
tests/                 pytest
```

## Open questions / work to split up

- [ ] Verify cost, price, emissions and design-temp numbers in `parameters.py` (with sources)
- [ ] Real cold-climate heat pump performance data (NEEP ccASHP list or manufacturer tables)
- [ ] COMSOL building model -> hourly load profile; COMSOL heat pump cycle -> capacity/COP curves
- [ ] Part-load / cycling losses for oversized units
- [ ] Control strategy: switchover temperature vs. "heat pump first"
- [ ] Average vs. marginal grid CO2; wood as carbon-neutral vs. stack emissions
- [ ] Multi-year / extreme-year weather (cold snaps drive sizing)
- [ ] Final figures + slides

See [CONTRIBUTING.md](CONTRIBUTING.md) for team workflow.
