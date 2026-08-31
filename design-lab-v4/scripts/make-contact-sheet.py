#!/usr/bin/env python3
from __future__ import annotations

import argparse
import math
import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

parser = argparse.ArgumentParser()
parser.add_argument("input_dir", nargs="?", default=".artifacts/design-lab/screenshots")
parser.add_argument("--output", default=".artifacts/design-lab/contact-sheet.png")
parser.add_argument("--columns", type=int, default=5)
parser.add_argument("--thumb-width", type=int, default=360)
parser.add_argument("--label-height", type=int, default=34)
args = parser.parse_args()

input_dir = Path(args.input_dir)
files = sorted(
    input_dir.glob("test-*-1920x1080.png"),
    key=lambda path: int(re.search(r"test-(\d+)", path.name).group(1)),
)

if not files:
    raise SystemExit(f"No 1920x1080 screenshots found in {input_dir}")

thumb_w = args.thumb_width
thumb_h = round(thumb_w * 9 / 16)
cell_h = thumb_h + args.label_height
columns = args.columns
rows = math.ceil(len(files) / columns)

sheet = Image.new("RGB", (columns * thumb_w, rows * cell_h), "white")
draw = ImageDraw.Draw(sheet)
font = ImageFont.load_default()

for index, file in enumerate(files):
    row, col = divmod(index, columns)
    x = col * thumb_w
    y = row * cell_h

    image = Image.open(file).convert("RGB")
    image.thumbnail((thumb_w, thumb_h), Image.Resampling.LANCZOS)

    frame = Image.new("RGB", (thumb_w, thumb_h), "#eceff3")
    frame.paste(image, ((thumb_w - image.width) // 2, (thumb_h - image.height) // 2))
    sheet.paste(frame, (x, y))

    match = re.search(r"test-(\d+)", file.name)
    label = f"Test {int(match.group(1))}" if match else file.stem
    draw.rectangle((x, y + thumb_h, x + thumb_w, y + cell_h), fill="white")
    draw.text((x + 10, y + thumb_h + 10), label, fill="black", font=font)

output = Path(args.output)
output.parent.mkdir(parents=True, exist_ok=True)
sheet.save(output)
print(output)
