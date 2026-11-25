"""Hand-coded DFAs (explicit transition tables, no regex) plus equivalent regex versions."""
import re

DEAD = "dead"
L, D = "letter", "digit"

def normalize(s):
    """Uppercase and strip whitespace and hyphens."""
    return "".join(c for c in (s or "") if not c.isspace() and c != "-").upper()

def _vehicle_class(ch):
    if "A" <= ch <= "Z": return L
    if "0" <= ch <= "9": return D
    return "other"

def _code_class(ch):
    if ch in ("P", "V"): return ch
    if "0" <= ch <= "9": return D
    return "other"

VEHICLE = {
    "classify": _vehicle_class, "start": "q0", "accept": {"q10"},
    "table": {
        "q0": {L: "q1"}, "q1": {L: "q2"}, "q2": {D: "q3"}, "q3": {D: "q4"},
        "q4": {L: "q5"}, "q5": {L: "q6", D: "q7"}, "q6": {D: "q7"},
        "q7": {D: "q8"}, "q8": {D: "q9"}, "q9": {D: "q10"},
    },
}
CODE = {
    "classify": _code_class, "start": "q0", "accept": {"q4"},
    "table": {"q0": {"P": "q1"}, "q1": {"V": "q2"}, "q2": {D: "q3"}, "q3": {D: "q4"}},
}

def _expected(dfa, state):
    return " or ".join(sorted(dfa["table"].get(state, {}))) or "end of input"

def run_dfa(dfa, text):
    """Returns {accepted, finalState, trace, errors}. Trace = state after each character."""
    state, trace, errors = dfa["start"], [], []
    for i, ch in enumerate(text, 1):
        cls = dfa["classify"](ch)
        nxt = dfa["table"].get(state, {}).get(cls, DEAD)
        trace.append({"position": i, "char": ch, "from": state, "to": nxt})
        if nxt == DEAD:
            got = cls if cls != "other" else f"'{ch}'"
            errors.append(f"Rejected at character {i}: expected {_expected(dfa, state)}, got {got}")
            state = DEAD
            break
        state = nxt
    accepted = state in dfa["accept"]
    if not accepted and state != DEAD:
        errors.append("Empty input" if not text else
                      f"Incomplete: ended in non-accepting state {state}")
    return {"accepted": accepted, "finalState": state, "trace": trace, "errors": errors}

VEHICLE_RE = re.compile(r"[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}")
CODE_RE = re.compile(r"PV[0-9]{2}")

def vehicle_dfa(s): return run_dfa(VEHICLE, normalize(s))
def code_dfa(s): return run_dfa(CODE, normalize(s))
def vehicle_regex(s): return VEHICLE_RE.fullmatch(normalize(s)) is not None
def code_regex(s): return CODE_RE.fullmatch(normalize(s)) is not None
