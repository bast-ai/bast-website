"""Re-render src/assets/og/bast-share.png from bast-share.html.

Manual, optional tool (not part of `pnpm verify`). Uses the real Bast logo and
Estedad fonts from src/assets; no generated imagery. Requires Playwright and a
Chromium/Chrome binary:

    python3 scripts/og-image/render.py [--chrome /usr/bin/google-chrome]
"""
import argparse
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
OUT = ROOT / "src/assets/og/bast-share.png"

parser = argparse.ArgumentParser()
parser.add_argument("--chrome", help="Path to a Chrome/Chromium executable")
args = parser.parse_args()

raw = HERE / "bast-share.raw.png"
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=args.chrome) if args.chrome else p.chromium.launch()
    page = browser.new_page(viewport={"width": 1200, "height": 630})
    page.goto((HERE / "bast-share.html").as_uri())
    page.evaluate("document.fonts.ready")
    page.wait_for_timeout(300)
    page.screenshot(path=str(raw), clip={"x": 0, "y": 0, "width": 1200, "height": 630})
    browser.close()

# 128-colour palette keeps the flat card sharp and well under 300 KB.
Image.open(raw).convert("RGB").quantize(colors=128, method=Image.Quantize.MEDIANCUT).save(OUT, optimize=True)
raw.unlink()
print(f"Wrote {OUT.relative_to(ROOT)}")
