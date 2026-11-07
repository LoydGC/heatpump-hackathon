"""Run the full sizing sweep and save results + a cost-vs-CO2 plot per city.

    python scripts/run_sweep.py            # fetch weather (cached in data/raw)
    python scripts/run_sweep.py --offline  # synthetic weather, no network
"""
import argparse
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from heatpump_sizing.sweep import pareto_front, run_sweep

RESULTS = Path(__file__).resolve().parents[1] / "results"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--year", type=int, default=2023)
    ap.add_argument("--offline", action="store_true")
    args = ap.parse_args()

    df = run_sweep(year=args.year, offline=args.offline)
    RESULTS.mkdir(exist_ok=True)
    df.to_csv(RESULTS / "sweep.csv", index=False)

    for city, g in df.groupby("city"):
        fig, ax = plt.subplots(figsize=(7, 5))
        for backup, gb in g.groupby("backup"):
            sc = ax.scatter(gb.total_cost_usd_yr, gb.co2_kg_yr / 1000, label=backup, s=18)
        pf = pareto_front(g)
        ax.plot(pf.total_cost_usd_yr, pf.co2_kg_yr / 1000, "k--", lw=1, label="Pareto front")
        ax.set(title=f"{city}: annualized cost vs CO2 (each dot = one HP size)",
               xlabel="Total cost, $/yr (opex + annualized capex)", ylabel="CO2, t/yr")
        ax.legend()
        fig.tight_layout()
        fig.savefig(RESULTS / f"tradeoff_{city}.png", dpi=150)
        plt.close(fig)

    best = df.loc[df.groupby(["city", "backup"]).total_cost_usd_yr.idxmin(),
                  ["city", "backup", "hp_rated_kw", "hp_share", "total_cost_usd_yr", "co2_kg_yr"]]
    print("Cheapest HP size per city/backup:\n", best.round(2).to_string(index=False))


if __name__ == "__main__":
    main()
