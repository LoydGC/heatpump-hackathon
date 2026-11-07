# Heat Pump Sizing in Cold Climates

MIT Climate Hackathon, COMSOL challenge.

## Challenge statement

Heat pumps offer an energy-efficient alternative to conventional heating systems, but their efficiency and heating capacity depend strongly on outdoor temperature. In colder climates, selecting the right heat pump capacity involves balancing competing trade-offs.

An oversized heat pump may meet heating demand even during extreme cold, but can result in higher upfront costs and potentially higher operating costs due to inefficient operation during non-peak conditions. Conversely, an undersized heat pump may operate efficiently during milder conditions but require greater reliance on supplemental heating during colder periods, potentially increasing both operating costs and carbon emissions.

**Your challenge:** Is it better to undersize a heat pump and rely more heavily on supplemental heating, or to size the heat pump to meet heating demands under extreme weather conditions? Is there a strategy that offers the best balance between cost and carbon emissions?

- Consider different supplemental heating sources (e.g., natural gas, wood, electricity), their efficiencies, operating costs, and impacts on carbon emissions.
- Explore how the optimal strategy may vary depending on local climate conditions, such as those in Boston, Massachusetts; Montreal, Canada; or Fairbanks, Alaska.

## Run locally / deploy

See [docs/local-and-deploy.md](docs/local-and-deploy.md).

## Project records

- [docs/DECISIONS.md](docs/DECISIONS.md): decision log (why).
- [docs/AUDIT.md](docs/AUDIT.md): audit trail of changes, merges, deploys and settings (what, when, who).
- [docs/INTERFACES.md](docs/INTERFACES.md): what UI, Model and Data each provide to and need from the others.
- [docs/WORKSTREAMS.md](docs/WORKSTREAMS.md): which folders/files belong to which workstream.
- [model/README.md](model/README.md): how to run the model and use `model/results/frontend_data.json`.
- [data/README.md](data/README.md): contents and sources of the Minneapolis data pack (`data/raw/`, `data/processed/`).
- [docs/ACTIVITY.md](docs/ACTIVITY.md): auto-generated digest of commits by workstream, author and branch. Refresh by double-clicking `update-activity-windows.bat` or `update-activity-mac.command`, then commit.

Entries are tagged by workstream: UI, Model, Data, or Infra (cross-cutting). When you change something, add a row to AUDIT.md in the same push, a DECISIONS.md entry if it was a decision, and update INTERFACES.md if a handoff changed.
