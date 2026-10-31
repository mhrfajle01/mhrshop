import React, { useState } from "react";

export default function TeaPhysicalNotebook({
  date,
  openingFloat,
  cashSales,
  dueSales,
  totalExpense,
  expectedCash,
  netProfit,
  itemCounts
}) {
  const [copied, setCopied] = useState(false);

  const notebookText = `====================================
📅 তারিখ: ${date} (চা স্টল দৈনিক হিসাব)
====================================
১. সকালের প্রারম্ভিক ক্যাশ:      ৳ ${openingFloat}
২. (+) নগদ চা ও নাস্তা বিক্রি:  ৳ ${cashSales}
   ---------------------------------
   মোট নগদ জমা:                ৳ ${openingFloat + cashSales}

৩. (-) দুধ, চিনি ও গ্যাস খরচ:   ৳ ${totalExpense}
   ---------------------------------
   💰 ড্রয়ারে নগদ ক্যাশ থাকা লাগবে: ৳ ${expectedCash}
   🌟 আজকের নিট লাভ (Profit):  ৳ ${netProfit}
   📝 আজকের নতুন বাকি:          ৳ ${dueSales}
====================================
আইটেম বিক্রির তালিকা:
${Object.entries(itemCounts).map(([name, qty]) => `- ${name}: ${qty} টি/কাপ`).join("\n") || "কোনো বিক্রি নেই"}
====================================`;

  const handleCopy = () => {
    navigator.clipboard.writeText(notebookText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card-custom p-3 bg-white border">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <span className="fw-bold" style={{ fontSize: "13px" }}>
          📖 কাগজের ডায়েরি/খাতায় তোলার রেডিমেড ফরম্যাট
        </span>
        <button
          className="btn btn-sm btn-outline-dark py-0 px-2"
          style={{ fontSize: "11px" }}
          onClick={handleCopy}
        >
          <i className="bi bi-clipboard me-1"></i>
          {copied ? "কপি হয়েছে!" : "টেক্সট কপি"}
        </button>
      </div>

      <pre
        className="p-2 border rounded bg-light mb-0"
        style={{
          fontSize: "11px",
          whiteSpace: "pre-wrap",
          fontFamily: "monospace",
          maxHeight: "180px",
          overflowY: "auto"
        }}
      >
        {notebookText}
      </pre>
    </div>
  );
}
