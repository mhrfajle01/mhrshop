import React, { useState, useEffect } from "react";
import { useData } from "../context/DataContext";
import { useRouter } from "../context/RouterContext";
import { formatCurrency } from "../utils/formatters";
import SalesInvoice from "../components/SalesInvoice";
import dayjs from "dayjs";

export default function SalesNew() {
  const { 
    products, 
    categories, 
    customers, 
    addNewSale, 
    addNewCustomer, 
    settings 
  } = useData();
  const { navigateTo } = useRouter();

  // Cart State
  const [cart, setCart] = useState([]);
  
  // Search & Filters
  const [productQuery, setProductQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Checkout Form State
  const [selectedCustomer, setSelectedCustomer] = useState(""); // customerId
  const [discount, setDiscount] = useState("0");
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [invoiceDate, setInvoiceDate] = useState(dayjs().format("YYYY-MM-DD"));

  // Quick Customer Creation
  const [quickCustName, setQuickCustName] = useState("");
  const [quickCustPhone, setQuickCustPhone] = useState("");
  const [showQuickCust, setShowQuickCust] = useState(false);

  // Success Modal state
  const [createdSale, setCreatedSale] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto calculate total
  const subtotal = cart.reduce((acc, item) => acc + (item.sellingPrice * item.quantity), 0);
  const taxPercent = settings?.taxPercent || 0;
  const taxAmount = Number(((subtotal * taxPercent) / 100).toFixed(2));
  const totalPayable = Math.max(0, subtotal - Number(discount) + taxAmount);
  
  // Due amount calculation
  const calculatedPaidAmount = paidAmount === "" ? 0 : Number(paidAmount);
  const dueAmount = Math.max(0, totalPayable - calculatedPaidAmount);

  // Auto set paid amount to total if empty or user clicks Full Paid
  const handleFullPaid = () => {
    setPaidAmount(totalPayable.toString());
  };

  // Cart Operations
  const addToCart = (product) => {
    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) {
        alert(`দুঃখিত! এই পণ্যের পর্যাপ্ত স্টক নেই। বর্তমান স্টক: ${product.stock}`);
        return;
      }
      setCart(cart.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      if (product.stock <= 0) {
        if (!window.confirm("পণ্যের স্টক নেই (0 স্টক)। আপনি কি তবুও বিক্রয় করতে চান?")) {
          return;
        }
      }
      setCart([...cart, {
        productId: product.id,
        productName: product.name,
        purchasePrice: product.purchasePrice,
        sellingPrice: product.sellingPrice,
        quantity: 1,
        unit: product.unit || "Piece",
        stockLimit: product.stock
      }]);
    }
    setProductQuery(""); // Clear search
  };

  const updateCartQty = (productId, qty) => {
    const item = cart.find(i => i.productId === productId);
    if (!item) return;

    const newQty = Math.max(1, Number(qty));
    if (newQty > item.stockLimit) {
      alert(`দুঃখিত! এই পণ্যের পর্যাপ্ত স্টক নেই। বর্তমান স্টক: ${item.stockLimit}`);
      return;
    }

    setCart(cart.map(i => 
      i.productId === productId ? { ...i, quantity: newQty } : i
    ));
  };

  const updateCartPrice = (productId, price) => {
    const newPrice = Math.max(0, Number(price));
    setCart(cart.map(i => 
      i.productId === productId ? { ...i, sellingPrice: newPrice } : i
    ));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  // Handle Quick Customer Add
  const handleQuickCustomer = async (e) => {
    e.preventDefault();
    if (!quickCustName.trim()) return;

    try {
      const res = await addNewCustomer({
        name: quickCustName.trim(),
        phone: quickCustPhone.trim(),
        due: 0
      });
      setSelectedCustomer(res.id);
      setQuickCustName("");
      setQuickCustPhone("");
      setShowQuickCust(false);
      alert("কাস্টমার প্রোফাইল যোগ করা হয়েছে।");
    } catch (e) {
      alert("কাস্টমার সেভ করতে সমস্যা হয়েছে।");
    }
  };

  // Checkout submission
  const handleCheckout = async () => {
    if (loading) return;
    setError("");
    if (cart.length === 0) {
      setError("কার্ট খালি! অনুগ্রহ করে বিক্রয়ের জন্য পণ্য যোগ করুন।");
      return;
    }

    if (Number(discount) < 0 || Number(paidAmount) < 0) {
      setError("ডিসকাউন্ট বা পরিশোধিত টাকা ঋণাত্মক (Negative) হতে পারবে না।");
      return;
    }

    const customerObj = customers.find(c => c.id === selectedCustomer);

    const saleData = {
      invoiceNumber: "INV-" + dayjs().format("YYYYMMDD-HHmmss") + "-" + Math.floor(1000 + Math.random() * 9000),
      date: invoiceDate,
      items: cart,
      totalAmount: subtotal,
      discount: Number(discount),
      taxAmount: taxAmount,
      payableAmount: totalPayable,
      paidAmount: calculatedPaidAmount,
      dueAmount: dueAmount,
      paymentMethod,
      customerId: selectedCustomer || null,
      customerName: customerObj ? customerObj.name : "খুচরা ক্রেতা",
      customerPhone: customerObj ? customerObj.phone : ""
    };

    try {
      setLoading(true);
      const res = await addNewSale(saleData);
      setLoading(false);
      setCreatedSale(res);
      
      // Clear checkout fields
      setCart([]);
      setSelectedCustomer("");
      setDiscount("0");
      setPaidAmount("");
      
      // Open success modal
      const modalEl = document.getElementById("checkoutSuccessModal");
      if (modalEl) {
        const modal = new window.bootstrap.Modal(modalEl);
        modal.show();
      }
    } catch (err) {
      setLoading(false);
      setError("বিক্রয় রসিদ তৈরি করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    }
  };

  // Filter products list based on search and category
  const filteredProducts = products.filter(p => {
    const matchesQuery = p.name.toLowerCase().includes(productQuery.toLowerCase()) || 
                         (p.barcode && p.barcode.includes(productQuery));
    const matchesCat = selectedCategory === "All" || p.category === selectedCategory;
    return matchesQuery && matchesCat;
  });

  return (
    <div className="main-content">
      {/* Title */}
      <div className="d-flex justify-content-between align-items-center mb-3 no-print">
        <div>
          <h2 className="h4 mb-1">New Sale (POS)</h2>
          <p className="text-muted fs-7">সহজেই ক্যাশ মেমো ও বিক্রয় রসিদ তৈরি করুন</p>
        </div>
        <button 
          className="btn btn-sm btn-custom btn-custom-secondary font-monospace"
          onClick={() => navigateTo("/sales")}
        >
          <i className="bi bi-x-circle"></i> Cancel
        </button>
      </div>

      {error && <div className="alert alert-danger py-2 fs-7 mb-3 no-print">{error}</div>}

      <div className="row g-3">
        {/* Left Side: Product Selector */}
        <div className="col-12 col-md-7 no-print">
          <div className="card-custom bg-white border border-light p-3">
            <h3 className="h6 text-muted text-uppercase mb-3 font-monospace">Select Products</h3>
            
            {/* Search Input */}
            <div className="search-container mb-2">
              <i className="bi bi-search"></i>
              <input 
                type="text" 
                className="form-control" 
                placeholder="পণ্যের নাম অথবা বারকোড..."
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
              />
            </div>

            {/* Category pills */}
            <div className="mb-3" style={{ overflowX: "auto", display: "flex", paddingBottom: "6px" }}>
              <span 
                className={`category-pill ${selectedCategory === "All" ? "active" : ""}`}
                onClick={() => setSelectedCategory("All")}
              >
                All
              </span>
              {categories.map(c => (
                <span 
                  key={c.id} 
                  className={`category-pill ${selectedCategory === c.name ? "active" : ""}`}
                  onClick={() => setSelectedCategory(c.name)}
                >
                  {c.name}
                </span>
              ))}
            </div>

            {/* Matching Products results list */}
            <div className="border rounded bg-light p-2" style={{ maxHeight: "200px", overflowY: "auto" }}>
              {filteredProducts.length === 0 ? (
                <div className="text-center text-muted fs-8 py-3">কোনো পণ্য পাওয়া যায়নি</div>
              ) : (
                filteredProducts.slice(0, 15).map(prod => (
                  <div 
                    key={prod.id} 
                    className="d-flex justify-content-between align-items-center p-2 mb-1 bg-white rounded border cursor-pointer pointer-active"
                    onClick={() => addToCart(prod)}
                  >
                    <div>
                      <div className="fw-semibold fs-7">{prod.name}</div>
                      <small className="text-muted fs-9">স্টক: {prod.stock} {prod.unit || "পিস"}</small>
                    </div>
                    <div className="text-end">
                      <span className="badge bg-success-subtle text-success fs-8">{formatCurrency(prod.sellingPrice)}</span>
                      <i className="bi bi-plus-circle text-success ms-2 fs-6 align-middle"></i>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Cart list section */}
          <div className="card-custom bg-white border border-light p-3 mt-3">
            <h3 className="h6 text-muted text-uppercase mb-3 font-monospace">Cart Items</h3>
            {cart.length === 0 ? (
              <div className="text-center py-5 text-muted fs-8">
                <i className="bi bi-cart-x fs-2 d-block mb-2"></i>
                কার্ট খালি! উপর থেকে ক্লিক করে পণ্য যোগ করুন।
              </div>
            ) : (
              <div className="cart-list" style={{ maxHeight: "300px", overflowY: "auto" }}>
                {cart.map((item) => (
                  <div key={item.productId} className="pos-item-row">
                    <div className="pe-2" style={{ width: "40%" }}>
                      <div className="fw-semibold fs-7 text-truncate">{item.productName}</div>
                      <span className="text-muted fs-9">স্টক: {item.stockLimit}</span>
                    </div>
                    
                    <div className="d-flex align-items-center justify-content-center" style={{ width: "30%" }}>
                      <button 
                        className="btn btn-sm btn-light border p-1"
                        onClick={() => updateCartQty(item.productId, item.quantity - 1)}
                      >
                        -
                      </button>
                      <input 
                        type="number" 
                        className="pos-input mx-1 fs-7"
                        value={item.quantity}
                        onChange={(e) => updateCartQty(item.productId, e.target.value)}
                      />
                      <button 
                        className="btn btn-sm btn-light border p-1"
                        onClick={() => updateCartQty(item.productId, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>

                    <div className="d-flex align-items-center justify-content-end text-end" style={{ width: "30%" }}>
                      <div className="me-2">
                        <input 
                          type="number" 
                          className="pos-input text-end fs-7 font-monospace"
                          style={{ width: "65px" }}
                          value={item.sellingPrice}
                          onChange={(e) => updateCartPrice(item.productId, e.target.value)}
                        />
                        <small className="d-block text-muted" style={{ fontSize: "9px" }}>Total: {formatCurrency(item.sellingPrice * item.quantity)}</small>
                      </div>
                      <button 
                        className="btn btn-sm btn-outline-danger border-0 p-1"
                        onClick={() => removeFromCart(item.productId)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Invoice Summary & Customer selection */}
        <div className="col-12 col-md-5 no-print">
          <div className="card-custom bg-white border border-light p-3">
            <h3 className="h6 text-muted text-uppercase mb-3 font-monospace">Bill Settlement</h3>

            {/* Date field */}
            <div className="mb-3">
              <label className="form-label text-muted fs-8 font-monospace">Invoice Date</label>
              <input 
                type="date" 
                className="form-control form-control-sm"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
              />
            </div>

            {/* Customer Dropdown */}
            <div className="mb-3">
              <div className="d-flex justify-content-between mb-1">
                <label className="form-label text-muted fs-8 font-monospace m-0">Customer</label>
                <button 
                  className="btn btn-link p-0 fs-8 text-success text-decoration-none font-monospace"
                  onClick={() => setShowQuickCust(!showQuickCust)}
                >
                  <i className="bi bi-person-plus-fill"></i> Quick Add
                </button>
              </div>

              {showQuickCust ? (
                <div className="bg-light p-2 rounded mb-2 border border-success-subtle">
                  <div className="row g-2">
                    <div className="col-6">
                      <input 
                        type="text" 
                        placeholder="কাস্টমার নাম"
                        className="form-control form-control-sm fs-8"
                        value={quickCustName}
                        onChange={(e) => setQuickCustName(e.target.value)}
                      />
                    </div>
                    <div className="col-6">
                      <input 
                        type="text" 
                        placeholder="ফোন নম্বর"
                        className="form-control form-control-sm fs-8"
                        value={quickCustPhone}
                        onChange={(e) => setQuickCustPhone(e.target.value)}
                      />
                    </div>
                    <div className="col-12 text-end">
                      <button 
                        className="btn btn-sm btn-success btn-sm py-0.5 fs-9 font-monospace"
                        onClick={handleQuickCustomer}
                      >
                        Save
                      </button>
                      <button 
                        className="btn btn-sm btn-link py-0.5 fs-9 text-muted text-decoration-none font-monospace"
                        onClick={() => setShowQuickCust(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              <select 
                className="form-select"
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
              >
                <option value="">খুচরা ক্রেতা (Walk-in Customer)</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ""}</option>
                ))}
              </select>
            </div>

            {/* Calculations summaries */}
            <div className="d-flex justify-content-between mb-2 fs-7 font-monospace">
              <span className="text-muted">Sub Total:</span>
              <span className="fw-semibold">{formatCurrency(subtotal)}</span>
            </div>

            <div className="row g-2 align-items-center mb-2 fs-7 font-monospace">
              <div className="col-6 text-muted">Discount (৳):</div>
              <div className="col-6">
                <input 
                  type="number" 
                  className="form-control form-control-sm text-end font-monospace"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                />
              </div>
            </div>

            {taxPercent > 0 && (
              <div className="d-flex justify-content-between mb-2 fs-7 font-monospace">
                <span className="text-muted">VAT/Tax ({taxPercent}%):</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
            )}

            <div className="border-bottom my-3"></div>

            <div className="d-flex justify-content-between mb-3 text-dark fs-6 fw-bold font-monospace">
              <span>Total Payable:</span>
              <span>{formatCurrency(totalPayable)}</span>
            </div>

            {/* Payment Method */}
            <div className="mb-3">
              <label className="form-label text-muted fs-8 font-monospace">Payment Method</label>
              <select 
                className="form-select"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="Cash">Cash (নগদ)</option>
                <option value="bKash">bKash (বিকাশ)</option>
                <option value="Nagad">Nagad (নগদ অ্যাপ)</option>
                <option value="Bank">Bank (ব্যাংক ট্র্যান্সফার)</option>
              </select>
            </div>

            {/* Paid Amount */}
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="form-label text-muted fs-8 font-monospace m-0">Paid Amount (৳)</label>
                <button 
                  type="button" 
                  className="btn btn-link p-0 text-decoration-none fs-8 text-success font-monospace"
                  onClick={handleFullPaid}
                >
                  Full Paid
                </button>
              </div>
              <input 
                type="number" 
                className="form-control form-control-lg font-monospace text-success fw-bold text-end"
                placeholder="পরিশোধের পরিমাণ"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
              />
            </div>

            {/* Due preview */}
            {dueAmount > 0 ? (
              <div className="alert alert-danger-subtle text-danger py-2 fs-8 font-monospace d-flex justify-content-between mb-4">
                <span>Customer Due Balance:</span>
                <span className="fw-bold">{formatCurrency(dueAmount)}</span>
              </div>
            ) : (
              <div className="alert alert-success-subtle text-success py-2 fs-8 font-monospace d-flex justify-content-between mb-4">
                <span>Fully Paid Receipt</span>
                <span className="fw-bold">No Due</span>
              </div>
            )}

            {/* Submit checkout button */}
            <button 
              type="button" 
              className="btn btn-custom btn-custom-primary w-100 btn-lg font-monospace"
              disabled={loading || cart.length === 0}
              onClick={handleCheckout}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Processing...
                </>
              ) : (
                <>
                  <i className="bi bi-printer"></i> Checkout & Print
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Success Modal showing invoice after checkout */}
      <div 
        className="modal fade no-print" 
        id="checkoutSuccessModal" 
        data-bs-backdrop="static" 
        data-bs-keyboard="false" 
        tabIndex="-1" 
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow" style={{ borderRadius: "16px" }}>
            <div className="modal-header bg-success text-white border-0 py-3" style={{ borderTopLeftRadius: "16px", borderTopRightRadius: "16px" }}>
              <h5 className="modal-title font-monospace"><i className="bi bi-check-circle-fill"></i> Sale Success!</h5>
            </div>
            <div className="modal-body p-0" style={{ maxHeight: "350px", overflowY: "auto" }}>
              {createdSale && <SalesInvoice sale={createdSale} />}
            </div>
            <div className="modal-footer bg-light border-0" style={{ borderBottomLeftRadius: "16px", borderBottomRightRadius: "16px" }}>
              <button 
                type="button" 
                className="btn btn-custom btn-custom-secondary font-monospace"
                data-bs-dismiss="modal"
                onClick={() => navigateTo("/sales")}
              >
                Go to History
              </button>
              <button 
                type="button" 
                className="btn btn-custom btn-custom-primary font-monospace"
                onClick={() => {
                  window.print();
                }}
              >
                <i className="bi bi-printer"></i> Print Receipt
              </button>
              <button 
                type="button" 
                className="btn btn-success font-monospace"
                data-bs-dismiss="modal"
                onClick={() => {
                  setCreatedSale(null);
                }}
              >
                New Sale
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Printer container */}
      {createdSale && (
        <div className="d-none d-print-block printable-invoice">
          <SalesInvoice sale={createdSale} />
        </div>
      )}
    </div>
  );
}
