def calculate_total_goals_score(prediction: dict, actual_result: dict, config: dict | None = None) -> float:
    return float(config.get("total_goals_points_exact", 0.0)) if config else 0.0
