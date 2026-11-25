"""Violation classification: code ranges (config) + description keywords + fixed priority."""
CATEGORIES = ["No-Permit", "Overstay", "Wrong-Zone", "Obstruction", "Disabled-Bay"]
CODE_RANGES = {"No-Permit": (10, 19), "Overstay": (20, 29), "Wrong-Zone": (30, 39),
               "Obstruction": (40, 49), "Disabled-Bay": (50, 59)}
KEYWORDS = {
    "Obstruction": ["blocking", "gate", "driveway"],
    "Disabled-Bay": ["wheelchair", "disabled"],
    "No-Permit": ["expired", "no permit"],
    "Overstay": ["hours", "overstay"],
    "Wrong-Zone": ["wrong bay", "wrong zone"],
}
PRIORITY = ["Disabled-Bay", "Obstruction", "Wrong-Zone", "Overstay", "No-Permit"]

def category_for_code(code):
    n = int(code[2:])
    for cat, (lo, hi) in CODE_RANGES.items():
        if lo <= n <= hi:
            return cat
    return None

def classify(code, description=""):
    code = (code or "").strip().upper()
    base = category_for_code(code)
    if base is None:  # never assign a category to unmapped codes, even with keywords
        return {"category": "UNMAPPED", "validationStatus": "Unmapped-Code", "candidates": [],
                "matchedPatterns": [], "reason": f"{code} is not mapped; sent to manual review"}
    desc = (description or "").lower()
    patterns = [(c, k) for c, ks in KEYWORDS.items() for k in ks if k in desc]
    cands = {base} | {c for c, _ in patterns}
    chosen = next(c for c in PRIORITY if c in cands)
    reason = (f"Code {code} maps to {base}" if len(cands) == 1 else
              f"Candidates {sorted(cands)}; priority Disabled-Bay > Obstruction > Wrong-Zone > "
              f"Overstay > No-Permit selects {chosen}")
    return {"category": chosen, "validationStatus": "Valid",
            "candidates": [c for c in PRIORITY if c in cands],
            "matchedPatterns": [{"category": c, "keyword": k} for c, k in patterns],
            "reason": reason}
