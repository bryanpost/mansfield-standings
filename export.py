# export.py — generate data.json from results.xlsx
#
# Run this locally after editing results.xlsx, then commit both files.
# GitHub Actions also runs this automatically on every push.
#
# Usage:
#   python export.py

import json
import pathlib
import engine

BASE   = pathlib.Path(__file__).parent
RESULTS = BASE / "results.xlsx"
CONFIG  = BASE / "config.csv"
OUTPUT  = BASE / "data.json"

data = engine.compute_all(RESULTS, CONFIG)

with open(OUTPUT, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, separators=(",", ":"))

print(f"Wrote {OUTPUT}  ({OUTPUT.stat().st_size:,} bytes)")
