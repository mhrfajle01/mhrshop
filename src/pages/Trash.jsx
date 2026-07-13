import React, { useState } from "react";
import { useData } from "../context/DataContext";
import { useRouter } from "../context/RouterContext";
import { formatCurrency, formatDate } from "../utils/formatters";

export default function Trash() {
  const { trash, trashRestoreItem, trashPermanentDeleteItem, loading } = useData();
  const { navigateTo } = useRouter();

  // Tab state: 'catalog' | 'people' | 'transactions' | 'ledger'
  const [activeTab, setActiveTab] = useState("catalog");

  const handleRestore = async (collectionName, id, label) => {
    if (window.confirm(`আপনি কি "${label}" পুনরুদ্ধার (Restore) করতে চান?`)) {
      try {
        await trashRestoreItem(collectionName, id, label);
        alert("আইটেমটি পুনরুদ্ধার করা হয়েছে।");
      } catch (e) {
        alert("পুনরুদ্ধার করতে ব্যর্থ হয়েছে।");
      }
    }
  };

  const handlePermanentDelete = async (collectionName, id, label) => {
    const doubleConfirm = window.confirm(`স্থায়ীভাবে মুছে ফেললে "${label}" আর কখনো ফিরে পাওয়া যাবে না। বিক্রয় রসিদ হলে স্টক রিভার্স করা হবে। আপনি কি নিশ্চিত?`);
    if (doubleConfirm) {
      try {
        await trashPermanentDeleteItem(collectionName, id, label);
        alert("আইটেমটি স্থায়ীভাবে ডিলিট করা হয়েছে।");
      } catch (e) {
        alert("ডিলিট করতে ব্যর্থ হয়েছে।");
      }
    }
  };

  return (
    <div className="main-content">
      {/* Back button and title */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h2 className="h4 mb-1">Recycle Bin</h2>
          <p className="text-muted fs-7">মুছে ফেলা ফাইল পুনরুদ্ধার বা স্থায়ী অপসারণ খাতা</p>
        </div>
        <button 
          className="btn btn-sm btn-custom btn-custom-secondary font-monospace"
          onClick={() => navigateTo("/settings")}
        >
          <i className="bi bi-gear"></i> Settings
        </button>
      </div>

      {/* Tabs */}
      <ul className="nav nav-pills nav-fill mb-3 bg-light p-1 rounded" role="tablist">
        <li className="nav-item">
          <button 
            className={`nav-link font-monospace py-2 rounded-2 ${activeTab === "catalog" ? "active bg-success text-white" : "text-secondary"}`}
            onClick={() => setActiveTab("catalog")}
          >
            Catalog
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link font-monospace py-2 rounded-2 ${activeTab === "transactions" ? "active bg-success text-white" : "text-secondary"}`}
            onClick={() => setActiveTab("transactions")}
          >
            Bills
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link font-monospace py-2 rounded-2 ${activeTab === "people" ? "active bg-success text-white" : "text-secondary"}`}
            onClick={() => setActiveTab("people")}
          >
            People
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link font-monospace py-2 rounded-2 ${activeTab === "ledger" ? "active bg-success text-white" : "text-secondary"}`}
            onClick={() => setActiveTab("ledger")}
          >
            Ledger
          </button>
        </li>
      </ul>

      {/* TAB CONTENTS */}
      
      {/* 1. Catalog Tab (Products and Categories) */}
      {activeTab === "catalog" && (
        <div className="card-custom bg-white border border-light p-3">
          <h5 className="h6 text-muted font-monospace text-uppercase mb-3">Products & Categories in Trash</h5>
          
          {/* Categories */}
          <div className="mb-4">
            <h6 className="fw-bold border-bottom pb-1 mb-2">Deleted Categories</h6>
            {trash.categories.length === 0 ? (
              <p className="text-muted fs-8">কোনো ক্যাটাগরি ট্র্যাশে নেই।</p>
            ) : (
              trash.categories.map(cat => (
                <div key={cat.id} className="d-flex justify-content-between align-items-center py-2 border-bottom border-light fs-7">
                  <div>
                    <span className="fw-semibold">{cat.name}</span>
                    <small className="text-muted d-block font-monospace fs-9">Deleted: {formatDate(cat.deletedAt, "DD/MM hh:mm A")}</small>
                  </div>
                  <div className="d-flex gap-1">
                    <button className="btn btn-sm btn-outline-success font-monospace" onClick={() => handleRestore("categories", cat.id, `Category "${cat.name}"`)}>Restore</button>
                    <button className="btn btn-sm btn-outline-danger font-monospace" onClick={() => handlePermanentDelete("categories", cat.id, `Category "${cat.name}"`)}>Delete</button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Products */}
          <div>
            <h6 className="fw-bold border-bottom pb-1 mb-2">Deleted Products</h6>
            {trash.products.length === 0 ? (
              <p className="text-muted fs-8">কোনো পণ্য ট্র্যাশে নেই।</p>
            ) : (
              trash.products.map(prod => (
                <div key={prod.id} className="d-flex justify-content-between align-items-center py-2 border-bottom border-light fs-7">
                  <div>
                    <span className="fw-semibold">{prod.name}</span>
                    <small className="text-muted d-block font-monospace fs-9">Stock: {prod.stock} • Buy: {formatCurrency(prod.purchasePrice)}</small>
                  </div>
                  <div className="d-flex gap-1">
                    <button className="btn btn-sm btn-outline-success font-monospace" onClick={() => handleRestore("products", prod.id, `Product "${prod.name}"`)}>Restore</button>
                    <button className="btn btn-sm btn-outline-danger font-monospace" onClick={() => handlePermanentDelete("products", prod.id, `Product "${prod.name}"`)}>Delete</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 2. Transactions Tab (Sales, Purchases, Expenses) */}
      {activeTab === "transactions" && (
        <div className="card-custom bg-white border border-light p-3">
          <h5 className="h6 text-muted font-monospace text-uppercase mb-3">Bills & Expenses in Trash</h5>
          
          {/* Sales */}
          <div className="mb-4">
            <h6 className="fw-bold border-bottom pb-1 mb-2">Deleted Sales</h6>
            {trash.sales.length === 0 ? (
              <p className="text-muted fs-8">কোনো বিক্রয় রসিদ ট্র্যাশে নেই।</p>
            ) : (
              trash.sales.map(sale => (
                <div key={sale.id} className="d-flex justify-content-between align-items-center py-2 border-bottom border-light fs-7">
                  <div>
                    <span className="fw-semibold font-monospace text-success">{sale.invoiceNumber}</span>
                    <small className="text-muted d-block">{sale.customerName} • Total: {formatCurrency(sale.payableAmount)}</small>
                  </div>
                  <div className="d-flex gap-1">
                    <button className="btn btn-sm btn-outline-success font-monospace" onClick={() => handleRestore("sales", sale.id, `Sale invoice ${sale.invoiceNumber}`)}>Restore</button>
                    <button className="btn btn-sm btn-outline-danger font-monospace" onClick={() => handlePermanentDelete("sales", sale.id, `Sale invoice ${sale.invoiceNumber}`)}>Delete</button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Purchases */}
          <div className="mb-4">
            <h6 className="fw-bold border-bottom pb-1 mb-2">Deleted Purchases</h6>
            {trash.purchases.length === 0 ? (
              <p className="text-muted fs-8">কোনো ক্রয় চালান ট্র্যাশে নেই।</p>
            ) : (
              trash.purchases.map(pur => (
                <div key={pur.id} className="d-flex justify-content-between align-items-center py-2 border-bottom border-light fs-7">
                  <div>
                    <span className="fw-semibold font-monospace text-info">{pur.invoiceNumber}</span>
                    <small className="text-muted d-block">{pur.supplierName} • Bill: {formatCurrency(pur.totalAmount)}</small>
                  </div>
                  <div className="d-flex gap-1">
                    <button className="btn btn-sm btn-outline-success font-monospace" onClick={() => handleRestore("purchases", pur.id, `Purchase invoice ${pur.invoiceNumber}`)}>Restore</button>
                    <button className="btn btn-sm btn-outline-danger font-monospace" onClick={() => handlePermanentDelete("purchases", pur.id, `Purchase invoice ${pur.invoiceNumber}`)}>Delete</button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Expenses */}
          <div>
            <h6 className="fw-bold border-bottom pb-1 mb-2">Deleted Expenses</h6>
            {trash.expenses.length === 0 ? (
              <p className="text-muted fs-8">কোনো খরচের ভাউচার ট্র্যাশে নেই।</p>
            ) : (
              trash.expenses.map(exp => (
                <div key={exp.id} className="d-flex justify-content-between align-items-center py-2 border-bottom border-light fs-7">
                  <div>
                    <span className="fw-semibold text-danger">{exp.category}</span>
                    <small className="text-muted d-block">Amount: {formatCurrency(exp.amount)} • Note: {exp.description || "-"}</small>
                  </div>
                  <div className="d-flex gap-1">
                    <button className="btn btn-sm btn-outline-success font-monospace" onClick={() => handleRestore("expenses", exp.id, `Expense ৳${exp.amount}`)}>Restore</button>
                    <button className="btn btn-sm btn-outline-danger font-monospace" onClick={() => handlePermanentDelete("expenses", exp.id, `Expense ৳${exp.amount}`)}>Delete</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 3. People Tab (Customers & Suppliers) */}
      {activeTab === "people" && (
        <div className="card-custom bg-white border border-light p-3">
          <h5 className="h6 text-muted font-monospace text-uppercase mb-3">Customer & Supplier Profiles in Trash</h5>
          
          {/* Customers */}
          <div className="mb-4">
            <h6 className="fw-bold border-bottom pb-1 mb-2">Deleted Customers</h6>
            {trash.customers.length === 0 ? (
              <p className="text-muted fs-8">কোনো কাস্টমার ট্র্যাশে নেই।</p>
            ) : (
              trash.customers.map(cust => (
                <div key={cust.id} className="d-flex justify-content-between align-items-center py-2 border-bottom border-light fs-7">
                  <div>
                    <span className="fw-semibold">{cust.name}</span>
                    <small className="text-muted d-block">Tel: {cust.phone || "-"} • Due: {formatCurrency(cust.due)}</small>
                  </div>
                  <div className="d-flex gap-1">
                    <button className="btn btn-sm btn-outline-success font-monospace" onClick={() => handleRestore("customers", cust.id, `Customer "${cust.name}"`)}>Restore</button>
                    <button className="btn btn-sm btn-outline-danger font-monospace" onClick={() => handlePermanentDelete("customers", cust.id, `Customer "${cust.name}"`)}>Delete</button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Suppliers */}
          <div>
            <h6 className="fw-bold border-bottom pb-1 mb-2">Deleted Suppliers</h6>
            {trash.suppliers.length === 0 ? (
              <p className="text-muted fs-8">কোনো সাপ্লায়ার ট্র্যাশে নেই।</p>
            ) : (
              trash.suppliers.map(supp => (
                <div key={supp.id} className="d-flex justify-content-between align-items-center py-2 border-bottom border-light fs-7">
                  <div>
                    <span className="fw-semibold">{supp.name}</span>
                    <small className="text-muted d-block">Tel: {supp.phone || "-"} • We owe: {formatCurrency(supp.due)}</small>
                  </div>
                  <div className="d-flex gap-1">
                    <button className="btn btn-sm btn-outline-success font-monospace" onClick={() => handleRestore("suppliers", supp.id, `Supplier "${supp.name}"`)}>Restore</button>
                    <button className="btn btn-sm btn-outline-danger font-monospace" onClick={() => handlePermanentDelete("suppliers", supp.id, `Supplier "${supp.name}"`)}>Delete</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 4. Ledger Tab (Khata manual entries) */}
      {activeTab === "ledger" && (
        <div className="card-custom bg-white border border-light p-3">
          <h5 className="h6 text-muted font-monospace text-uppercase mb-3">Ledger Entries in Trash</h5>
          
          {trash.khata.length === 0 ? (
            <p className="text-muted fs-8 py-3 text-center">কোনো বকেয়া খাতা জার্নাল ট্র্যাশে নেই।</p>
          ) : (
            trash.khata.map(entry => (
              <div key={entry.id} className="d-flex justify-content-between align-items-center py-2 border-bottom border-light fs-7">
                <div>
                  <span className="fw-semibold">{entry.partyName} ({entry.partyType === "customer" ? "কাস্টমার" : "সাপ্লায়ার"})</span>
                  <small className="text-muted d-block">Amount: {formatCurrency(entry.amount)} • {entry.type === "payment" ? "জমা" : "বাকী"}</small>
                  <small className="text-muted d-block text-wrap text-truncate" style={{ maxWidth: "200px" }}>{entry.description}</small>
                </div>
                <div className="d-flex gap-1">
                  <button className="btn btn-sm btn-outline-success font-monospace" onClick={() => handleRestore("khata", entry.id, `Ledger entry ৳${entry.amount}`)}>Restore</button>
                  <button className="btn btn-sm btn-outline-danger font-monospace" onClick={() => handlePermanentDelete("khata", entry.id, `Ledger entry ৳${entry.amount}`)}>Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
