from pathlib import Path
from PIL import Image, ImageChops

root = Path(__file__).resolve().parents[1]
baseline = root / "design-lab-v5" / "evidence" / "baseline"
final_root = root / "output" / "playwright" / "evolution" / "final-originals"
failures = []

for version in range(1, 5):
    for size in ("1920x1080", "390x844"):
        name = f"test-{version:02d}-{size}.png"
        before = Image.open(baseline / name).convert("RGBA")
        after = Image.open(final_root / size / name).convert("RGBA")
        diff = ImageChops.difference(before, after)
        if diff.getbbox() is not None:
            failures.append(name)

if failures:
    raise SystemExit("Visual regression detected: " + ", ".join(failures))
print("Original Version 1–4 visual regression check passed at desktop and mobile (8/8 pixel-identical renders).")
