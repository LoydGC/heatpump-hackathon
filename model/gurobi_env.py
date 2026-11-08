"""Gurobi model factory.

Uses a plain gp.Model(), which finds a license file on its own (GRB_LICENSE_FILE,
./gurobi.lic, ~/gurobi.lic). Only if no license file is found does it fall back to a
WLS license read from environment variables (never hard-code or commit these):

    GRB_WLSACCESSID, GRB_WLSSECRET, GRB_LICENSEID
"""
import os
from pathlib import Path

import gurobipy as gp


def _license_file_found() -> bool:
    env_path = os.environ.get("GRB_LICENSE_FILE")
    if env_path and Path(env_path).is_file():
        return True
    return any(p.is_file() for p in (Path.cwd() / "gurobi.lic", Path.home() / "gurobi.lic"))


def new_model(name: str = "model") -> gp.Model:
    if _license_file_found():
        return gp.Model(name)
    try:
        params = {
            "WLSACCESSID": os.environ["GRB_WLSACCESSID"],
            "WLSSECRET": os.environ["GRB_WLSSECRET"],
            "LICENSEID": int(os.environ["GRB_LICENSEID"]),
        }
    except KeyError:
        return gp.Model(name)  # let Gurobi raise its normal license error
    return gp.Model(name, env=gp.Env(params=params))
