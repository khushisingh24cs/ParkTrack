import os
from flask import Flask, jsonify, request
from flask_cors import CORS
import dfa, classifier

app = Flask(__name__)
CORS(app)
SAMPLES = ["KA01AB1234", "KA05A1234", "ka01ab1234", "KA 01-AB 1234", "KA01AB123", "KA01AB12345",
           "KAO1AB1234", "01KAAB1234", "KA01ABC1234", "KA01@B1234", "", "KA 011 2020",
           "PV21", "PV2", "PV211", "pv21", "P21V", "PV2!"]

def compare_one(s):
    v = dfa.vehicle_dfa(s); c = dfa.code_dfa(s)
    vr, cr = dfa.vehicle_regex(s), dfa.code_regex(s)
    return {"input": s, "normalized": dfa.normalize(s),
            "vehicle": {"dfa": v["accepted"], "regex": vr, "agree": v["accepted"] == vr},
            "code": {"dfa": c["accepted"], "regex": cr, "agree": c["accepted"] == cr}}

@app.get("/health")
def health(): return jsonify(status="ok")

@app.post("/validate")
def validate():
    b = request.get_json(silent=True) or {}
    out = {}
    for key, fn, rx in (("vehicleNumber", dfa.vehicle_dfa, dfa.vehicle_regex),
                        ("violationCode", dfa.code_dfa, dfa.code_regex)):
        raw = b.get(key, "")
        r = fn(raw); x = rx(raw)
        out[key] = {"normalized": dfa.normalize(raw), "dfaResult": r["accepted"],
                    "regexResult": x, "agree": r["accepted"] == x,
                    "trace": r["trace"], "errors": r["errors"]}
    out["valid"] = out["vehicleNumber"]["dfaResult"] and out["violationCode"]["dfaResult"]
    return jsonify(out)

@app.post("/classify")
def classify():
    b = request.get_json(silent=True) or {}
    code = dfa.normalize(b.get("violationCode", ""))
    if not dfa.code_dfa(code)["accepted"]:
        return jsonify(error="Invalid violation code format"), 400
    return jsonify(classifier.classify(code, b.get("description", "")))

@app.post("/compare")
def compare():
    items = (request.get_json(silent=True) or {}).get("strings") or SAMPLES
    rows = [compare_one(str(s)) for s in items]
    return jsonify(results=rows, allAgree=all(r["vehicle"]["agree"] and r["code"]["agree"] for r in rows))

if __name__ == "__main__":
    app.run(port=int(os.getenv("PORT", 5001)))
