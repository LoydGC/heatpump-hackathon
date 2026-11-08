def get_rebate(capital_cost: float, type: float):
    if type == 'full':
        # for income < 80% of AMI
        return min(capital_cost, 8000)
    elif type == 'partial':
        # for income between 80% and 150% of AMI
        return min(capital_cost, 4000)  
