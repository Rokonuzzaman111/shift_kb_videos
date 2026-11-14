"""Script ↔ whisper word alignment (robust): every script word gets the time of the whisper word it matches.

Usage: python -I -X utf8 scripts/nvidia_align3.py
In:  scripts/nvidia_script.md (what was read), work/nvidia/whisper_win.json (what whisper heard, with times)
Out: src/nvidia/vo-words.json, and a phrase table printed for checking.
Method: Needleman–Wunsch over the two word sequences with a character-similarity score (Bangla spellings from
whisper are noisy), then unmatched script words are interpolated by letter weight between matched neighbours.
"""
import difflib
import json
import pathlib
import re
import unicodedata

ROOT = pathlib.Path(__file__).resolve().parent.parent
LAST_WORD = "লিখুন।"

md = (ROOT / "scripts" / "nvidia_script.md").read_text(encoding="utf-8")
text = " ".join(l for l in re.findall(r"🎙️ (.+)", md) if not l.startswith("=")).replace("**", "")
S = text.split()
S = S[: S.index(LAST_WORD) + 1]
Wh = json.loads((ROOT / "work" / "nvidia" / "whisper_win.json").read_text(encoding="utf-8"))

DIG = str.maketrans("০১২৩৪৫৬৭৮৯", "0123456789")


def norm(s):
    s = s.translate(DIG).lower()
    s = re.sub(r"[,।?!\.\"“”‘’'\-:;]", "", s)
    s = "".join(c for c in s if unicodedata.category(c)[0] in "LN" or unicodedata.category(c) == "Mn")
    # merge common whisper confusions
    for a, b in (("ঁ", ""), ("়", ""), ("ৈ", "ই"), ("ী", "ি"), ("ূ", "ু"), ("শ", "স"), ("ষ", "স"), ("ণ", "ন"), ("য", "জ"), ("ড়", "র"), ("ঢ়", "র"), ("ং", "ঙ")):
        s = s.replace(a, b)
    return s


def sim(a, b):
    if not a or not b:
        return 0.0
    return difflib.SequenceMatcher(None, a, b).ratio()


sn = [norm(w) for w in S]
wn = [norm(w["w"]) for w in Wh]
n, m = len(S), len(Wh)
GAP = -0.45
score = [[0.0] * (m + 1) for _ in range(n + 1)]
bt = [[0] * (m + 1) for _ in range(n + 1)]
for i in range(1, n + 1):
    score[i][0] = i * GAP
    bt[i][0] = 1
for j in range(1, m + 1):
    score[0][j] = j * GAP
    bt[0][j] = 2
for i in range(1, n + 1):
    si = sn[i - 1]
    for j in range(1, m + 1):
        s = sim(si, wn[j - 1])
        d = score[i - 1][j - 1] + (s * 2 - 0.9)
        u = score[i - 1][j] + GAP
        l = score[i][j - 1] + GAP
        if d >= u and d >= l:
            score[i][j], bt[i][j] = d, 0
        elif u >= l:
            score[i][j], bt[i][j] = u, 1
        else:
            score[i][j], bt[i][j] = l, 2
i, j = n, m
match = [None] * n
while i > 0 or j > 0:
    b = bt[i][j] if i > 0 and j > 0 else (1 if i > 0 else 2)
    if b == 0:
        if sim(sn[i - 1], wn[j - 1]) >= 0.5:
            match[i - 1] = j - 1
        i, j = i - 1, j - 1
    elif b == 1:
        i -= 1
    else:
        j -= 1

# enforce monotonic times
times = [None] * n
last = -1.0
for k, mj in enumerate(match):
    if mj is not None and Wh[mj]["s"] > last:
        times[k] = (Wh[mj]["s"], Wh[mj]["e"])
        last = Wh[mj]["s"]


def weight(w):
    return max(1.5, sum(1 for c in w if unicodedata.category(c)[0] == "L"))


# interpolate gaps by letter weight between matched anchors
anch = [k for k in range(n) if times[k]]
out = [None] * n
for k in anch:
    out[k] = list(times[k])
first, lastk = anch[0], anch[-1]
for k in range(first):  # before first anchor
    out[k] = [max(0, out[first][0] - 0.3 * (first - k)), max(0, out[first][0] - 0.3 * (first - k) + 0.25)]
for a, b in zip(anch, anch[1:]):
    if b - a <= 1:
        continue
    t0, t1 = out[a][1], out[b][0]
    ws = [weight(S[k]) for k in range(a + 1, b)]
    tot = sum(ws)
    acc = 0.0
    for k, wt in zip(range(a + 1, b), ws):
        s = t0 + (t1 - t0) * acc / tot
        e = t0 + (t1 - t0) * (acc + wt) / tot
        out[k] = [s, e]
        acc += wt
for k in range(lastk + 1, n):
    out[k] = [out[lastk][1] + 0.3 * (k - lastk - 1), out[lastk][1] + 0.3 * (k - lastk)]

res = [{"text": S[k], "startMs": round(out[k][0] * 1000), "endMs": round(max(out[k][1], out[k][0] + 0.06) * 1000)} for k in range(n)]
(ROOT / "src" / "nvidia" / "vo-words.json").write_text(json.dumps(res, ensure_ascii=False, indent=0), encoding="utf-8")
cur = []
for k, w in enumerate(res):
    cur.append(w)
    if re.search(r"[।?!]$", w["text"]):
        print(f"{cur[0]['startMs']/1000:7.2f}-{cur[-1]['endMs']/1000:7.2f}  {' '.join(x['text'] for x in cur)}")
        cur = []
print(f"matched {len(anch)}/{n} script words")
