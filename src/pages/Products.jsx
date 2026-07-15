import React, { useState } from "react";
import { useData } from "../context/DataContext";
import { useRouter } from "../context/RouterContext";
import { formatCurrency } from "../utils/formatters";

export default function Products() {
  const { 
    products, 
    categories, 
    addNewProduct, 
    updateProductItem, 
    deleteProductItem, 
    loading 
  } = useData();
  const { navigateTo } = useRouter();

  // Navigation state inside page: 'list' or 'form'
  const [mode, setMode] = useState("list"); // 'list' | 'form'
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [stock, setStock] = useState("");
  const [minStock, setMinStock] = useState("5");
  const [unit, setUnit] = useState("Piece");
  const [barcode, setBarcode] = useState("");
  const [notes, setNotes] = useState("");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("All");
  const [stockFilter, setStockFilter] = useState("All"); // 'All' | 'Low'

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleEdit = (prod) => {
    setEditingId(prod.id);
    setName(prod.name);
    setCategory(prod.category || "");
    setPurchasePrice(prod.purchasePrice || "");
    setSellingPrice(prod.sellingPrice || "");
    setStock(prod.stock || "0");
    setMinStock(prod.minStock || "5");
    setUnit(prod.unit || "Piece");
    setBarcode(prod.barcode || "");
    setNotes(prod.notes || "");
    setError("");
    setMode("form");
  };

  const handleAddNew = () => {
    setEditingId(null);
    setName("");
    setCategory(categories[0]?.name || "");
    setPurchasePrice("");
    setSellingPrice("");
    setStock("0");
    setMinStock("5");
    setUnit("Piece");
    setBarcode("");
    setNotes("");
    setError("");
    setMode("form");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("পণ্যের নাম আবশ্যক।");
      return;
    }

    if (Number(purchasePrice) < 0 || Number(sellingPrice) < 0) {
      setError("ক্রয়মূল্য বা বিক্রয়মূল্য ঋণাত্মক (Negative) হতে পারবে না।");
      return;
    }

    if (Number(stock) < 0 || Number(minStock) < 0) {
      setError("স্টক বা ন্যূনতম স্টক ঋণাত্মক (Negative) হতে পারবে না।");
      return;
    }
    
    if (Number(sellingPrice) < Number(purchasePrice)) {
      if (!window.confirm("সতর্কতা: বিক্রয়মূল্য ক্রয়মূল্যের চেয়ে কম! আপনি কি তবুও সংরক্ষণ করতে চান?")) {
        return;
      }
    }

    const productData = {
      name: name.trim(),
      category,
      purchasePrice: Number(purchasePrice || 0),
      sellingPrice: Number(sellingPrice || 0),
      stock: Number(stock || 0),
      minStock: Number(minStock || 0),
      unit,
      barcode: barcode.trim(),
      notes: notes.trim()
    };

    try {
      setIsSaving(true);
      if (editingId) {
        await updateProductItem(editingId, productData);
        setSuccess("পণ্য সফলভাবে আপডেট করা হয়েছে।");
      } else {
        await addNewProduct(productData);
        setSuccess("নতুন পণ্য সফলভাবে যোগ করা হয়েছে।");
      }
      
      setTimeout(() => setSuccess(""), 3000);
      setMode("list");
    } catch (err) {
      setError("সংরক্ষণ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id, prodName) => {
    if (window.confirm(`আপনি কি সত্যিই "${prodName}" পণ্যটি মুছে ফেলতে চান?`)) {
      try {
        await deleteProductItem(id, prodName);
        setSuccess("পণ্য মুছে ফেলা হয়েছে।");
        setTimeout(() => setSuccess(""), 3000);
      } catch (err) {
        alert("পণ্যটি মুছে ফেলা সম্ভব হয়নি।");
      }
    }
  };

  // Filter logic
  const filteredProducts = products.filter(prod => {
    const matchesSearch = 
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prod.barcode && prod.barcode.includes(searchQuery));
      
    const matchesCat = 
      selectedCategoryFilter === "All" || 
      prod.category === selectedCategoryFilter;
      
    const isLow = prod.stock <= (prod.minStock || 0);
    const matchesStock = 
      stockFilter === "All" || 
      (stockFilter === "Low" && isLow);

    return matchesSearch && matchesCat && matchesStock;
  });

  return (
    <div className="main-content">
      {/* Title */}
      <div className="d-flex justify-content-between align-items-center mb-4 no-print">
        <div>
          <h2 className="h4 mb-1">Products</h2>
          <p className="text-muted fs-7">পণ্যের তালিকা ও স্টক ব্যবস্থাপনা</p>
        </div>
        
        {mode === "list" ? (
          <div className="d-flex gap-2">
            <button 
              className="btn btn-sm btn-custom btn-custom-secondary font-monospace"
              onClick={() => navigateTo("/categories")}
            >
              <i className="bi bi-tag"></i> Categories
            </button>
            <button 
              className="btn btn-sm btn-custom btn-custom-primary font-monospace"
              onClick={handleAddNew}
            >
              <i className="bi bi-plus-circle"></i> Add Product
            </button>
          </div>
        ) : (
          <button 
            className="btn btn-sm btn-custom btn-custom-secondary font-monospace"
            onClick={() => setMode("list")}
          >
            <i className="bi bi-arrow-left"></i> Back
          </button>
        )}
      </div>

      {success && <div className="alert alert-success py-2 fs-7 mb-3 no-print">{success}</div>}

      {/* Editor Form Mode */}
      {mode === "form" && (
        <div className="card-custom bg-white border border-light">
          <h3 className="h6 text-muted text-uppercase mb-3 font-monospace">
            {editingId ? "Update Product" : "Create New Product"}
          </h3>

          {error && <div className="alert alert-danger py-2 fs-7 mb-3">{error}</div>}

          <form onSubmit={handleSave}>
            <div className="mb-3">
              <label className="form-label text-muted fs-7 font-monospace">Product Name</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="যেমন: মিনিকেট চাল ৫০ কেজি বস্তা"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="row">
              <div className="col-6 mb-3">
                <label className="form-label text-muted fs-7 font-monospace">Category</label>
                <select 
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">সিলেক্ট করুন</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="col-6 mb-3">
                <label className="form-label text-muted fs-7 font-monospace">Unit</label>
                <select 
                  className="form-select"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                >
                  <option value="Piece">Piece (পিস)</option>
                  <option value="KG">KG (কেজি)</option>
                  <option value="Packet">Packet (প্যাকেট)</option>
                  <option value="Litre">Litre (লিটার)</option>
                  <option value="Bag">Bag (বস্তা)</option>
                  <option value="Box">Box (কার্টন)</option>
                </select>
              </div>
            </div>

            <div className="row">
              <div className="col-6 mb-3">
                <label className="form-label text-muted fs-7 font-monospace">Purchase Price (৳)</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="form-control" 
                  placeholder="ক্রয় মূল্য"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  required
                />
              </div>

              <div className="col-6 mb-3">
                <label className="form-label text-muted fs-7 font-monospace">Selling Price (৳)</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="form-control" 
                  placeholder="বিক্রয় মূল্য"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="row">
              <div className="col-6 mb-3">
                <label className="form-label text-muted fs-7 font-monospace">Initial Stock</label>
                <input 
                  type="number" 
                  className="form-control" 
                  placeholder="বর্তমান পরিমাণ"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  disabled={editingId !== null} // Lock initial stock in edit mode (stocks must be updated via Sales or Purchases)
                  required
                />
                {editingId !== null && <small className="text-muted fs-8">স্টক আপডেট করতে ক্রয় বা বিক্রয় রসিদ ব্যবহার করুন।</small>}
              </div>

              <div className="col-6 mb-3">
                <label className="form-label text-muted fs-7 font-monospace">Low Stock Limit</label>
                <input 
                  type="number" 
                  className="form-control" 
                  placeholder="সর্বনিম্ন পরিমাণ"
                  value={minStock}
                  onChange={(e) => setMinStock(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label text-muted fs-7 font-monospace">Barcode (Optional)</label>
              <input 
                type="text" 
                className="form-control font-monospace" 
                placeholder="বারকোড স্ক্যান বা ইনপুট করুন"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
              />
            </div>

            <div className="mb-4">
              <label className="form-label text-muted fs-7 font-monospace">Notes (Optional)</label>
              <textarea 
                className="form-control no-resize" 
                rows="2"
                placeholder="পণ্য সম্পর্কিত অতিরিক্ত তথ্য"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              ></textarea>
            </div>

            <div className="d-flex gap-2">
              <button 
                type="submit" 
                className="btn btn-custom btn-custom-primary flex-grow-1 font-monospace"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle"></i> Save Product
                  </>
                )}
              </button>
              <button 
                type="button" 
                className="btn btn-custom btn-custom-secondary font-monospace"
                onClick={() => setMode("list")}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Product List Mode */}
      {mode === "list" && (
        <>
          {/* Search bar */}
          <div className="search-container no-print">
            <i className="bi bi-search"></i>
            <input 
              type="text" 
              className="form-control" 
              placeholder="পণ্যের নাম অথবা বারকোড দিয়ে খুঁজুন..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filters pills row */}
          <div className="mb-3 no-print" style={{ overflowX: "auto", display: "flex", paddingBottom: "8px" }}>
            <span 
              className={`category-pill ${selectedCategoryFilter === "All" ? "active" : ""}`}
              onClick={() => setSelectedCategoryFilter("All")}
            >
              All Categories
            </span>
            {categories.map(c => (
              <span 
                key={c.id} 
                className={`category-pill ${selectedCategoryFilter === c.name ? "active" : ""}`}
                onClick={() => setSelectedCategoryFilter(c.name)}
              >
                {c.name}
              </span>
            ))}
          </div>

          {/* Sub-filters for Stock levels */}
          <div className="btn-group btn-group-sm w-100 mb-3 no-print" role="group">
            <input 
              type="radio" 
              className="btn-check" 
              name="stockFilter" 
              id="stockAll" 
              checked={stockFilter === "All"}
              onChange={() => setStockFilter("All")}
            />
            <label className="btn btn-outline-success font-monospace" htmlFor="stockAll">All Stocks</label>

            <input 
              type="radio" 
              className="btn-check" 
              name="stockFilter" 
              id="stockLow" 
              checked={stockFilter === "Low"}
              onChange={() => setStockFilter("Low")}
            />
            <label className="btn btn-outline-danger font-monospace" htmlFor="stockLow">
              Low Stock Alerts
            </label>
          </div>

          {/* Product Items List Grid */}
          <div className="card-custom bg-white border border-light p-0">
            <div className="p-3 border-bottom border-light d-flex justify-content-between align-items-center">
              <h4 className="h6 text-muted m-0 font-monospace">Product Catalog</h4>
              <span className="badge bg-light text-dark fs-8">{filteredProducts.length} Items</span>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-5 text-muted fs-7">
                কোনো পণ্য পাওয়া যায়নি।
              </div>
            ) : (
              <div className="table-responsive-custom">
                <table className="table table-custom align-middle">
                  <thead>
                    <tr>
                      <th scope="col" className="font-monospace">Details</th>
                      <th scope="col" className="text-center font-monospace">Stock</th>
                      <th scope="col" className="text-end font-monospace">Price</th>
                      <th scope="col" className="text-end font-monospace">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((prod) => {
                      const isLow = prod.stock <= (prod.minStock || 0);
                      return (
                        <tr key={prod.id} className={isLow ? "table-danger-subtle" : ""}>
                          <td>
                            <div className="fw-semibold text-wrap">{prod.name}</div>
                            <div className="d-flex flex-wrap gap-1 align-items-center mt-1">
                              {prod.category && (
                                <span className="badge bg-light text-dark fs-9 border">{prod.category}</span>
                              )}
                              {prod.barcode && (
                                <span className="badge bg-light text-secondary fs-9 font-monospace" style={{ fontSize: "10px" }}>
                                  <i className="bi bi-barcode"></i> {prod.barcode}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="text-center">
                            <span className={`fw-bold ${isLow ? "text-danger" : "text-success"}`}>
                              {prod.stock}
                            </span>
                            <small className="text-muted d-block" style={{ fontSize: "10px" }}>
                              {prod.unit}
                            </small>
                            {isLow && (
                              <span className="badge bg-danger text-white fs-9 px-1 py-0.5 rounded-pill" style={{ fontSize: "9px" }}>
                                Low
                              </span>
                            )}
                          </td>
                          <td className="text-end">
                            <div className="fw-semibold text-success">{formatCurrency(prod.sellingPrice)}</div>
                            <small className="text-muted fs-9" style={{ fontSize: "10px" }}>
                              Buy: {formatCurrency(prod.purchasePrice)}
                            </small>
                          </td>
                          <td className="text-end">
                            <div className="dropdown">
                              <button 
                                className="btn btn-sm btn-link text-secondary p-1 border-0 dropdown-toggle" 
                                type="button" 
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                              >
                                <i className="bi bi-three-dots-vertical"></i>
                              </button>
                              <ul className="dropdown-menu dropdown-menu-end shadow border-0 py-1">
                                <li>
                                  <button 
                                    className="dropdown-item py-2 text-success fw-semibold" 
                                    onClick={() => navigateTo("/purchases/new", { productId: prod.id })}
                                  >
                                    <i className="bi bi-bag-plus me-2"></i> Purchase More
                                  </button>
                                </li>
                                <li>
                                  <button className="dropdown-item py-2" onClick={() => handleEdit(prod)}>
                                    <i className="bi bi-pencil me-2 text-warning"></i> Edit Product
                                  </button>
                                </li>
                                <li>
                                  <hr className="dropdown-divider my-1" />
                                </li>
                                <li>
                                  <button 
                                    className="dropdown-item py-2 text-danger" 
                                    onClick={() => handleDelete(prod.id, prod.name)}
                                  >
                                    <i className="bi bi-trash me-2"></i> Delete
                                  </button>
                                </li>
                              </ul>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
