import itertools, pytest, dfa, classifier
from app import app

def test_trace_and_errors():
    r = dfa.vehicle_dfa("KA011234")
    assert not r["accepted"] and "Incomplete: ended in non-accepting state" in r["errors"][0] or r["errors"]
    assert "Rejected at character 5: expected letter, got digit" in dfa.vehicle_dfa("KA01" + "1234")["errors"][0]
    assert dfa.vehicle_dfa("KA01AB1234")["finalState"] == "q10"
    assert dfa.vehicle_dfa("KA01AB123")["errors"][0].startswith("Incomplete")

def test_ka_011_2020_rejected():
    assert not dfa.vehicle_dfa("KA 011 2020")["accepted"] and not dfa.vehicle_regex("KA 011 2020")

def test_exhaustive_agreement():
    alphabet = "AB1 -@"
    for n in range(0, 6):
        for t in itertools.product(alphabet, repeat=n):
            s = "".join(t)
            assert dfa.vehicle_dfa(s)["accepted"] == dfa.vehicle_regex(s)
            assert dfa.code_dfa(s)["accepted"] == dfa.code_regex(s)
    for s in ["KA01AB1234", "KA05A1234", "KA01ABC1234", "KA01A12345", "PV21", "PV2", "PV211"]:
        assert dfa.vehicle_dfa(s)["accepted"] == dfa.vehicle_regex(s)
        assert dfa.code_dfa(s)["accepted"] == dfa.code_regex(s)

@pytest.mark.parametrize("code,desc,cat", [
    ("PV12", "", "No-Permit"), ("PV25", "", "Overstay"), ("PV35", "", "Wrong-Zone"),
    ("PV45", "", "Obstruction"), ("PV55", "", "Disabled-Bay"),
    ("PV12", "blocking a gate", "Obstruction"),
    ("PV12", "blocking wheelchair ramp, disabled", "Disabled-Bay"),
    ("PV25", "wrong zone", "Wrong-Zone"),
    ("PV12", "expired", "No-Permit")])
def test_classify(code, desc, cat):
    assert classifier.classify(code, desc)["category"] == cat

@pytest.mark.parametrize("code", ["PV00", "PV99", "PV60", "PV09"])
def test_unmapped_stays_unmapped(code):
    r = classifier.classify(code, "blocking a disabled wheelchair gate")
    assert r["category"] == "UNMAPPED" and r["validationStatus"] == "Unmapped-Code"

def test_api():
    c = app.test_client()
    r = c.post("/validate", json={"vehicleNumber": "ka-01 ab 1234", "violationCode": "PV21"}).get_json()
    assert r["valid"] and r["vehicleNumber"]["agree"]
    assert c.post("/classify", json={"violationCode": "XX1"}).status_code == 400
    assert c.post("/compare", json={}).get_json()["allAgree"]
