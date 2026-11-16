"""List / download free-licence photos from Wikimedia Commons for the Svalbard reel.

  python -I -X utf8 scripts/fetch_svalbard_imgs.py list            # write work/svalbard/img_candidates.json
  python -I -X utf8 scripts/fetch_svalbard_imgs.py get name=File:… # download chosen files (1600 px) + CREDITS

Only CC0 / Public domain / CC BY / CC BY-SA files are accepted. Output: public/svalbard/img/<name>.jpg,
public/svalbard/img/CREDITS.txt. Generic User-Agent, no personal data.
"""
import json
import pathlib
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "svalbard" / "img"
CAND = ROOT / "work" / "svalbard" / "img_candidates.json"
API = "https://commons.wikimedia.org/w/api.php"
UA = {"User-Agent": "remotion-reel-asset-fetch/1.0 (educational video)"}
OK = re.compile(r"^(cc0|public domain|pd|cc by(-sa)? ?[0-9.]*)", re.I)

QUERIES = [
    ("cat", "Category:Svalbard Global Seed Vault"),
    ("search", "Svalbard Global Seed Vault interior"),
    ("search", "Svalbard Global Seed Vault entrance winter"),
    ("search", "Longyearbyen panorama"),
    ("search", "Svalbard mountains snow aerial"),
    ("search", "Svalbard polar night aurora"),
    ("search", "ICARDA genebank"),
    ("search", "Aleppo destruction 2016"),
    ("search", "genebank seed storage jars"),
    ("search", "rice paddy Bangladesh"),
    ("search", "seed bank cold storage boxes"),
]


def fetch(url):
    for k in range(6):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code != 429:
                raise
            time.sleep(5 * (k + 1))
    raise SystemExit("rate limited: " + url)


def api(params):
    q = urllib.parse.urlencode({**params, "format": "json"})
    return json.loads(fetch(f"{API}?{q}"))


def info(titles):
    d = api({"action": "query", "titles": "|".join(titles), "prop": "imageinfo", "iiprop": "url|size|extmetadata", "iiurlwidth": 1600})
    out = []
    for p in d.get("query", {}).get("pages", {}).values():
        ii = (p.get("imageinfo") or [{}])[0]
        md = ii.get("extmetadata", {})
        lic = md.get("LicenseShortName", {}).get("value", "")
        art = re.sub("<[^>]+>", "", md.get("Artist", {}).get("value", "")).strip()
        if not ii.get("thumburl") or not OK.match(lic.strip()):
            continue
        if not p["title"].lower().endswith((".jpg", ".jpeg", ".png")):
            continue
        out.append({"title": p["title"], "w": ii.get("width"), "h": ii.get("height"), "lic": lic, "artist": art[:80], "thumb": ii["thumburl"], "page": ii.get("descriptionurl")})
    return out


def listing():
    titles = []
    for kind, q in QUERIES:
        if kind == "cat":
            d = api({"action": "query", "list": "categorymembers", "cmtitle": q, "cmtype": "file", "cmlimit": 80})
            titles += [m["title"] for m in d["query"]["categorymembers"]]
        else:
            d = api({"action": "query", "list": "search", "srsearch": q, "srnamespace": 6, "srlimit": 12})
            titles += [m["title"] for m in d["query"]["search"]]
        time.sleep(2)
    titles = list(dict.fromkeys(titles))
    res = []
    for i in range(0, len(titles), 40):
        res += info(titles[i : i + 40])
        time.sleep(2)
    CAND.parent.mkdir(parents=True, exist_ok=True)
    CAND.write_text(json.dumps(res, ensure_ascii=False, indent=1), encoding="utf-8")
    for k, r in enumerate(res):
        print(k, r["w"], "x", r["h"], r["lic"], "|", r["title"])


def get(pairs):
    cand = {c["title"]: c for c in json.loads(CAND.read_text(encoding="utf-8"))}
    OUT.mkdir(parents=True, exist_ok=True)
    cred = OUT / "CREDITS.txt"
    lines = cred.read_text(encoding="utf-8").splitlines() if cred.exists() else []
    for pr in pairs:
        name, title = pr.split("=", 1)
        c = cand[title]
        dst = OUT / f"{name}.jpg"
        dst.write_bytes(fetch(c["thumb"]))
        lines = [l for l in lines if not l.startswith(f"{name}.jpg:")]
        lines.append(f"{name}.jpg: {c['title']} | {c['artist']} | {c['lic']} | {c['page']}")
        print("ok", name, dst.stat().st_size // 1024, "KB")
        time.sleep(2)
    cred.write_text("\n".join(lines) + "\n", encoding="utf-8")


if __name__ == "__main__":
    if sys.argv[1] == "list":
        listing()
    else:
        get(sys.argv[2:])
