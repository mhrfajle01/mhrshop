import React, { createContext, useContext, useState, useCallback } from "react";

const ModalContext = createContext();

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};

export function ModalProvider({ children }) {
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: "alert", // 'alert' | 'confirm' | 'danger-confirm' | 'prompt'
    title: "",
    message: "",
    confirmText: "ঠিক আছে",
    cancelText: "বাতিল",
    inputValue: "",
    inputPlaceholder: "",
    onConfirm: null,
    onCancel: null
  });

  const showAlert = useCallback((message, title = "বিজ্ঞপ্তি") => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        type: "alert",
        title,
        message,
        confirmText: "ঠিক আছে",
        cancelText: "",
        onConfirm: () => {
          setModalState(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setModalState(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        }
      });
    });
  }, []);

  const showConfirm = useCallback((message, title = "নিশ্চিতকরণ", isDanger = false) => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        type: isDanger ? "danger-confirm" : "confirm",
        title,
        message,
        confirmText: isDanger ? "হ্যাঁ, ডিলিট করুন" : "নিশ্চিত করুন",
        cancelText: "বাতিল",
        onConfirm: () => {
          setModalState(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setModalState(prev => ({ ...prev, isOpen: false }));
          resolve(false);
        }
      });
    });
  }, []);

  const showPrompt = useCallback((message, defaultValue = "", title = "তথ্য প্রদান করুন", placeholder = "") => {
    return new Promise((resolve) => {
      let currentVal = defaultValue;
      setModalState({
        isOpen: true,
        type: "prompt",
        title,
        message,
        inputValue: defaultValue,
        inputPlaceholder: placeholder,
        confirmText: "সংরক্ষণ",
        cancelText: "বাতিল",
        onConfirm: () => {
          setModalState(prev => ({ ...prev, isOpen: false }));
          resolve(currentVal);
        },
        onCancel: () => {
          setModalState(prev => ({ ...prev, isOpen: false }));
          resolve(null);
        },
        onInputChange: (val) => {
          currentVal = val;
        }
      });
    });
  }, []);

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm, showPrompt }}>
      {children}
      {modalState.isOpen && (
        <CustomDialog modalState={modalState} setModalState={setModalState} />
      )}
    </ModalContext.Provider>
  );
}

function CustomDialog({ modalState, setModalState }) {
  const [val, setVal] = useState(modalState.inputValue || "");
  const isDanger = modalState.type === "danger-confirm";

  return (
    <div
      className="modal show d-block"
      style={{
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(4px)",
        zIndex: 1090
      }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "380px", margin: "16px auto" }}>
        <div className="modal-content shadow-lg border-0" style={{ borderRadius: "18px", overflow: "hidden" }}>
          
          {/* Header Bar */}
          <div className="p-3 text-center border-bottom bg-light">
            <div
              className={`rounded-circle d-inline-flex align-items-center justify-content-center mb-2 ${
                isDanger ? "bg-danger-subtle text-danger" : "bg-success-subtle text-success"
              }`}
              style={{ width: "46px", height: "46px" }}
            >
              <i className={`bi ${isDanger ? "bi-exclamation-triangle-fill" : modalState.type === "alert" ? "bi-info-circle-fill" : "bi-question-circle-fill"} fs-4`}></i>
            </div>
            <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: "15px" }}>
              {modalState.title}
            </h6>
          </div>

          {/* Body */}
          <div className="p-3 text-center">
            <p className="text-secondary mb-0" style={{ fontSize: "13px", lineHeight: "1.5" }}>
              {modalState.message}
            </p>

            {modalState.type === "prompt" && (
              <div className="mt-3">
                <input
                  type="text"
                  className="form-control form-control-sm text-center fw-bold"
                  value={val}
                  placeholder={modalState.inputPlaceholder}
                  onChange={(e) => {
                    setVal(e.target.value);
                    if (modalState.onInputChange) modalState.onInputChange(e.target.value);
                  }}
                  autoFocus
                />
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-3 bg-light border-top d-flex gap-2 justify-content-center">
            {modalState.cancelText && (
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary flex-grow-1 py-2 fw-semibold"
                style={{ borderRadius: "10px" }}
                onClick={() => modalState.onCancel && modalState.onCancel()}
              >
                {modalState.cancelText}
              </button>
            )}
            <button
              type="button"
              className={`btn btn-sm flex-grow-1 py-2 fw-semibold text-white ${
                isDanger ? "btn-danger" : "btn-success"
              }`}
              style={{ borderRadius: "10px" }}
              onClick={() => modalState.onConfirm && modalState.onConfirm()}
            >
              {modalState.confirmText}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
