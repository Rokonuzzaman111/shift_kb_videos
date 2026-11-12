"""Download the approved CC0 Poly Haven assets into public/assets/.

Usage: python -I scripts/fetch_assets.py
"""
import pathlib
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent / "public" / "assets"
BASE = "https://dl.polyhaven.org/file/ph-assets"

FILES = {
    "hdri/kloppenheim_06_puresky_2k.hdr": f"{BASE}/HDRIs/hdr/2k/kloppenheim_06_puresky_2k.hdr",
    "hdri/studio_small_09_2k.hdr": f"{BASE}/HDRIs/hdr/2k/studio_small_09_2k.hdr",
}
for tex in ["concrete_wall_008", "metal_plate", "rock_boulder_dry"]:
    for m in ["diff", "nor_gl", "rough", "arm"]:
        FILES[f"tex/{tex}/{tex}_{m}_2k.jpg"] = f"{BASE}/Textures/jpg/2k/{tex}/{tex}_{m}_2k.jpg"

for rel, url in FILES.items():
    out = ROOT / rel
    if out.exists():
        continue
    out.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": "remotion-asset-fetch/1.0"})
    out.write_bytes(urllib.request.urlopen(req, timeout=120).read())
    print("ok", rel, out.stat().st_size // 1024, "KB")
