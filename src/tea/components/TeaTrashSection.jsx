import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useModal } from "../../context/ModalContext";
import * as teaApi from "../context/teaDb";

export default function TeaTrashSection() {
  const { currentUser, isLocalMode } = useAuth();
  const { showAlert, showConfirm } = useModal();
  const [deletedOrders, setDeletedOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadTrash = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const all = await teaApi.getTeaOrders(currentUser.uid, isLocalMode);
      setDeletedOrders(all.filter(o => o.deleted) || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrash();
  }, [currentUser, isLocalMode]);

  const handleRestore = async (order) => {
    const ok = await showConfirm(`টোকেন #${order.tokenNo} (৳${order.total}) পুনরুদ্ধার করবেন?`, "পুনরুদ্ধার");
    if (ok) {
      await teaApi.restoreTeaOrder(currentUser.uid, isLocalMode, order.id);
      await showAlert(`টোকেন #${order.tokenNo} পুনরুদ্ধার করা হয়েছে।`, "সফল");
      loadTrash();
    }
  };

  const handleHardDelete = async (order) => {
    const ok = await showConfirm(`স্থায়ীভাবে টোকেন #${order.tokenNo} ডিলিট করবেন? এটি আর ফিরে পাওয়া যাবে না।`, "চিরতরে ডিলিট", true);
    if (ok) {
      await teaApi.hardDeleteTeaOrder(currentUser.uid, isLocalMode, order.id);
      await showAlert(`টোকেন চিরতরে মুছে ফেলা হয়েছে।`, "সফল");
      loadTrash();
    }
  };

  if (deletedOrders.length === 0 && !loading) return null;

  return (
    <div className="card-custom p-3 bg-white border border-danger-subtle mt-4">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <span className="fw-bold text-danger" style={{ fontSize: "14px" }}>
          🍵 চা স্টল বাতিল টোকেন খাতা ({deletedOrders.length})
        </span>
        <button className="btn btn-sm btn-light border py-0 px-2" onClick={loadTrash} style={{ fontSize: "11px" }}>
          রিফ্রেশ
        </button>
      </div>

      <div className="table-responsive" style={{ maxHeight: "220px" }}>
        <table className="table table-sm mb-0" style={{ fontSize: "12px" }}>
          <thead>
            <tr className="table-light">
              <th>টোকেন</th>
              <th>তারিখ</th>
              <th>টাকা</th>
              <th className="text-end">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody>
            {deletedOrders.map(ord => (
              <tr key={ord.id}>
                <td className="fw-bold">#{ord.tokenNo}</td>
                <td>{ord.date}</td>
                <td className="fw-semibold">৳{ord.total}</td>
                <td className="text-end">
                  <button
                    className="btn btn-sm btn-outline-success py-0 px-2 me-1"
                    style={{ fontSize: "11px" }}
                    onClick={() => handleRestore(ord)}
                  >
                    ফেরত আনুন
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger py-0 px-2"
                    style={{ fontSize: "11px" }}
                    onClick={() => handleHardDelete(ord)}
                  >
                    স্থায়ী ডিলিট
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
