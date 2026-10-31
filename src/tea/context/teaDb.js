import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, setDoc, query, orderBy } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../../firebase/config";

const getLocal = (uid, key) => JSON.parse(localStorage.getItem(`tea_stall_${uid}_${key}`) || "[]");
const saveLocal = (uid, key, data) => localStorage.setItem(`tea_stall_${uid}_${key}`, JSON.stringify(data));

// Menu CRUD
export const getTeaMenuItems = async (uid, isLocal) => {
  if (!isLocal && isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(query(collection(db, "users", uid, "teaMenu"), orderBy("price", "asc")));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch { return getLocal(uid, "menu"); }
  }
  return getLocal(uid, "menu");
};

export const addTeaMenuItem = async (uid, isLocal, item) => {
  const data = { ...item, price: Number(item.price || 0), createdAt: new Date().toISOString() };
  if (!isLocal && isFirebaseConfigured && db) {
    const docRef = await addDoc(collection(db, "users", uid, "teaMenu"), data);
    return { id: docRef.id, ...data };
  }
  const items = getLocal(uid, "menu");
  const newItem = { id: "tm_" + Date.now(), ...data };
  items.push(newItem);
  saveLocal(uid, "menu", items);
  return newItem;
};

export const updateTeaMenuItem = async (uid, isLocal, id, item) => {
  const data = { ...item, price: Number(item.price || 0) };
  if (!isLocal && isFirebaseConfigured && db) {
    await updateDoc(doc(db, "users", uid, "teaMenu", id), data);
    return { id, ...data };
  }
  const items = getLocal(uid, "menu").map(i => i.id === id ? { ...i, ...data } : i);
  saveLocal(uid, "menu", items);
  return { id, ...data };
};

export const deleteTeaMenuItem = async (uid, isLocal, id) => {
  if (!isLocal && isFirebaseConfigured && db) {
    await deleteDoc(doc(db, "users", uid, "teaMenu", id));
  } else {
    saveLocal(uid, "menu", getLocal(uid, "menu").filter(i => i.id !== id));
  }
};

// Orders CRUD
export const getTeaOrders = async (uid, isLocal) => {
  if (!isLocal && isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(query(collection(db, "users", uid, "teaOrders"), orderBy("createdAt", "desc")));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch { return getLocal(uid, "orders"); }
  }
  return getLocal(uid, "orders");
};

export const addTeaOrder = async (uid, isLocal, order) => {
  const data = {
    ...order,
    total: Number(order.total || 0),
    paid: Number(order.paid || 0),
    due: Number(order.due || 0),
    createdAt: new Date().toISOString()
  };
  if (!isLocal && isFirebaseConfigured && db) {
    const docRef = await addDoc(collection(db, "users", uid, "teaOrders"), data);
    return { id: docRef.id, ...data };
  }
  const orders = getLocal(uid, "orders");
  const newOrder = { id: "to_" + Date.now(), ...data };
  orders.unshift(newOrder);
  saveLocal(uid, "orders", orders);
  return newOrder;
};

export const updateTeaOrder = async (uid, isLocal, id, orderData) => {
  const data = {
    ...orderData,
    due: Number(orderData.due ?? 0),
    paid: Number(orderData.paid ?? 0),
    total: Number(orderData.total ?? 0)
  };
  if (!isLocal && isFirebaseConfigured && db) {
    await updateDoc(doc(db, "users", uid, "teaOrders", id), data);
    return { id, ...data };
  }
  const orders = getLocal(uid, "orders").map(o => o.id === id ? { ...o, ...data } : o);
  saveLocal(uid, "orders", orders);
  return { id, ...data };
};

export const deleteTeaOrder = async (uid, isLocal, id) => {
  const data = { deleted: true, deletedAt: new Date().toISOString() };
  if (!isLocal && isFirebaseConfigured && db) {
    await updateDoc(doc(db, "users", uid, "teaOrders", id), data);
  } else {
    const orders = getLocal(uid, "orders").map(o => o.id === id ? { ...o, ...data } : o);
    saveLocal(uid, "orders", orders);
  }
};

export const restoreTeaOrder = async (uid, isLocal, id) => {
  const data = { deleted: false, deletedAt: null };
  if (!isLocal && isFirebaseConfigured && db) {
    await updateDoc(doc(db, "users", uid, "teaOrders", id), data);
  } else {
    const orders = getLocal(uid, "orders").map(o => o.id === id ? { ...o, ...data } : o);
    saveLocal(uid, "orders", orders);
  }
};

export const hardDeleteTeaOrder = async (uid, isLocal, id) => {
  if (!isLocal && isFirebaseConfigured && db) {
    await deleteDoc(doc(db, "users", uid, "teaOrders", id));
  } else {
    saveLocal(uid, "orders", getLocal(uid, "orders").filter(o => o.id !== id));
  }
};

// Materials CRUD
export const getTeaMaterials = async (uid, isLocal) => {
  if (!isLocal && isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(query(collection(db, "users", uid, "teaMaterials"), orderBy("name", "asc")));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch { return getLocal(uid, "materials"); }
  }
  return getLocal(uid, "materials");
};

export const addTeaMaterial = async (uid, isLocal, mat) => {
  const data = {
    ...mat,
    stock: Number(mat.stock || 0),
    minStock: Number(mat.minStock || 0),
    createdAt: new Date().toISOString()
  };
  if (!isLocal && isFirebaseConfigured && db) {
    const docRef = await addDoc(collection(db, "users", uid, "teaMaterials"), data);
    return { id: docRef.id, ...data };
  }
  const items = getLocal(uid, "materials");
  const newItem = { id: "tmat_" + Date.now(), ...data };
  items.push(newItem);
  saveLocal(uid, "materials", items);
  return newItem;
};

export const updateTeaMaterial = async (uid, isLocal, id, mat) => {
  const data = {
    ...mat,
    stock: Number(mat.stock || 0),
    minStock: Number(mat.minStock || 0)
  };
  if (!isLocal && isFirebaseConfigured && db) {
    await updateDoc(doc(db, "users", uid, "teaMaterials", id), data);
    return { id, ...data };
  }
  const items = getLocal(uid, "materials").map(i => i.id === id ? { ...i, ...data } : i);
  saveLocal(uid, "materials", items);
  return { id, ...data };
};

export const deleteTeaMaterial = async (uid, isLocal, id) => {
  if (!isLocal && isFirebaseConfigured && db) {
    await deleteDoc(doc(db, "users", uid, "teaMaterials", id));
  } else {
    saveLocal(uid, "materials", getLocal(uid, "materials").filter(i => i.id !== id));
  }
};

// Expenses CRUD (দুধ, চিনি, গ্যাস, ইত্যাদি খরচ)
export const getTeaExpenses = async (uid, isLocal) => {
  if (!isLocal && isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(query(collection(db, "users", uid, "teaExpenses"), orderBy("date", "desc")));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch { return getLocal(uid, "expenses"); }
  }
  return getLocal(uid, "expenses");
};

export const addTeaExpense = async (uid, isLocal, exp) => {
  const data = {
    ...exp,
    amount: Number(exp.amount || 0),
    createdAt: new Date().toISOString()
  };
  if (!isLocal && isFirebaseConfigured && db) {
    const docRef = await addDoc(collection(db, "users", uid, "teaExpenses"), data);
    return { id: docRef.id, ...data };
  }
  const exps = getLocal(uid, "expenses");
  const newExp = { id: "texp_" + Date.now(), ...data };
  exps.unshift(newExp);
  saveLocal(uid, "expenses", exps);
  return newExp;
};

export const deleteTeaExpense = async (uid, isLocal, id) => {
  if (!isLocal && isFirebaseConfigured && db) {
    await deleteDoc(doc(db, "users", uid, "teaExpenses", id));
  } else {
    saveLocal(uid, "expenses", getLocal(uid, "expenses").filter(e => e.id !== id));
  }
};

// Settings (Initial Capital & Preferences)
export const getTeaKhataSettings = async (uid, isLocal) => {
  const defaultSettings = { initialCapital: 0, startDate: new Date().toISOString().slice(0, 10) };
  if (!isLocal && isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, "users", uid, "teaSettings"));
      const docData = snap.docs.find(d => d.id === "khataConfig")?.data();
      return docData || defaultSettings;
    } catch { return JSON.parse(localStorage.getItem(`tea_stall_${uid}_khata_settings`) || JSON.stringify(defaultSettings)); }
  }
  return JSON.parse(localStorage.getItem(`tea_stall_${uid}_khata_settings`) || JSON.stringify(defaultSettings));
};

export const saveTeaKhataSettings = async (uid, isLocal, settings) => {
  const data = {
    ...settings,
    initialCapital: Number(settings.initialCapital || 0)
  };
  if (!isLocal && isFirebaseConfigured && db) {
    await setDoc(doc(db, "users", uid, "teaSettings", "khataConfig"), data);
  } else {
    localStorage.setItem(`tea_stall_${uid}_khata_settings`, JSON.stringify(data));
  }
  return data;
};
