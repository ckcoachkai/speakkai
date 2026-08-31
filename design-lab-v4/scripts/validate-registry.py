#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from collections import Counter
from pathlib import Path

registry_path = Path(sys.argv[1] if len(sys.argv) > 1 else "design-lab-v4/config/experiments.json")
data = json.loads(registry_path.read_text(encoding="utf-8"))
experiments = data["experiments"]

errors: list[str] = []
warnings: list[str] = []

numbers = [item["number"] for item in experiments]
if len(experiments) != 30:
    errors.append(f"Expected 30 experiments, found {len(experiments)}.")

if numbers != list(range(min(numbers), max(numbers) + 1)):
    errors.append("Experiment numbers are not contiguous and ordered.")

if len(set(numbers)) != len(numbers):
    errors.append("Duplicate experiment numbers found.")

titles = [item["title"] for item in experiments]
if len(set(titles)) != len(titles):
    errors.append("Duplicate experiment titles found.")

family_counts = Counter(item["family"] for item in experiments)
expected = {"corporate": 10, "fun-motion": 10, "modern": 10}
for family, count in expected.items():
    if family_counts[family] != count:
        errors.append(f"Expected {count} {family} concepts, found {family_counts[family]}.")

required = {
    "number", "slug", "family", "title", "primary_stakeholder", "hypothesis",
    "layout_archetype", "visual_language", "portrait_treatment", "interaction_model",
    "motion_language", "content_modules", "primary_cta", "signature", "avoid"
}
for item in experiments:
    missing = sorted(required - item.keys())
    if missing:
        errors.append(f"Test {item.get('number', '?')} missing fields: {', '.join(missing)}")

# Require at least six signature differences for every pair.
for i, left in enumerate(experiments):
    for right in experiments[i + 1:]:
        common = set(left["signature"]) & set(right["signature"])
        same = [key for key in common if left["signature"][key] == right["signature"][key]]
        differences = len(common) - len(same)
        if differences < 6:
            errors.append(
                f"Tests {left['number']} and {right['number']} differ in only "
                f"{differences} signature dimensions; shared: {', '.join(sorted(same))}"
            )

stakeholder_text = " ".join(item["primary_stakeholder"].lower() for item in experiments)
for keyword in ("parent", "student", "customer"):
    if keyword not in stakeholder_text:
        warnings.append(f"No primary stakeholder contains keyword '{keyword}'.")

print(f"Registry: {registry_path}")
print(f"Experiments: {len(experiments)}")
print(f"Families: {dict(family_counts)}")

if warnings:
    print("\nWarnings:")
    for warning in warnings:
        print(f"- {warning}")

if errors:
    print("\nErrors:")
    for error in errors:
        print(f"- {error}")
    raise SystemExit(1)

print("\nRegistry validation passed.")
