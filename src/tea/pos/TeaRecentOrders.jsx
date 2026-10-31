import React from "react";
import { useTea } from "../context/TeaContext";
import { useModal } from "../../context/ModalContext";
import { getBdToday } from "../../utils/formatters";

export default function TeaRecentOrders() {
  const { orders, removeOrder } = useTea();
  const { showConfirm, showAlert } = useModal();

  const today = getBdToday();
  const todayOrders = orders.filter(o => (o.date || o.createdAt?.slice(0, 10)) === today).slice(0, 10);

  const handleDelete = async (order) => {
    const ok = await showConfirm(
      `টোকেন #${order.tokenNo} (৳${order.total}) ভুলবশত এন্ট্রি হয়েছিল? এটি ডিলিট করতে চান?`,
      "টোকেন বাতিল",
      true
    );
    if (ok) {
      await removeOrder(order.id);
      await showAlert(`টোকেন #${order.tokenNo} বাতিল ও রিসাইকেল বিনে পাঠানো হয়েছে।`, "সফল");
    }
  };

  if (todayOrders.length === 0) return null;

  return (
    <div className="card-custom p-3 bg-white border mt-3">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <span className="fw-bold" style={{ fontSize: "13px" }}>
          🕒 আজকের সাম্প্রতিক টোকেন ও ভুল এন্ট্রি বাতিল
        </span>
        <small className="text-muted" style={{ fontSize: "11px" }}>শেষ ১০টি</small>
      </div>

      <div className="table-responsive" style={{ maxHeight: "200px" }}>
        <table className="table table-sm mb-0" style={{ fontSize: "12px" }}>
          <thead>
            <tr className="table-light">
              <th>টোকেন</th>
              <th>আইটেম</th>
              <th className="text-end">টাকা</th>
              <th className="text-center">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody>
            {todayOrders.map(ord => (
              <tr key={ord.id}>
                <td className="fw-bold text-success">#{ord.tokenNo}</td>
                <td className="text-truncate" style={{ maxWidth: "150px" }}>
                  {ord.items?.map(it => `${it.name} (${it.qty})`).join(", ")}
                </td>
                <td className="text-end fw-semibold">৳{ord.total}</td>
                <td className="text-center">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger py-0 px-1.5"
                    style={{ fontSize: "11px" }}
                    title="ভুল এন্ট্রি মুছুন"
                    onClick={() => handleDelete(ord)}
                  >
                    <i className="bi bi-trash"></i> মুছুন
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
