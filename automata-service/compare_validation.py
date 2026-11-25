import dfa
CASES = [("KA01AB1234", "valid, 2 letters"), ("KA05A1234", "valid, 1 letter"), ("ka01ab1234", "lowercase (normalized)"),
         ("KA-01 AB-1234", "spaces/hyphens (normalized)"), ("KA01AB123", "too short"), ("KA01AB12345", "too long"),
         ("01KAAB1234", "wrong order"), ("KAO1AB1234", "letter O for zero"), ("KA01ABC1234", "3 series letters"),
         ("KA01@B1234", "special char"), ("", "empty"), ("KA 011 2020", "wrong format"),
         ("PV21", "valid code"), ("PV2", "code too short"), ("PV211", "code too long"), ("P21V", "code wrong order"),
         ("PV2!", "code special char"), ("pv21", "code lowercase")]
print(f"{'Input':<18}{'Case':<30}{'V-DFA':<7}{'V-RE':<7}{'C-DFA':<7}{'C-RE':<7}")
for s, label in CASES:
    vd, vr = dfa.vehicle_dfa(s)["accepted"], dfa.vehicle_regex(s)
    cd, cr = dfa.code_dfa(s)["accepted"], dfa.code_regex(s)
    print(f"{s!r:<18}{label:<30}{vd!s:<7}{vr!s:<7}{cd!s:<7}{cr!s:<7}")
    assert vd == vr and cd == cr, f"DFA/regex disagree on {s!r}"
print(f"\nAll {len(CASES)} strings: DFA and regex agree.")
