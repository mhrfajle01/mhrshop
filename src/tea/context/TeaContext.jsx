import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import * as teaApi from "./teaDb";
import { DEFAULT_TEA_MENU } from "../menu/TeaMenuPresets";
import { getBdToday } from "../../utils/formatters";

const TeaContext = createContext();
export const useTea = () => useContext(TeaContext);

export function TeaProvider({ children }) {
  const { currentUser, isLocalMode } = useAuth();
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [khataSettings, setKhataSettings] = useState({ initialCapital: 0, startDate: "" });
  const [loading, setLoading] = useState(false);

  const loadTeaData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      let items = await teaApi.getTeaMenuItems(currentUser.uid, isLocalMode);
      if (!items || items.length === 0) {
        items = DEFAULT_TEA_MENU;
        localStorage.setItem(`tea_stall_${currentUser.uid}_menu`, JSON.stringify(DEFAULT_TEA_MENU));
      }
      const [ords, mats, exps, settings] = await Promise.all([
        teaApi.getTeaOrders(currentUser.uid, isLocalMode),
        teaApi.getTeaMaterials(currentUser.uid, isLocalMode),
        teaApi.getTeaExpenses(currentUser.uid, isLocalMode),
        teaApi.getTeaKhataSettings(currentUser.uid, isLocalMode)
      ]);
      setMenuItems(items);
      setOrders(ords);
      setMaterials(mats);
      setExpenses(exps);
      setKhataSettings(settings);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeaData();
  }, [currentUser, isLocalMode]);

  const addMenuItem = async (item) => {
    const newItem = await teaApi.addTeaMenuItem(currentUser.uid, isLocalMode, item);
    setMenuItems(prev => [...prev, newItem]);
    return newItem;
  };

  const updateMenuItem = async (id, item) => {
    const updated = await teaApi.updateTeaMenuItem(currentUser.uid, isLocalMode, id, item);
    setMenuItems(prev => prev.map(m => m.id === id ? updated : m));
    return updated;
  };

  const removeMenuItem = async (id) => {
    await teaApi.deleteTeaMenuItem(currentUser.uid, isLocalMode, id);
    setMenuItems(prev => prev.filter(m => m.id !== id));
  };

  const placeOrder = async (orderData) => {
    const today = getBdToday();
    const todayOrders = orders.filter(o => (o.date || o.createdAt?.slice(0, 10)) === today);
    const tokenNo = todayOrders.length + 1;

    const newOrder = await teaApi.addTeaOrder(currentUser.uid, isLocalMode, {
      ...orderData,
      tokenNo,
      date: today
    });
    setOrders(prev => [newOrder, ...prev]);
    return newOrder;
  };

  const updateOrder = async (id, data) => {
    const updated = await teaApi.updateTeaOrder(currentUser.uid, isLocalMode, id, data);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updated } : o));
    return updated;
  };

  const removeOrder = async (id) => {
    await teaApi.deleteTeaOrder(currentUser.uid, isLocalMode, id);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, deleted: true } : o));
  };

  const restoreOrder = async (id) => {
    await teaApi.restoreTeaOrder(currentUser.uid, isLocalMode, id);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, deleted: false } : o));
  };

  const hardDeleteOrder = async (id) => {
    await teaApi.hardDeleteTeaOrder(currentUser.uid, isLocalMode, id);
    setOrders(prev => prev.filter(o => o.id !== id));
  };

  const addMaterial = async (mat) => {
    const newMat = await teaApi.addTeaMaterial(currentUser.uid, isLocalMode, mat);
    setMaterials(prev => [...prev, newMat]);
    return newMat;
  };

  const updateMaterial = async (id, mat) => {
    const updated = await teaApi.updateTeaMaterial(currentUser.uid, isLocalMode, id, mat);
    setMaterials(prev => prev.map(m => m.id === id ? updated : m));
    return updated;
  };

  const removeMaterial = async (id) => {
    await teaApi.deleteTeaMaterial(currentUser.uid, isLocalMode, id);
    setMaterials(prev => prev.filter(m => m.id !== id));
  };

  const addExpense = async (exp) => {
    const newExp = await teaApi.addTeaExpense(currentUser.uid, isLocalMode, exp);
    setExpenses(prev => [newExp, ...prev]);
    return newExp;
  };

  const removeExpense = async (id) => {
    await teaApi.deleteTeaExpense(currentUser.uid, isLocalMode, id);
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const updateKhataSettings = async (settings) => {
    const updated = await teaApi.saveTeaKhataSettings(currentUser.uid, isLocalMode, settings);
    setKhataSettings(updated);
    return updated;
  };

  const activeOrders = orders.filter(o => !o.deleted);
  const trashOrders = orders.filter(o => o.deleted);

  return (
    <TeaContext.Provider value={{
      menuItems,
      orders: activeOrders,
      trashOrders,
      materials,
      expenses,
      khataSettings,
      loading,
      loadTeaData,
      addMenuItem,
      updateMenuItem,
      removeMenuItem,
      placeOrder,
      updateOrder,
      removeOrder,
      restoreOrder,
      hardDeleteOrder,
      addMaterial,
      updateMaterial,
      removeMaterial,
      addExpense,
      removeExpense,
      updateKhataSettings
    }}>
      {children}
    </TeaContext.Provider>
  );
}
