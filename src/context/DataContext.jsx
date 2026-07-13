import React, { createContext, useState, useEffect, useContext } from "react";
import { useAuth } from "./AuthContext";
import * as dbApi from "../firebase/db";

const DataContext = createContext();

export function useData() {
  return useContext(DataContext);
}

export function DataProvider({ children }) {
  const { currentUser, isLocalMode } = useAuth();
  
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [khata, setKhata] = useState([]);
  const [activities, setActivities] = useState([]);
  const [settings, setSettings] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load all data when user logs in
  const fetchAllData = async () => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);
    const uid = currentUser.uid;
    const isLocal = isLocalMode;
    
    try {
      // Parallel fetch for speed
      const [
        cats, 
        prods, 
        custs, 
        supps, 
        exps, 
        sals, 
        purchs, 
        khats, 
        shopSettings
      ] = await Promise.all([
        dbApi.getCategories(uid, isLocal),
        dbApi.getProducts(uid, isLocal),
        dbApi.getCustomers(uid, isLocal),
        dbApi.getSuppliers(uid, isLocal),
        dbApi.getExpenses(uid, isLocal),
        dbApi.getSales(uid, isLocal),
        dbApi.getPurchases(uid, isLocal),
        dbApi.getKhata(uid, isLocal),
        dbApi.getShopSettings(uid, isLocal)
      ]);
      
      // Load recent activities
      const acts = await dbApi.getActivities(uid, isLocal);

      setCategories(cats);
      setProducts(prods);
      setCustomers(custs);
      setSuppliers(supps);
      setExpenses(exps);
      setSales(sals);
      setPurchases(purchs);
      setKhata(khats);
      setSettings(shopSettings);
      setActivities(acts);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("ডাটা লোড করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchAllData();
    } else {
      // Clear state on logout
      setCategories([]);
      setProducts([]);
      setCustomers([]);
      setSuppliers([]);
      setExpenses([]);
      setSales([]);
      setPurchases([]);
      setKhata([]);
      setActivities([]);
      setSettings(null);
    }
  }, [currentUser, isLocalMode]);

  // Wrapper function to refresh activities log
  const refreshActivities = async () => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const acts = await dbApi.getActivities(uid, isLocalMode);
    setActivities(acts);
  };

  // --- CRUD DISPATCHERS ---

  // Categories
  const addNewCategory = async (catData) => {
    const res = await dbApi.addCategory(currentUser.uid, isLocalMode, catData);
    setCategories(prev => [...prev, res].sort((a, b) => a.name.localeCompare(b.name)));
    refreshActivities();
    return res;
  };

  const updateCategoryItem = async (id, catData) => {
    const res = await dbApi.updateCategory(currentUser.uid, isLocalMode, id, catData);
    setCategories(prev => prev.map(c => c.id === id ? res : c));
    refreshActivities();
    return res;
  };

  const deleteCategoryItem = async (id, name) => {
    await dbApi.softDeleteDoc(currentUser.uid, isLocalMode, "categories", id, `Category "${name}"`);
    await fetchAllData();
  };

  // Products
  const addNewProduct = async (prodData) => {
    const res = await dbApi.addProduct(currentUser.uid, isLocalMode, prodData);
    setProducts(prev => [...prev, res].sort((a, b) => a.name.localeCompare(b.name)));
    refreshActivities();
    return res;
  };

  const updateProductItem = async (id, prodData) => {
    const res = await dbApi.updateProduct(currentUser.uid, isLocalMode, id, prodData);
    setProducts(prev => prev.map(p => p.id === id ? res : p));
    refreshActivities();
    return res;
  };

  const deleteProductItem = async (id, name) => {
    await dbApi.softDeleteDoc(currentUser.uid, isLocalMode, "products", id, `Product "${name}"`);
    await fetchAllData();
  };

  // Customers
  const addNewCustomer = async (custData) => {
    const res = await dbApi.addCustomer(currentUser.uid, isLocalMode, custData);
    setCustomers(prev => [...prev, res].sort((a, b) => a.name.localeCompare(b.name)));
    refreshActivities();
    return res;
  };

  const updateCustomerItem = async (id, custData) => {
    const res = await dbApi.updateCustomer(currentUser.uid, isLocalMode, id, custData);
    setCustomers(prev => prev.map(c => c.id === id ? res : c));
    refreshActivities();
    return res;
  };

  const deleteCustomerItem = async (id, name) => {
    await dbApi.softDeleteDoc(currentUser.uid, isLocalMode, "customers", id, `Customer "${name}"`);
    await fetchAllData();
  };

  // Suppliers
  const addNewSupplier = async (suppData) => {
    const res = await dbApi.addSupplier(currentUser.uid, isLocalMode, suppData);
    setSuppliers(prev => [...prev, res].sort((a, b) => a.name.localeCompare(b.name)));
    refreshActivities();
    return res;
  };

  const updateSupplierItem = async (id, suppData) => {
    const res = await dbApi.updateSupplier(currentUser.uid, isLocalMode, id, suppData);
    setSuppliers(prev => prev.map(s => s.id === id ? res : s));
    refreshActivities();
    return res;
  };

  const deleteSupplierItem = async (id, name) => {
    await dbApi.softDeleteDoc(currentUser.uid, isLocalMode, "suppliers", id, `Supplier "${name}"`);
    await fetchAllData();
  };

  // Expenses
  const addNewExpense = async (expData) => {
    const res = await dbApi.addExpense(currentUser.uid, isLocalMode, expData);
    setExpenses(prev => [res, ...prev]);
    refreshActivities();
    return res;
  };

  const updateExpenseItem = async (id, expData) => {
    const res = await dbApi.updateExpense(currentUser.uid, isLocalMode, id, expData);
    setExpenses(prev => prev.map(e => e.id === id ? res : e));
    refreshActivities();
    return res;
  };

  const deleteExpenseItem = async (id, amount) => {
    await dbApi.softDeleteDoc(currentUser.uid, isLocalMode, "expenses", id, `Expense ৳${amount}`);
    await fetchAllData();
  };

  // Sales
  const addNewSale = async (saleData) => {
    const res = await dbApi.addSale(currentUser.uid, isLocalMode, saleData);
    await fetchAllData();
    return res;
  };

  const deleteSaleItem = async (saleId) => {
    const sale = sales.find(s => s.id === saleId);
    if (!sale) return;

    const uid = currentUser.uid;
    const isLocal = isLocalMode;
    const label = `Sale invoice ${sale.invoiceNumber}`;

    try {
      // 1. Reverse stocks
      if (sale.items && Array.isArray(sale.items)) {
        for (const item of sale.items) {
          const prod = products.find(p => p.id === item.productId);
          if (prod) {
            const newStock = Number(prod.stock || 0) + Number(item.quantity || 0);
            await dbApi.updateProduct(uid, isLocal, item.productId, { ...prod, stock: newStock });
          }
        }
      }

      // 2. Reverse customer due
      if (sale.customerId && sale.dueAmount > 0) {
        const cust = customers.find(c => c.id === sale.customerId);
        if (cust) {
          const newDue = Math.max(0, Number(cust.due || 0) - Number(sale.dueAmount));
          await dbApi.updateCustomer(uid, isLocal, sale.customerId, { ...cust, due: newDue });
        }
      }
    } catch (e) {
      console.error("Failed to adjust balances for soft deleted sale:", e);
    }

    await dbApi.softDeleteDoc(uid, isLocal, "sales", saleId, label);
    await fetchAllData();
  };

  // Purchases
  const addNewPurchase = async (purchaseData) => {
    const res = await dbApi.addPurchase(currentUser.uid, isLocalMode, purchaseData);
    await fetchAllData();
    return res;
  };

  const deletePurchaseItem = async (purchaseId) => {
    const pur = purchases.find(p => p.id === purchaseId);
    if (!pur) return;

    const uid = currentUser.uid;
    const isLocal = isLocalMode;
    const label = `Purchase invoice ${pur.invoiceNumber}`;

    try {
      // 1. Reverse stocks
      if (pur.items && Array.isArray(pur.items)) {
        for (const item of pur.items) {
          const prod = products.find(p => p.id === item.productId);
          if (prod) {
            const newStock = Math.max(0, Number(prod.stock || 0) - Number(item.quantity || 0));
            await dbApi.updateProduct(uid, isLocal, item.productId, { ...prod, stock: newStock });
          }
        }
      }

      // 2. Reverse supplier due
      if (pur.supplierId && pur.dueAmount > 0) {
        const supp = suppliers.find(s => s.id === pur.supplierId);
        if (supp) {
          const newDue = Math.max(0, Number(supp.due || 0) - Number(pur.dueAmount));
          await dbApi.updateSupplier(uid, isLocal, pur.supplierId, { ...supp, due: newDue });
        }
      }
    } catch (e) {
      console.error("Failed to adjust balances for soft deleted purchase:", e);
    }

    await dbApi.softDeleteDoc(uid, isLocal, "purchases", purchaseId, label);
    await fetchAllData();
  };

  // Khata Ledger Entry
  const addNewKhataEntry = async (khataData) => {
    const res = await dbApi.addKhataTransaction(currentUser.uid, isLocalMode, khataData);
    await fetchAllData();
    return res;
  };

  const deleteKhataItem = async (khataId) => {
    const entry = khata.find(k => k.id === khataId);
    if (!entry) return;

    const uid = currentUser.uid;
    const isLocal = isLocalMode;
    const label = `Ledger entry ৳${entry.amount} (${entry.partyName})`;

    try {
      if (entry.partyType === "customer") {
        const cust = customers.find(c => c.id === entry.partyId);
        if (cust) {
          const factor = entry.type === "payment" ? 1 : -1;
          const newDue = Math.max(0, Number(cust.due || 0) + (Number(entry.amount) * factor));
          await dbApi.updateCustomer(uid, isLocal, entry.partyId, { ...cust, due: newDue });
        }
      } else if (entry.partyType === "supplier") {
        const supp = suppliers.find(s => s.id === entry.partyId);
        if (supp) {
          const factor = entry.type === "payment" ? 1 : -1;
          const newDue = Math.max(0, Number(supp.due || 0) + (Number(entry.amount) * factor));
          await dbApi.updateSupplier(uid, isLocal, entry.partyId, { ...supp, due: newDue });
        }
      }
    } catch (e) {
      console.error("Failed to adjust balances for soft deleted khata entry:", e);
    }

    await dbApi.softDeleteDoc(uid, isLocal, "khata", khataId, label);
    await fetchAllData();
  };

  // Trash Operations
  const trashRestoreItem = async (collectionName, id, label) => {
    const uid = currentUser.uid;
    const isLocal = isLocalMode;

    try {
      if (collectionName === "sales") {
        const sale = trash.sales.find(s => s.id === id);
        if (sale) {
          // Re-deduct stocks
          if (sale.items && Array.isArray(sale.items)) {
            for (const item of sale.items) {
              const prod = products.find(p => p.id === item.productId);
              if (prod) {
                const newStock = Math.max(0, Number(prod.stock || 0) - Number(item.quantity || 0));
                await dbApi.updateProduct(uid, isLocal, item.productId, { ...prod, stock: newStock });
              }
            }
          }
          // Re-apply customer due
          if (sale.customerId && sale.dueAmount > 0) {
            const cust = customers.find(c => c.id === sale.customerId);
            if (cust) {
              const newDue = Number(cust.due || 0) + Number(sale.dueAmount);
              await dbApi.updateCustomer(uid, isLocal, sale.customerId, { ...cust, due: newDue });
            }
          }
        }
      } else if (collectionName === "purchases") {
        const pur = trash.purchases.find(p => p.id === id);
        if (pur) {
          // Re-add stocks
          if (pur.items && Array.isArray(pur.items)) {
            for (const item of pur.items) {
              const prod = products.find(p => p.id === item.productId);
              if (prod) {
                const newStock = Number(prod.stock || 0) + Number(item.quantity || 0);
                await dbApi.updateProduct(uid, isLocal, item.productId, { ...prod, stock: newStock });
              }
            }
          }
          // Re-apply supplier due
          if (pur.supplierId && pur.dueAmount > 0) {
            const supp = suppliers.find(s => s.id === pur.supplierId);
            if (supp) {
              const newDue = Number(supp.due || 0) + Number(pur.dueAmount);
              await dbApi.updateSupplier(uid, isLocal, pur.supplierId, { ...supp, due: newDue });
            }
          }
        }
      } else if (collectionName === "khata") {
        const entry = trash.khata.find(k => k.id === id);
        if (entry) {
          if (entry.partyType === "customer") {
            const cust = customers.find(c => c.id === entry.partyId);
            if (cust) {
              const factor = entry.type === "payment" ? -1 : 1;
              const newDue = Math.max(0, Number(cust.due || 0) + (Number(entry.amount) * factor));
              await dbApi.updateCustomer(uid, isLocal, entry.partyId, { ...cust, due: newDue });
            }
          } else if (entry.partyType === "supplier") {
            const supp = suppliers.find(s => s.id === entry.partyId);
            if (supp) {
              const factor = entry.type === "payment" ? -1 : 1;
              const newDue = Math.max(0, Number(supp.due || 0) + (Number(entry.amount) * factor));
              await dbApi.updateSupplier(uid, isLocal, entry.partyId, { ...supp, due: newDue });
            }
          }
        }
      }
    } catch (e) {
      console.error("Failed to restore balances for item:", e);
    }

    await dbApi.restoreDoc(uid, isLocal, collectionName, id, label);
    await fetchAllData();
  };

  const trashPermanentDeleteItem = async (collectionName, id, label) => {
    await dbApi.hardDeleteDoc(currentUser.uid, isLocalMode, collectionName, id, label);
    await fetchAllData();
  };

  const triggerFactoryReset = async () => {
    setLoading(true);
    try {
      const res = await dbApi.factoryResetUserData(currentUser.uid, isLocalMode);
      await fetchAllData();
      return res;
    } catch (e) {
      console.error("Factory reset failed:", e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  // Settings
  const updateShopInfo = async (settingsData) => {
    const res = await dbApi.saveShopSettings(currentUser.uid, isLocalMode, settingsData);
    setSettings(res);
    refreshActivities();
    return res;
  };

  // Backup & Restore
  const backupData = async () => {
    return await dbApi.getFullBackupData(currentUser.uid, isLocalMode);
  };

  const restoreData = async (backupObj) => {
    const res = await dbApi.restoreFullBackupData(currentUser.uid, isLocalMode, backupObj);
    if (res.success) {
      await fetchAllData();
    }
    return res;
  };

  // Filter Active vs Trash Items
  const activeCategories = categories.filter(c => !c.deleted);
  const activeProducts = products.filter(p => !p.deleted);
  
  // Dynamic live dues for active customers computed directly from sales and khata source-of-truth
  const activeCustomers = customers.filter(c => !c.deleted).map(cust => {
    const saleDues = sales.filter(s => !s.deleted && s.customerId === cust.id).reduce((acc, s) => acc + (s.dueAmount || 0), 0);
    const khataDues = khata.filter(k => !k.deleted && k.partyId === cust.id && k.partyType === "customer" && k.type === "due").reduce((acc, k) => acc + (k.amount || 0), 0);
    const khataPayments = khata.filter(k => !k.deleted && k.partyId === cust.id && k.partyType === "customer" && k.type === "payment").reduce((acc, k) => acc + (k.amount || 0), 0);
    return {
      ...cust,
      due: Math.max(0, saleDues + khataDues - khataPayments)
    };
  });

  // Dynamic live dues for active suppliers computed directly from purchases and khata source-of-truth
  const activeSuppliers = suppliers.filter(s => !s.deleted).map(supp => {
    const purchaseDues = purchases.filter(p => !p.deleted && p.supplierId === supp.id).reduce((acc, p) => acc + (p.dueAmount || 0), 0);
    const khataDues = khata.filter(k => !k.deleted && k.partyId === supp.id && k.partyType === "supplier" && k.type === "due").reduce((acc, k) => acc + (k.amount || 0), 0);
    const khataPayments = khata.filter(k => !k.deleted && k.partyId === supp.id && k.partyType === "supplier" && k.type === "payment").reduce((acc, k) => acc + (k.amount || 0), 0);
    return {
      ...supp,
      due: Math.max(0, purchaseDues + khataDues - khataPayments)
    };
  });

  const activeExpenses = expenses.filter(e => !e.deleted);
  const activeSales = sales.filter(s => !s.deleted);
  const activePurchases = purchases.filter(p => !p.deleted);
  const activeKhata = khata.filter(k => !k.deleted);

  const trash = {
    categories: categories.filter(c => c.deleted),
    products: products.filter(p => p.deleted),
    customers: customers.filter(c => c.deleted),
    suppliers: suppliers.filter(s => s.deleted),
    expenses: expenses.filter(e => e.deleted),
    sales: sales.filter(s => s.deleted),
    purchases: purchases.filter(p => p.deleted),
    khata: khata.filter(k => k.deleted)
  };

  const value = {
    categories: activeCategories,
    products: activeProducts,
    customers: activeCustomers,
    suppliers: activeSuppliers,
    expenses: activeExpenses,
    sales: activeSales,
    purchases: activePurchases,
    khata: activeKhata,
    trash,
    activities,
    settings,
    loading,
    error,
    refreshData: fetchAllData,
    addNewCategory,
    updateCategoryItem,
    deleteCategoryItem,
    addNewProduct,
    updateProductItem,
    deleteProductItem,
    addNewCustomer,
    updateCustomerItem,
    deleteCustomerItem,
    addNewSupplier,
    updateSupplierItem,
    deleteSupplierItem,
    addNewExpense,
    updateExpenseItem,
    deleteExpenseItem,
    addNewSale,
    deleteSaleItem,
    addNewPurchase,
    deletePurchaseItem,
    addNewKhataEntry,
    deleteKhataItem,
    trashRestoreItem,
    trashPermanentDeleteItem,
    updateShopInfo,
    backupData,
    restoreData,
    triggerFactoryReset
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}
