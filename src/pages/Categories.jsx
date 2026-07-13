import React, { useState } from "react";
import { useData } from "../context/DataContext";
import { useRouter } from "../context/RouterContext";

export default function Categories() {
  const { categories, addNewCategory, updateCategoryItem, deleteCategoryItem, loading } = useData();
  const { navigateTo } = useRouter();

  const [categoryName, setCategoryName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  // Search
  const [searchQuery, setSearchQuery] = useState("");

  const handleSave = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    setError("");
    setSuccess("");

    if (!categoryName.trim()) {
      setError("ক্যাটাগরির নাম প্রদান করা আবশ্যক।");
      return;
    }

    try {
      setIsSaving(true);
      if (editingId) {
        // Update
        await updateCategoryItem(editingId, { name: categoryName.trim() });
        setSuccess("ক্যাটাগরি সফলভাবে আপডেট করা হয়েছে।");
      } else {
        // Create
        if (categories.some(c => c.name.toLowerCase() === categoryName.trim().toLowerCase())) {
          setError("এই ক্যাটাগরি ইতিমধ্যে তৈরি করা আছে।");
          return;
        }
        await addNewCategory({ name: categoryName.trim() });
        setSuccess("নতুন ক্যাটাগরি সফলভাবে যোগ করা হয়েছে।");
      }
      
      setCategoryName("");
      setEditingId(null);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("সংরক্ষণ করতে ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (cat) => {
    setCategoryName(cat.name);
    setEditingId(cat.id);
    setError("");
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`আপনি কি সত্যিই "${name}" ক্যাটাগরি মুছে ফেলতে চান?`)) {
      try {
        await deleteCategoryItem(id, name);
        setSuccess("ক্যাটাগরি মুছে ফেলা হয়েছে।");
        setTimeout(() => setSuccess(""), 3000);
      } catch (err) {
        alert("ক্যাটাগরি মুছতে ব্যর্থ হয়েছে।");
      }
    }
  };

  const handleCancel = () => {
    setCategoryName("");
    setEditingId(null);
    setError("");
  };

  // Filter categories
  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="main-content">
      {/* Back button and title */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h2 className="h4 mb-1">Categories</h2>
          <p className="text-muted fs-7">পণ্যের শ্রেণী বা গ্রুপ ব্যবস্থাপনা</p>
        </div>
        <button 
          className="btn btn-sm btn-custom btn-custom-secondary font-monospace"
          onClick={() => navigateTo("/products")}
        >
          <i className="bi bi-box-seam"></i> Products
        </button>
      </div>

      {/* Input panel (Save/Update Form) */}
      <div className="card-custom bg-white border border-light mb-4">
        <h3 className="h6 text-muted text-uppercase mb-3 font-monospace">
          {editingId ? "Update Category" : "Add New Category"}
        </h3>

        {error && <div className="alert alert-danger py-2 fs-7 mb-3">{error}</div>}
        {success && <div className="alert alert-success py-2 fs-7 mb-3">{success}</div>}

        <form onSubmit={handleSave}>
          <div className="mb-3">
            <label className="form-label text-muted fs-7 font-monospace">Category Name</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="যেমন: মুদি পণ্য, কোল্ড ড্রিঙ্কস"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              required
            />
            <div className="form-text text-muted fs-8">সহজে শ্রেণীভুক্ত করার মতো অর্থপূর্ণ নাম দিন।</div>
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
                  <i className="bi bi-check-circle"></i> {editingId ? "Update" : "Save"}
                </>
              )}
            </button>
            {editingId && (
              <button 
                type="button" 
                className="btn btn-custom btn-custom-secondary font-monospace"
                onClick={handleCancel}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Search Input */}
      <div className="search-container">
        <i className="bi bi-search"></i>
        <input 
          type="text" 
          className="form-control" 
          placeholder="ক্যাটাগরি খুঁজুন..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* List / Table */}
      <div className="card-custom bg-white border border-light p-0">
        <div className="p-3 border-bottom border-light d-flex justify-content-between align-items-center">
          <h4 className="h6 text-muted m-0 font-monospace">Category List</h4>
          <span className="badge bg-light text-dark fs-8">{filteredCategories.length} Items</span>
        </div>

        {filteredCategories.length === 0 ? (
          <div className="text-center py-4 text-muted fs-7">
            কোনো ক্যাটাগরি খুঁজে পাওয়া যায়নি।
          </div>
        ) : (
          <div className="table-responsive-custom">
            <table className="table table-custom align-middle">
              <thead>
                <tr>
                  <th scope="col" className="font-monospace">Name</th>
                  <th scope="col" className="text-end font-monospace">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((cat) => (
                  <tr key={cat.id}>
                    <td>
                      <div className="fw-semibold">{cat.name}</div>
                      <small className="text-muted fs-8">ID: {cat.id}</small>
                    </td>
                    <td className="text-end">
                      <div className="d-inline-flex gap-2">
                        <button 
                          className="btn btn-sm btn-outline-success font-monospace"
                          onClick={() => handleEdit(cat)}
                          title="Edit"
                        >
                          <i className="bi bi-pencil"></i> Edit
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-danger font-monospace"
                          onClick={() => handleDelete(cat.id, cat.name)}
                          title="Delete"
                        >
                          <i className="bi bi-trash"></i> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
