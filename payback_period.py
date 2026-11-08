def get_payback_period(annual_savings: float, capital_cost: float) -> float:
    return capital_cost / annual_savings if annual_savings > 0 else float('inf')