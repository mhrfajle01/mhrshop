import React, { useState } from "react";
import { useTea } from "../context/TeaContext";
import { useModal } from "../../context/ModalContext";
import TeaDueEditModal from "./TeaDueEditModal";

export default function TeaCreditList() {
  const { orders, removeOrder } = useTea();
  const { showConfirm, showAlert } = useModal();
  const [editingOrder, setEditingOrder] = useState(null);

  const dueOrders = orders.filter(o => !o.deleted && (o.due || 0) > 0);
  const totalDueAmount = dueOrders.reduce((acc, o) => acc + (o.due || 0), 0);

  const handleDelete = async (ord) => {
    const ok = await showConfirm(
      `কাস্টমার "${ord.customerName}" এর টোকেন #${ord.tokenNo} (বাকি ৳${ord.due}) ডিলিট করতে চান?`,
      "বাকি এন্ট্রি বাতিল",
      true
    );
    if (ok) {
      await removeOrder(ord.id);
      await showAlert(`টোকেন #${ord.tokenNo} এর বাকি ডিলিট করা হয়েছে।`, "সফল");
    }
  };

  return (
    <div className="card-custom p-3 mt-3 bg-white border">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <span className="fw-bold" style={{ fontSize: "13px" }}>📝 চা স্টলের বাকি তালিকা</span>
        <span className="badge bg-danger-subtle text-danger fw-bold">মোট: ৳{totalDueAmount}</span>
      </div>

      {dueOrders.length === 0 ? (
        <div className="text-center text-muted py-2" style={{ fontSize: "12px" }}>
          কোনো বাকি নেই! সব হিসাব পরিষ্কার।
        </div>
      ) : (
        <div className="table-responsive" style={{ maxHeight: "280px", overflowY: "auto" }}>
          <table className="table table-sm mb-0 align-middle" style={{ fontSize: "12px" }}>
            <thead>
              <tr className="table-light">
                <th>টোকেন/তারিখ</th>
                <th>কাস্টমার</th>
                <th className="text-end">বাকি</th>
                <th className="text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {dueOrders.map(ord => (
                <tr key={ord.id}>
                  <td>
                    <span className="fw-bold text-success">#{ord.tokenNo}</span>
                    <small className="text-muted d-block" style={{ fontSize: "10px" }}>{ord.date}</small>
                  </td>
                  <td>
                    <span className="fw-semibold">{ord.customerName}</span>
                    <small className="text-muted d-block text-truncate" style={{ maxWidth: "120px", fontSize: "10px" }}>
                      {ord.items?.map(it => `${it.name} (${it.qty})`).join(", ")}
                    </small>
                  </td>
                  <td className="text-end text-danger fw-bold">৳{ord.due}</td>
                  <td className="text-center">
                    <div className="d-inline-flex gap-1">
                      <button
                        type="button"
                        className="btn btn-sm btn-light border py-0 px-1.5"
                        title="এডিট / পরিশোধ"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingOrder(ord);
                        }}
                      >
                        <i className="bi bi-pencil" style={{ fontSize: "11px" }}></i>
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-light border text-danger py-0 px-1.5"
                        title="ডিলিট"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(ord);
                        }}
                      >
                        <i className="bi bi-trash" style={{ fontSize: "11px" }}></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {editingOrder && (
        <TeaDueEditModal
          order={editingOrder}
          onClose={() => setEditingOrder(null)}
        />
      )}
    </div>
  );
}
