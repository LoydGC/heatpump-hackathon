"""Heat pump capital cost equation (NREL regression, 2023 dollars, installed, before rebates)."""


def capital_cost(size_kbtuh):
    """Installed cost ($) of a heat pump. size_kbtuh = nominal capacity in kBtu/h (valid 18-60)."""
    return 1196.1 * size_kbtuh + 768.87


if __name__ == "__main__":
    print(capital_cost(30))   # 7142.7
