# Analytics UX Design

## Overview
The Analytics module provides deep visual insights into competition progress, model performance, and judging patterns.

## Sections
1. **Competition Overview**: High-level aggregated statistics.
2. **Model Performance**: Visualizing AI accuracy and trends.
3. **Presentation Analysis**: Strengths, weaknesses, and criteria breakdowns.
4. **Judge Analytics**: Variance and consistency tracking among human evaluators.

## Chart & Design System Rules
- **Theming**: All charts must strictly follow the GOALGORITHM color theme.
  - Allowed: Muted Gold (`#D4AF37`), Blue (`#2563EB`), Light Blue (`#38BDF8`), White (`#FFFFFF`), Gray (`#94A3B8`).
  - Forbidden: Pink, purple, or any randomly generated chart palettes.
- **Sizing**: Charts must be readable, responsive, and properly constrained (not oversized/full-screen).
- **Spacing**: Consistent padding and margins matching the standard card components.

## Model Performance UX
- Visualizes the pipeline: `Uploaded Model → Run Against Test Dataset → Generate Predictions → Calculate Accuracy → Compare Team Models`.
- Displays the best performing model, version improvement over time (line charts), and accuracy trends.

## Judge Analytics UX
- **Normalization**: Criteria must be normalized to percentages for fair comparison.
  - Example: Q&A (4/5) and Feature (12/15) must both be displayed as 80% to accurately reflect judge behavior across differently-weighted criteria.
- **Display**: Show the strictest judge, most generous judge, scoring variance, and criteria preferences.
- **Privacy**: Display human-readable judge names, **never** raw UUIDs.
