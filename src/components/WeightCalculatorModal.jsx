import React, { useState } from "react";
import { BD_FRACTIONS, calculateWeightByPrice, gmToKg } from "../utils/unitConverter";

export default function WeightCalculatorModal({ product, onApply, onClose }) {
  const [mode, setMode] = useState("fraction"); // 'fraction' | 'gram' | 'money'
  const [gramInput, setGramInput] = useState("");
  const [moneyInput, setMoneyInput] = useState("");

  const unitPrice = product.sellingPrice || 0;

  const handleApplyFraction = (kgVal) => {
    onApply(product, kgVal);
    onClose();
  };

  const handleApplyGram = (e) => {
    e.preventDefault();
    const kgVal = gmToKg(gramInput);
    if (kgVal > 0) {
      onApply(product, kgVal);
      onClose();
    }
  };

  const handleApplyMoney = (e) => {
    e.preventDefault();
    const res = calculateWeightByPrice(moneyInput, unitPrice);
    if (res.qtyKg > 0) {
      onApply(product, res.qtyKg);
      onClose();
    }
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
      <div className="modal-dialog modal-dialog-centered modal-sm">
        <div className="modal-content" style={{ borderRadius: "14px" }}>
          <div className="modal-header py-2 px-3">
            <div>
              <h6 className="modal-title fw-bold mb-0">{product.name}</h6>
              <small className="text-muted">দর: ৳{unitPrice} / {product.unit || "কেজি"}</small>
            </div>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body p-3">
            {/* Mode switch buttons */}
            <div className="btn-group w-100 mb-3" role="group">
              <button
                className={`btn btn-sm ${mode === "fraction" ? "btn-success" : "btn-outline-secondary"}`}
                onClick={() => setMode("fraction")}
              >
                ভগ্নাংশ (পোয়া)
              </button>
              <button
                className={`btn btn-sm ${mode === "gram" ? "btn-success" : "btn-outline-secondary"}`}
                onClick={() => setMode("gram")}
              >
                গ্রাম (gm)
              </button>
              <button
                className={`btn btn-sm ${mode === "money" ? "btn-success" : "btn-outline-secondary"}`}
                onClick={() => setMode("money")}
              >
                ৳ টাকায়
              </button>
            </div>

            {/* Mode 1: Quick BD Fractions */}
            {mode === "fraction" && (
              <div className="d-flex flex-column gap-1.5">
                {BD_FRACTIONS.map(f => (
                  <button
                    key={f.gm}
                    type="button"
                    className="btn btn-sm btn-light border text-start d-flex justify-content-between align-items-center py-2"
                    onClick={() => handleApplyFraction(f.kg)}
                  >
                    <span>{f.label}</span>
                    <strong className="text-success">৳{Math.round(f.kg * unitPrice)}</strong>
                  </button>
                ))}
              </div>
            )}

            {/* Mode 2: Custom Grams */}
            {mode === "gram" && (
              <form onSubmit={handleApplyGram}>
                <div className="mb-2">
                  <label className="form-label" style={{ fontSize: "12px" }}>গ্রাম লিখুন (যেমন: 400)</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="যেমন: 350, 400"
                    value={gramInput}
                    onChange={e => setGramInput(e.target.value)}
                    autoFocus
                    required
                  />
                </div>
                {gramInput > 0 && (
                  <div className="p-2 border rounded bg-light mb-2 text-center" style={{ fontSize: "12px" }}>
                    ওজন: <strong>{gmToKg(gramInput)} কেজি</strong> | দাম: <strong className="text-success">৳{Math.round(gmToKg(gramInput) * unitPrice)}</strong>
                  </div>
                )}
                <button type="submit" className="btn btn-custom-primary w-100 btn-sm">
                  কার্টে যোগ করুন
                </button>
              </form>
            )}

            {/* Mode 3: Target Money */}
            {mode === "money" && (
              <form onSubmit={handleApplyMoney}>
                <div className="mb-2">
                  <label className="form-label" style={{ fontSize: "12px" }}>কাস্টমার যত টাকার নিতে চায়:</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="যেমন: 30 বা 50 টাকা"
                    value={moneyInput}
                    onChange={e => setMoneyInput(e.target.value)}
                    autoFocus
                    required
                  />
                </div>
                {moneyInput > 0 && (
                  <div className="p-2 border rounded bg-light mb-2 text-center" style={{ fontSize: "12px" }}>
                    হিসাব: <strong>{calculateWeightByPrice(moneyInput, unitPrice).weightGm} গ্রাম</strong> ({calculateWeightByPrice(moneyInput, unitPrice).qtyKg} কেজি)
                  </div>
                )}
                <button type="submit" className="btn btn-custom-primary w-100 btn-sm">
                  কার্টে যোগ করুন (৳{moneyInput || 0})
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
