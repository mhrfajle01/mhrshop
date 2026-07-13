import React from "react";
import { formatCurrency, formatDate } from "../utils/formatters";
import { useData } from "../context/DataContext";

export default function SalesInvoice({ sale }) {
  const { settings } = useData();

  if (!sale) return null;

  // Fallback to default shop details if settings are not loaded
  const shopName = settings?.shopName || "আমার দোকান";
  const shopPhone = settings?.phone || "017XXXXXXXX";
  const shopAddress = settings?.address || "বাংলাদেশ";
  const footerNote = settings?.footerNote || "আবার আসবেন, ধন্যবাদ!";

  return (
    <div className="p-4 border bg-white mx-auto printable-invoice" style={{ maxWidth: "420px", fontSize: "13px" }}>
      {/* Receipt Header */}
      <div className="text-center mb-3">
        <h3 className="fw-bold m-0 text-dark" style={{ fontSize: "18px" }}>{shopName}</h3>
        <p className="text-muted m-0 fs-8">{shopAddress}</p>
        <p className="text-muted m-0 fs-8">মোবাইল: {shopPhone}</p>
        <div className="border-bottom my-2"></div>
        <h4 className="m-0 fw-semibold text-uppercase font-monospace" style={{ fontSize: "13px", letterSpacing: "1px" }}>Retail Invoice</h4>
      </div>

      {/* Invoice Details info */}
      <div className="row g-1 mb-3">
        <div className="col-6">
          <span className="text-muted font-monospace">Invoice No:</span>
          <div className="fw-bold text-dark font-monospace" style={{ fontSize: "11px" }}>{sale.invoiceNumber}</div>
        </div>
        <div className="col-6 text-end">
          <span className="text-muted font-monospace">Date:</span>
          <div className="fw-semibold text-dark">{formatDate(sale.date, "DD/MM/YYYY")}</div>
        </div>
        <div className="col-12 mt-1">
          <span className="text-muted font-monospace">Customer:</span>
          <div className="fw-semibold text-dark">{sale.customerName || "খুচরা ক্রেতা"}</div>
          {sale.customerPhone && <div className="text-muted font-monospace" style={{ fontSize: "11px" }}>Tel: {sale.customerPhone}</div>}
        </div>
      </div>

      {/* Items list Table */}
      <table className="table table-sm table-borderless align-middle mb-3">
        <thead>
          <tr className="border-bottom border-top font-monospace text-muted" style={{ fontSize: "11px" }}>
            <th scope="col" style={{ width: "50%" }}>Item Description</th>
            <th scope="col" className="text-center" style={{ width: "20%" }}>Qty</th>
            <th scope="col" className="text-end" style={{ width: "30%" }}>Price</th>
          </tr>
        </thead>
        <tbody>
          {sale.items.map((item, idx) => (
            <tr key={idx} className="border-bottom border-light">
              <td>
                <span className="fw-semibold text-dark">{item.productName}</span>
                <span className="text-muted d-block font-monospace" style={{ fontSize: "10px" }}>
                  {formatCurrency(item.sellingPrice)} / {item.unit || "Pcs"}
                </span>
              </td>
              <td className="text-center font-monospace">{item.quantity}</td>
              <td className="text-end font-monospace fw-semibold">
                {formatCurrency(item.sellingPrice * item.quantity)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pricing Summary */}
      <div className="d-flex flex-column gap-1 border-bottom pb-2 mb-2 font-monospace">
        <div className="d-flex justify-content-between">
          <span className="text-muted">Sub Total:</span>
          <span className="fw-semibold">{formatCurrency(sale.totalAmount)}</span>
        </div>
        {sale.discount > 0 && (
          <div className="d-flex justify-content-between text-danger">
            <span>Discount (-):</span>
            <span>{formatCurrency(sale.discount)}</span>
          </div>
        )}
        {sale.taxAmount > 0 && (
          <div className="d-flex justify-content-between">
            <span>VAT/Tax (+):</span>
            <span>{formatCurrency(sale.taxAmount)}</span>
          </div>
        )}
        <div className="d-flex justify-content-between fs-6 fw-bold border-top pt-1 mt-1 text-dark">
          <span>Net Payable:</span>
          <span>{formatCurrency(sale.payableAmount)}</span>
        </div>
      </div>

      {/* Payment details info */}
      <div className="d-flex flex-column gap-1 border-bottom pb-2 mb-3 font-monospace">
        <div className="d-flex justify-content-between text-success">
          <span>Paid ({sale.paymentMethod}):</span>
          <span className="fw-bold">{formatCurrency(sale.paidAmount)}</span>
        </div>
        {sale.dueAmount > 0 && (
          <div className="d-flex justify-content-between text-danger">
            <span>Due Balance:</span>
            <span className="fw-bold">{formatCurrency(sale.dueAmount)}</span>
          </div>
        )}
      </div>

      {/* Invoice Footer */}
      <div className="text-center text-muted mt-2">
        <p className="m-0 text-dark fw-semibold" style={{ fontStyle: "italic", fontSize: "12px" }}>{footerNote}</p>
        <small className="fs-9 text-muted d-block mt-1 font-monospace" style={{ fontSize: "9px" }}>
          Powered by Shop Khata Pro
        </small>
      </div>
    </div>
  );
}
