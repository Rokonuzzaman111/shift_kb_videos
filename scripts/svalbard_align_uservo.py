"""Align the creator's tightened VO to the script and split it into the 5 parts.

  python -I -X utf8 scripts/svalbard_align_uservo.py

In:  work/svalbard/uservo/vo_tight.wav, whisper.json; script lines = PARTS in scripts/tts_svalbard.py
Out: public/svalbard/vo/p1..p5.wav (part audio), src/svalbard/vo/p1..p5.json ([{text,startMs,endMs,line}], part time)
     work/svalbard/uservo/align_report.txt

Method: DP-align whisper words to script words (fuzzy match). Matched words take whisper times. Runs of
unmatched script words (whisper dropped a few windows) are spread over the SPEECH-ONLY time between the
surrounding anchors, measured with a fine silencedetect, proportional to word length. Part cuts sit in the
middle of the pause after each part's last word. Captions use the script spelling, with "স্বালবার্ড"
written the creator's way: "স্‌ভালবার্ড".
"""
import difflib
import json
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
from tts_svalbard import PARTS  # noqa: E402

W = ROOT / "work" / "svalbard" / "uservo"
TIGHT = W / "vo_tight.wav"
SV_OLD, SV_NEW = "স্বালবার্ড", "স্‌ভালবার্ড"
NUM = {"14": "চৌদ্দ", "45": "পঁয়তাল্লিশ", "2008": "দুই হাজার আট", "130": "একশো ত্রিশ", "21": "একুশটা", "2015": "দুই হাজার পনেরো"}

PUNCT = re.compile(r"[,.;:!?।\"“”‘’'()\-–—‌‍]")


def norm(s: str) -> str:
    s = PUNCT.sub("", s)
    # collapse vowel signs that whisper mixes up, keep consonant skeleton
    return re.sub(r"[ািীুূৃেৈোৌংঃঁ়্]", "", s)


def script_words():
    out = []
    for pi, part in enumerate(["p1", "p2", "p3", "p4", "p5"]):
        for li, line in enumerate(PARTS[part]):
            for t in line.replace(SV_OLD, SV_NEW).split():
                out.append({"text": t, "part": pi, "line": li})
    return out


def whisper_words():
    raw = json.loads((W / "whisper.json").read_text(encoding="utf-8"))
    out = []
    for x in raw:
        w = x["w"].strip()
        if w in NUM:  # split spoken numbers into their script words, sharing the time
            parts = NUM[w].split()
            d = (x["e"] - x["s"]) / len(parts)
            for k, p in enumerate(parts):
                out.append({"w": p, "s": x["s"] + k * d, "e": x["s"] + (k + 1) * d})
        else:
            out.append({"w": w, "s": x["s"], "e": x["e"]})
    return out


def sim(a: str, b: str) -> float:
    na, nb = norm(a), norm(b)
    if not na or not nb:
        return 0.0
    return difflib.SequenceMatcher(None, na, nb).ratio()


def align(S, Wh):
    n, m = len(S), len(Wh)
    GAP = -0.45
    dp = [[0.0] * (m + 1) for _ in range(n + 1)]
    bt = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        dp[i][0] = dp[i - 1][0] + GAP
        bt[i][0] = 1
    for j in range(1, m + 1):
        dp[0][j] = dp[0][j - 1] + GAP * 0.3
        bt[0][j] = 2
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            s = sim(S[i - 1]["text"], Wh[j - 1]["w"])
            best, b = dp[i - 1][j - 1] + (s * 2 - 0.9), 0
            if dp[i - 1][j] + GAP > best:
                best, b = dp[i - 1][j] + GAP, 1
            if dp[i][j - 1] + GAP * 0.3 > best:
                best, b = dp[i][j - 1] + GAP * 0.3, 2
            dp[i][j], bt[i][j] = best, b
    i, j, pairs = n, m, {}
    while i > 0 and j > 0:
        b = bt[i][j]
        if b == 0:
            if sim(S[i - 1]["text"], Wh[j - 1]["w"]) >= 0.5:
                pairs[i - 1] = j - 1
            i, j = i - 1, j - 1
        elif b == 1:
            i -= 1
        else:
            j -= 1
    return pairs


def speech_intervals(total: float):
    r = subprocess.run(["ffmpeg", "-i", str(TIGHT), "-af", "silencedetect=noise=-40dB:d=0.18", "-f", "null", "-"], capture_output=True, text=True)
    ss = [float(x) for x in re.findall(r"silence_start: ([0-9.]+)", r.stderr)]
    se = [float(x) for x in re.findall(r"silence_end: ([0-9.]+)", r.stderr)]
    if len(se) < len(ss):
        se.append(total)
    sil = list(zip(ss, se))
    sp, cur = [], 0.0
    for a, b in sil:
        if a > cur:
            sp.append((cur, a))
        cur = b
    if cur < total:
        sp.append((cur, total))
    return sp, sil


def spread(words, t0, t1, sp):
    """place words over speech time inside [t0, t1], proportional to length"""
    segs = [(max(a, t0), min(b, t1)) for a, b in sp if b > t0 and a < t1]
    segs = [(a, b) for a, b in segs if b - a > 0.04] or [(t0, t1)]
    tot = sum(b - a for a, b in segs)
    lens = [max(2, len(norm(w["text"])) + 1) for w in words]
    L = sum(lens)
    acc = 0.0

    def at(x):  # x in [0, tot] speech-time → real time
        for a, b in segs:
            if x <= b - a:
                return a + x
            x -= b - a
        return segs[-1][1]

    for w, l in zip(words, lens):
        s = acc / L * tot
        acc += l
        e = acc / L * tot
        w["s"], w["e"] = at(s), at(e) - 0.02


def main():
    total = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(TIGHT)], capture_output=True, text=True).stdout)
    S, Wh = script_words(), whisper_words()
    pairs = align(S, Wh)
    sp, sil = speech_intervals(total)

    def speech_between(t0, t1):
        return sum(max(0.0, min(b, t1) - max(a, t0)) for a, b in sp)

    # keep only plausible anchors: short/common words need a strong match, and the speech time between
    # consecutive anchors must fit the unmatched words (0.16–0.9 s of speech per word)
    pairs = {i: j for i, j in pairs.items() if sim(S[i]["text"], Wh[j]["w"]) >= (0.8 if len(norm(S[i]["text"])) <= 2 else 0.55)}
    changed = True
    while changed:
        changed = False
        keys = sorted(pairs)
        bounds = [(-1, None)] + [(i, pairs[i]) for i in keys] + [(len(S), None)]
        for (i0, j0), (i1, j1) in zip(bounds, bounds[1:]):
            k = i1 - i0 - 1
            t0 = Wh[j0]["e"] if j0 is not None else 0.0
            t1 = Wh[j1]["s"] if j1 is not None else total
            T = speech_between(t0, t1)
            bad = (k > 0 and T / k < 0.16) or (k == 0 and T > 1.6) or (k > 0 and T / k > 1.2 and k < 3)
            if bad:
                # drop the weaker of the two anchors (never the virtual ends)
                cand = [(sim(S[i]["text"], Wh[pairs[i]]["w"]), i) for i in (i0, i1) if i in pairs]
                if cand:
                    del pairs[min(cand)[1]]
                    changed = True
                    break
    for i, j in pairs.items():
        S[i]["s"], S[i]["e"] = Wh[j]["s"], Wh[j]["e"]
    # fill unmatched runs
    i = 0
    while i < len(S):
        if "s" in S[i]:
            i += 1
            continue
        k = i
        while k < len(S) and "s" not in S[k]:
            k += 1
        t0 = S[i - 1]["e"] if i > 0 else 0.0
        t1 = S[k]["s"] if k < len(S) else total
        spread(S[i:k], t0, t1, sp)
        i = k
    # monotonic clean-up
    for a, b in zip(S, S[1:]):
        if b["s"] < a["s"] + 0.03:
            b["s"] = a["s"] + 0.03
        if a["e"] > b["s"]:
            a["e"] = b["s"] - 0.01
    # snap every script line to the real pauses (whisper times run ~0.4 s early): line start → nearest pause END,
    # line end → nearest pause START; words inside the line are remapped linearly.
    r = subprocess.run(["ffmpeg", "-i", str(TIGHT), "-af", "silencedetect=noise=-34dB:d=0.25", "-f", "null", "-"], capture_output=True, text=True)
    ps = [float(x) for x in re.findall(r"silence_start: ([0-9.]+)", r.stderr)]
    pe = [float(x) for x in re.findall(r"silence_end: ([0-9.]+)", r.stderr)]
    if len(pe) < len(ps):
        pe.append(total)
    groups = []
    for idx, w in enumerate(S):
        key = (w["part"], w["line"])
        if not groups or groups[-1][0] != key:
            groups.append((key, []))
        groups[-1][1].append(idx)
    snapped = 0
    prev_end = 0.0
    for gi, (_, ids) in enumerate(groups):
        ls, le = S[ids[0]]["s"], S[ids[-1]]["e"]
        cs = [e for e in pe if abs(e - ls) <= 1.0 and e >= prev_end - 0.01] or [e for e in pe if abs(e - ls) <= 2.0 and e >= prev_end - 0.01]
        ns = min(cs, key=lambda e: abs(e - ls)) + 0.02 if cs else ls
        if gi == 0 and not cs:
            ns = max(ls, pe[0] if pe and pe[0] < 1.0 else ls)
        ce = [s for s in ps if abs(s - le) <= 1.0 and s > ns + 0.3]
        ne = min(ce, key=lambda s: abs(s - le)) if ce else le
        if gi + 1 < len(groups):
            nxt = S[groups[gi + 1][1][0]]["s"]
            ce2 = [s for s in ps if ns + 0.3 < s <= max(nxt, le) + 0.6]
            if ce2:
                ne = min(ce2, key=lambda s: abs(s - le))
        if cs or ce:
            snapped += 1
        k = (ne - ns) / max(1e-3, le - ls)
        for i in ids:
            S[i]["s"] = ns + (S[i]["s"] - ls) * k
            S[i]["e"] = ns + (S[i]["e"] - ls) * k
        prev_end = ne
    print(f"snapped {snapped}/{len(groups)} lines to pauses")
    # part cuts: middle of the silence after each part's last word
    cuts = [0.0]
    for pi in range(4):
        last = max(w["e"] for w in S if w["part"] == pi)
        nxt = min(w["s"] for w in S if w["part"] == pi + 1)
        gaps = [(a, b) for a, b in sil if a >= last - 0.1 and b <= nxt + 0.1]
        cuts.append((gaps[0][0] + gaps[0][1]) / 2 if gaps else (last + nxt) / 2)
    cuts.append(total)
    out_wav = ROOT / "public" / "svalbard" / "vo"
    out_js = ROOT / "src" / "svalbard" / "vo"
    rep = [f"total {total:.2f}s, matched {len(pairs)}/{len(S)} script words to whisper"]
    for pi in range(5):
        a, b = cuts[pi], cuts[pi + 1]
        lead = 0.0 if pi == 0 else 0.0
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(TIGHT), "-ss", f"{a:.4f}", "-to", f"{b:.4f}", "-ar", "48000", "-ac", "1", str(out_wav / f"p{pi + 1}.wav")], check=True)
        js = [{"text": w["text"], "startMs": round((w["s"] - a + lead) * 1000, 1), "endMs": round((w["e"] - a + lead) * 1000, 1), "line": w["line"]} for w in S if w["part"] == pi]
        (out_js / f"p{pi + 1}.json").write_text(json.dumps(js, ensure_ascii=False, indent=1), encoding="utf-8")
        filled = sum(1 for k, w in enumerate(S) if w["part"] == pi and k not in pairs)
        rep.append(f"p{pi + 1}: {a:7.2f}–{b:7.2f}s ({b - a:5.2f}s) words {len(js)}, interpolated {filled}")
    for w in S:
        if w["text"] == SV_NEW:
            rep.append(f"  {SV_NEW} @ part {w['part'] + 1} {w['s']:.2f}s")
    (W / "align_report.txt").write_text("\n".join(rep), encoding="utf-8")
    print("\n".join(rep))


if __name__ == "__main__":
    main()
