import React, { useState } from "react";
import { useData } from "../context/DataContext";
import { useRouter } from "../context/RouterContext";
import { formatCurrency } from "../utils/formatters";
import dayjs from "dayjs";

export default function PurchasesNew() {
  const { 
    products, 
    categories, 
    suppliers, 
    addNewPurchase, 
    addNewSupplier 
  } = useData();
  const { navigateTo } = useRouter();

  // Cart State
  const [cart, setCart] = useState([]);
  
  // Search & Filters
  const [productQuery, setProductQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Checkout Form State
  const [selectedSupplier, setSelectedSupplier] = useState(""); // supplierId
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(dayjs().format("YYYY-MM-DD"));

  // Quick Supplier Creation
  const [quickSuppName, setQuickSuppName] = useState("");
  const [quickSuppPhone, setQuickSuppPhone] = useState("");
  const [showQuickSupp, setShowQuickSupp] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Calculations
  const totalBill = cart.reduce((acc, item) => acc + (item.purchasePrice * item.quantity), 0);
  const calculatedPaidAmount = paidAmount === "" ? 0 : Number(paidAmount);
  const dueAmount = Math.max(0, totalBill - calculatedPaidAmount);

  const handleFullPaid = () => {
    setPaidAmount(totalBill.toString());
  };

  // Cart Operations
  const addToCart = (product) => {
    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        productName: product.name,
        purchasePrice: product.purchasePrice || 0,
        sellingPrice: product.sellingPrice || 0,
        quantity: 1,
        unit: product.unit || "Piece"
      }]);
    }
    setProductQuery(""); // Clear search
  };

  const updateCartQty = (productId, qty) => {
    const newQty = Math.max(1, Number(qty));
    setCart(cart.map(i => 
      i.productId === productId ? { ...i, quantity: newQty } : i
    ));
  };

  const updateCartPrice = (productId, buyPrice) => {
    const newPrice = Math.max(0, Number(buyPrice));
    setCart(cart.map(i => 
      i.productId === productId ? { ...i, purchasePrice: newPrice } : i
    ));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  // Handle Quick Supplier Add
  const handleQuickSupplier = async (e) => {
    e.preventDefault();
    if (!quickSuppName.trim()) return;

    try {
      const res = await addNewSupplier({
        name: quickSuppName.trim(),
        phone: quickSuppPhone.trim(),
        due: 0
      });
      setSelectedSupplier(res.id);
      setQuickSuppName("");
      setQuickSuppPhone("");
      setShowQuickSupp(false);
      alert("সাপ্লায়ার প্রোফাইল যোগ করা হয়েছে।");
    } catch (e) {
      alert("সাপ্লায়ার সেভ করতে সমস্যা হয়েছে।");
    }
  };

  // Checkout submission
  const handleSubmit = async () => {
    if (loading) return;
    setError("");
    if (cart.length === 0) {
      setError("ক্রয়ের তালিকা খালি! অনুগ্রহ করে পণ্য নির্বাচন করুন।");
      return;
    }

    if (Number(paidAmount) < 0) {
      setError("পরিশোধিত টাকা ঋণাত্মক (Negative) হতে পারবে না।");
      return;
    }

    const supplierObj = suppliers.find(s => s.id === selectedSupplier);
    const invoiceNo = invoiceNumber.trim() || "PUR-" + dayjs().format("YYYYMMDD-HHmmss") + "-" + Math.floor(1000 + Math.random() * 9000);

    const purchaseData = {
      invoiceNumber: invoiceNo,
      date: purchaseDate,
      items: cart,
      totalAmount: totalBill,
      paidAmount: calculatedPaidAmount,
      dueAmount: dueAmount,
      supplierId: selectedSupplier || null,
      supplierName: supplierObj ? supplierObj.name : "বেনামী সাপ্লায়ার",
      supplierPhone: supplierObj ? supplierObj.phone : ""
    };

    try {
      setLoading(true);
      await addNewPurchase(purchaseData);
      setLoading(false);
      
      alert("ক্রয় চালান সফলভাবে সংরক্ষণ করা হয়েছে এবং স্টক বৃদ্ধি করা হয়েছে।");
      navigateTo("/purchases");
    } catch (err) {
      setLoading(false);
      setError("ক্রয় রসিদ সংরক্ষণ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
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
          <h2 className="h4 mb-1">New Purchase</h2>
          <p className="text-muted fs-7">সরবরাহকারীর থেকে মাল ক্রয় ও স্টক খাতা</p>
        </div>
        <button 
          className="btn btn-sm btn-custom btn-custom-secondary font-monospace"
          onClick={() => navigateTo("/purchases")}
        >
          <i className="bi bi-x-circle"></i> Cancel
        </button>
      </div>

      {error && <div className="alert alert-danger py-2 fs-7 mb-3 no-print">{error}</div>}

      <div className="row g-3">
        {/* Left Side: Product Selector */}
        <div className="col-12 col-md-7">
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
            <div className="border rounded bg-light p-2" style={{ maxHeight: "180px", overflowY: "auto" }}>
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
                      <span className="badge bg-secondary-subtle text-secondary fs-8">ক্রয়মূল্য: {formatCurrency(prod.purchasePrice)}</span>
                      <i className="bi bi-plus-circle text-success ms-2 fs-6 align-middle"></i>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Cart list section */}
          <div className="card-custom bg-white border border-light p-3 mt-3">
            <h3 className="h6 text-muted text-uppercase mb-3 font-monospace">Purchase Items</h3>
            {cart.length === 0 ? (
              <div className="text-center py-5 text-muted fs-8">
                <i className="bi bi-bag-x fs-2 d-block mb-2"></i>
                ক্রয় তালিকা খালি! উপর থেকে ক্লিক করে পণ্য যোগ করুন।
              </div>
            ) : (
              <div className="cart-list" style={{ maxHeight: "300px", overflowY: "auto" }}>
                {cart.map((item) => (
                  <div key={item.productId} className="pos-item-row">
                    <div className="pe-2" style={{ width: "40%" }}>
                      <div className="fw-semibold fs-7 text-truncate">{item.productName}</div>
                      <span className="text-muted fs-9">{item.unit}</span>
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
                          style={{ width: "70px" }}
                          value={item.purchasePrice}
                          onChange={(e) => updateCartPrice(item.productId, e.target.value)}
                        />
                        <small className="d-block text-muted" style={{ fontSize: "9px" }}>Total: {formatCurrency(item.purchasePrice * item.quantity)}</small>
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

        {/* Right Side: Supplier selection & Invoice Info */}
        <div className="col-12 col-md-5">
          <div className="card-custom bg-white border border-light p-3">
            <h3 className="h6 text-muted text-uppercase mb-3 font-monospace">Purchase Info</h3>

            {/* Date picker */}
            <div className="mb-3">
              <label className="form-label text-muted fs-8 font-monospace">Purchase Date</label>
              <input 
                type="date" 
                className="form-control form-control-sm"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />
            </div>

            {/* Supplier Invoice number */}
            <div className="mb-3">
              <label className="form-label text-muted fs-8 font-monospace">Challan / Invoice No</label>
              <input 
                type="text" 
                className="form-control form-control-sm font-monospace"
                placeholder="যেমন: SUP-INV-10214"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
              />
            </div>

            {/* Supplier Dropdown */}
            <div className="mb-3">
              <div className="d-flex justify-content-between mb-1">
                <label className="form-label text-muted fs-8 font-monospace m-0">Supplier</label>
                <button 
                  className="btn btn-link p-0 fs-8 text-success text-decoration-none font-monospace"
                  onClick={() => setShowQuickSupp(!showQuickSupp)}
                >
                  <i className="bi bi-person-plus-fill"></i> Quick Add
                </button>
              </div>

              {showQuickSupp && (
                <div className="bg-light p-2 rounded mb-2 border border-success-subtle">
                  <div className="row g-2">
                    <div className="col-6">
                      <input 
                        type="text" 
                        placeholder="সরবরাহকারীর নাম"
                        className="form-control form-control-sm fs-8"
                        value={quickSuppName}
                        onChange={(e) => setQuickSuppName(e.target.value)}
                      />
                    </div>
                    <div className="col-6">
                      <input 
                        type="text" 
                        placeholder="ফোন নম্বর"
                        className="form-control form-control-sm fs-8"
                        value={quickSuppPhone}
                        onChange={(e) => setQuickSuppPhone(e.target.value)}
                      />
                    </div>
                    <div className="col-12 text-end">
                      <button 
                        className="btn btn-sm btn-success py-0.5 fs-9 font-monospace"
                        onClick={handleQuickSupplier}
                      >
                        Save
                      </button>
                      <button 
                        className="btn btn-sm btn-link py-0.5 fs-9 text-muted text-decoration-none font-monospace"
                        onClick={() => setShowQuickSupp(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <select 
                className="form-select"
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
              >
                <option value="">বেনামী সরবরাহকারী (Walk-in Supplier)</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name} {s.phone ? `(${s.phone})` : ""}</option>
                ))}
              </select>
            </div>

            <div className="border-bottom my-3"></div>

            <div className="d-flex justify-content-between mb-2 text-dark fs-6 fw-bold font-monospace">
              <span>Total Bill:</span>
              <span>{formatCurrency(totalBill)}</span>
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
                placeholder="পরিশোধিত টাকা"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
              />
            </div>

            {/* Due Preview */}
            {dueAmount > 0 ? (
              <div className="alert alert-danger-subtle text-danger py-2 fs-8 font-monospace d-flex justify-content-between mb-4">
                <span>Supplier Due (We owe):</span>
                <span className="fw-bold">{formatCurrency(dueAmount)}</span>
              </div>
            ) : (
              <div className="alert alert-success-subtle text-success py-2 fs-8 font-monospace d-flex justify-content-between mb-4">
                <span>Fully Paid Challan</span>
                <span className="fw-bold">No Due</span>
              </div>
            )}

            {/* Submit checkout button */}
            <button 
              type="button" 
              className="btn btn-custom btn-custom-primary w-100 btn-lg font-monospace"
              disabled={loading || cart.length === 0}
              onClick={handleSubmit}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Saving...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle"></i> Save Purchase
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
