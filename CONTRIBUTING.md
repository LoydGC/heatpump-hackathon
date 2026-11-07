# Team workflow

- **Branch per task**: `name/short-topic` (e.g. `gavin/cop-curves`). Open a PR to `main`; anyone can review and merge. Keep PRs small so we can merge fast.
- **Run `pytest` before pushing.** Add a quick test when you add a model.
- **Assumptions go in `parameters.py`** with a source in the comment. Don't hard-code numbers inside models.
- **Data**: don't commit large files. Downloaded data goes in `data/raw/` (ignored). Share big files via the team Drive and link them in the README.
- **Notebooks**: for exploration. Once something works, move the logic into `src/heatpump_sizing/` and call it from the notebook. Clear outputs before committing to keep diffs readable.
- **COMSOL**: see `comsol/README.md`. `.mph` files can't be merged, so claim a file before editing.
- **Units**: SI internally (deg C, kW, kWh, kg CO2), costs in USD. Convert at the edges.
