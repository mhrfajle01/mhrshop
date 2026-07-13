import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  increment,
  writeBatch
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./config";

// --- HELPERS FOR LOCAL STORAGE FALLBACK ---
const getLocalData = (uid, collectionName) => {
  const key = `shop_khata_pro_${uid}_${collectionName}`;
  return JSON.parse(localStorage.getItem(key) || "[]");
};

const saveLocalData = (uid, collectionName, data) => {
  const key = `shop_khata_pro_${uid}_${collectionName}`;
  localStorage.setItem(key, JSON.stringify(data));
};

const getLocalDoc = (uid, collectionName, docId) => {
  const data = getLocalData(uid, collectionName);
  return data.find(item => item.id === docId) || null;
};

const saveLocalDoc = (uid, collectionName, docId, docData) => {
  const data = getLocalData(uid, collectionName);
  const index = data.findIndex(item => item.id === docId);
  const updatedDoc = { id: docId, ...docData };
  
  if (index >= 0) {
    data[index] = updatedDoc;
  } else {
    data.push(updatedDoc);
  }
  saveLocalData(uid, collectionName, data);
  return updatedDoc;
};

const deleteLocalDoc = (uid, collectionName, docId) => {
  const data = getLocalData(uid, collectionName);
  const filtered = data.filter(item => item.id !== docId);
  saveLocalData(uid, collectionName, filtered);
};

// Log recent activity helper
export const logActivity = async (uid, isLocal, activity) => {
  const newActivity = {
    id: "act_" + Date.now(),
    timestamp: new Date().toISOString(),
    ...activity
  };

  if (!isLocal && isFirebaseConfigured && db) {
    try {
      const colRef = collection(db, "users", uid, "activities");
      await addDoc(colRef, newActivity);
    } catch (e) {
      console.error("Failed to log activity to Firestore:", e);
    }
  } else {
    const activities = getLocalData(uid, "activities");
    activities.unshift(newActivity);
    // Keep only last 100 activities to optimize local storage
    saveLocalData(uid, "activities", activities.slice(0, 100));
  }
};

export const getActivities = async (uid, isLocal) => {
  if (!isLocal && isFirebaseConfigured && db) {
    try {
      const colRef = collection(db, "users", uid, "activities");
      const q = query(colRef, orderBy("timestamp", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.error("Failed to fetch activities from Firestore:", e);
      return [];
    }
  } else {
    return getLocalData(uid, "activities");
  }
};

// --- CATEGORIES CRUD ---
export const getCategories = async (uid, isLocal) => {
  if (!isLocal && isFirebaseConfigured && db) {
    const colRef = collection(db, "users", uid, "categories");
    const q = query(colRef, orderBy("name", "asc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } else {
    return getLocalData(uid, "categories").sort((a, b) => a.name.localeCompare(b.name));
  }
};

export const addCategory = async (uid, isLocal, categoryData) => {
  const data = { ...categoryData, createdAt: new Date().toISOString() };
  if (!isLocal && isFirebaseConfigured && db) {
    const colRef = collection(db, "users", uid, "categories");
    const docRef = await addDoc(colRef, data);
    await logActivity(uid, isLocal, { action: "Create", details: `Category "${data.name}" তৈরি করা হয়েছে` });
    return { id: docRef.id, ...data };
  } else {
    const id = "cat_" + Date.now();
    const created = saveLocalDoc(uid, "categories", id, data);
    await logActivity(uid, isLocal, { action: "Create", details: `Category "${data.name}" তৈরি করা হয়েছে (লোকাল)` });
    return created;
  }
};

export const updateCategory = async (uid, isLocal, id, categoryData) => {
  if (!isLocal && isFirebaseConfigured && db) {
    const docRef = doc(db, "users", uid, "categories", id);
    await updateDoc(docRef, categoryData);
    await logActivity(uid, isLocal, { action: "Update", details: `Category "${categoryData.name}" আপডেট করা হয়েছে` });
    return { id, ...categoryData };
  } else {
    const updated = saveLocalDoc(uid, "categories", id, categoryData);
    await logActivity(uid, isLocal, { action: "Update", details: `Category "${categoryData.name}" আপডেট করা হয়েছে (লোকাল)` });
    return updated;
  }
};

export const deleteCategory = async (uid, isLocal, id, categoryName) => {
  if (!isLocal && isFirebaseConfigured && db) {
    const docRef = doc(db, "users", uid, "categories", id);
    await deleteDoc(docRef);
    await logActivity(uid, isLocal, { action: "Delete", details: `Category "${categoryName}" মুছে ফেলা হয়েছে` });
  } else {
    deleteLocalDoc(uid, "categories", id);
    await logActivity(uid, isLocal, { action: "Delete", details: `Category "${categoryName}" মুছে ফেলা হয়েছে (লোকাল)` });
  }
};


// --- PRODUCTS CRUD ---
export const getProducts = async (uid, isLocal) => {
  if (!isLocal && isFirebaseConfigured && db) {
    const colRef = collection(db, "users", uid, "products");
    const q = query(colRef, orderBy("name", "asc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } else {
    return getLocalData(uid, "products").sort((a, b) => a.name.localeCompare(b.name));
  }
};

export const addProduct = async (uid, isLocal, productData) => {
  const data = { 
    ...productData, 
    stock: Number(productData.stock || 0),
    purchasePrice: Number(productData.purchasePrice || 0),
    sellingPrice: Number(productData.sellingPrice || 0),
    minStock: Number(productData.minStock || 0),
    createdAt: new Date().toISOString() 
  };
  
  if (!isLocal && isFirebaseConfigured && db) {
    const colRef = collection(db, "users", uid, "products");
    const docRef = await addDoc(colRef, data);
    await logActivity(uid, isLocal, { action: "Create", details: `Product "${data.name}" যোগ করা হয়েছে। স্টক: ${data.stock} ${data.unit}` });
    return { id: docRef.id, ...data };
  } else {
    const id = "prod_" + Date.now();
    const created = saveLocalDoc(uid, "products", id, data);
    await logActivity(uid, isLocal, { action: "Create", details: `Product "${data.name}" যোগ করা হয়েছে (লোকাল)। স্টক: ${data.stock} ${data.unit}` });
    return created;
  }
};

export const updateProduct = async (uid, isLocal, id, productData) => {
  const data = {
    ...productData,
    stock: Number(productData.stock || 0),
    purchasePrice: Number(productData.purchasePrice || 0),
    sellingPrice: Number(productData.sellingPrice || 0),
    minStock: Number(productData.minStock || 0)
  };

  if (!isLocal && isFirebaseConfigured && db) {
    const docRef = doc(db, "users", uid, "products", id);
    await updateDoc(docRef, data);
    await logActivity(uid, isLocal, { action: "Update", details: `Product "${data.name}" আপডেট করা হয়েছে` });
    return { id, ...data };
  } else {
    const updated = saveLocalDoc(uid, "products", id, data);
    await logActivity(uid, isLocal, { action: "Update", details: `Product "${data.name}" আপডেট করা হয়েছে (লোকাল)` });
    return updated;
  }
};

export const deleteProduct = async (uid, isLocal, id, productName) => {
  if (!isLocal && isFirebaseConfigured && db) {
    const docRef = doc(db, "users", uid, "products", id);
    await deleteDoc(docRef);
    await logActivity(uid, isLocal, { action: "Delete", details: `Product "${productName}" মুছে ফেলা হয়েছে` });
  } else {
    deleteLocalDoc(uid, "products", id);
    await logActivity(uid, isLocal, { action: "Delete", details: `Product "${productName}" মুছে ফেলা হয়েছে (লোকাল)` });
  }
};


// --- CUSTOMERS CRUD ---
export const getCustomers = async (uid, isLocal) => {
  if (!isLocal && isFirebaseConfigured && db) {
    const colRef = collection(db, "users", uid, "customers");
    const q = query(colRef, orderBy("name", "asc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } else {
    return getLocalData(uid, "customers").sort((a, b) => a.name.localeCompare(b.name));
  }
};

export const addCustomer = async (uid, isLocal, customerData) => {
  const data = { 
    ...customerData, 
    due: Number(customerData.due || 0),
    createdAt: new Date().toISOString() 
  };
  if (!isLocal && isFirebaseConfigured && db) {
    const colRef = collection(db, "users", uid, "customers");
    const docRef = await addDoc(colRef, data);
    await logActivity(uid, isLocal, { action: "Create", details: `Customer "${data.name}" যোগ করা হয়েছে` });
    return { id: docRef.id, ...data };
  } else {
    const id = "cust_" + Date.now();
    const created = saveLocalDoc(uid, "customers", id, data);
    await logActivity(uid, isLocal, { action: "Create", details: `Customer "${data.name}" যোগ করা হয়েছে (লোকাল)` });
    return created;
  }
};

export const updateCustomer = async (uid, isLocal, id, customerData) => {
  const data = {
    ...customerData,
    due: Number(customerData.due || 0)
  };
  if (!isLocal && isFirebaseConfigured && db) {
    const docRef = doc(db, "users", uid, "customers", id);
    await updateDoc(docRef, data);
    await logActivity(uid, isLocal, { action: "Update", details: `Customer "${data.name}" আপডেট করা হয়েছে` });
    return { id, ...data };
  } else {
    const updated = saveLocalDoc(uid, "customers", id, data);
    await logActivity(uid, isLocal, { action: "Update", details: `Customer "${data.name}" আপডেট করা হয়েছে (লোকাল)` });
    return updated;
  }
};

export const deleteCustomer = async (uid, isLocal, id, name) => {
  if (!isLocal && isFirebaseConfigured && db) {
    const docRef = doc(db, "users", uid, "customers", id);
    await deleteDoc(docRef);
    await logActivity(uid, isLocal, { action: "Delete", details: `Customer "${name}" মুছে ফেলা হয়েছে` });
  } else {
    deleteLocalDoc(uid, "customers", id);
    await logActivity(uid, isLocal, { action: "Delete", details: `Customer "${name}" মুছে ফেলা হয়েছে (লোকাল)` });
  }
};


// --- SUPPLIERS CRUD ---
export const getSuppliers = async (uid, isLocal) => {
  if (!isLocal && isFirebaseConfigured && db) {
    const colRef = collection(db, "users", uid, "suppliers");
    const q = query(colRef, orderBy("name", "asc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } else {
    return getLocalData(uid, "suppliers").sort((a, b) => a.name.localeCompare(b.name));
  }
};

export const addSupplier = async (uid, isLocal, supplierData) => {
  const data = { 
    ...supplierData, 
    due: Number(supplierData.due || 0),
    createdAt: new Date().toISOString() 
  };
  if (!isLocal && isFirebaseConfigured && db) {
    const colRef = collection(db, "users", uid, "suppliers");
    const docRef = await addDoc(colRef, data);
    await logActivity(uid, isLocal, { action: "Create", details: `Supplier "${data.name}" যোগ করা হয়েছে` });
    return { id: docRef.id, ...data };
  } else {
    const id = "supp_" + Date.now();
    const created = saveLocalDoc(uid, "suppliers", id, data);
    await logActivity(uid, isLocal, { action: "Create", details: `Supplier "${data.name}" যোগ করা হয়েছে (লোকাল)` });
    return created;
  }
};

export const updateSupplier = async (uid, isLocal, id, supplierData) => {
  const data = {
    ...supplierData,
    due: Number(supplierData.due || 0)
  };
  if (!isLocal && isFirebaseConfigured && db) {
    const docRef = doc(db, "users", uid, "suppliers", id);
    await updateDoc(docRef, data);
    await logActivity(uid, isLocal, { action: "Update", details: `Supplier "${data.name}" আপডেট করা হয়েছে` });
    return { id, ...data };
  } else {
    const updated = saveLocalDoc(uid, "suppliers", id, data);
    await logActivity(uid, isLocal, { action: "Update", details: `Supplier "${data.name}" আপডেট করা হয়েছে (লোকাল)` });
    return updated;
  }
};

export const deleteSupplier = async (uid, isLocal, id, name) => {
  if (!isLocal && isFirebaseConfigured && db) {
    const docRef = doc(db, "users", uid, "suppliers", id);
    await deleteDoc(docRef);
    await logActivity(uid, isLocal, { action: "Delete", details: `Supplier "${name}" মুছে ফেলা হয়েছে` });
  } else {
    deleteLocalDoc(uid, "suppliers", id);
    await logActivity(uid, isLocal, { action: "Delete", details: `Supplier "${name}" মুছে ফেলা হয়েছে (লোকাল)` });
  }
};


// --- EXPENSES CRUD ---
export const getExpenses = async (uid, isLocal) => {
  if (!isLocal && isFirebaseConfigured && db) {
    const colRef = collection(db, "users", uid, "expenses");
    const q = query(colRef, orderBy("date", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } else {
    return getLocalData(uid, "expenses").sort((a, b) => b.date.localeCompare(a.date));
  }
};

export const addExpense = async (uid, isLocal, expenseData) => {
  const data = {
    ...expenseData,
    amount: Number(expenseData.amount || 0),
    createdAt: new Date().toISOString()
  };
  if (!isLocal && isFirebaseConfigured && db) {
    const colRef = collection(db, "users", uid, "expenses");
    const docRef = await addDoc(colRef, data);
    await logActivity(uid, isLocal, { action: "Create", details: `খরচ নথিভুক্ত করা হয়েছে: ৳${data.amount} (${data.category})` });
    return { id: docRef.id, ...data };
  } else {
    const id = "exp_" + Date.now();
    const created = saveLocalDoc(uid, "expenses", id, data);
    await logActivity(uid, isLocal, { action: "Create", details: `খরচ নথিভুক্ত করা হয়েছে (লোকাল): ৳${data.amount} (${data.category})` });
    return created;
  }
};

export const updateExpense = async (uid, isLocal, id, expenseData) => {
  const data = {
    ...expenseData,
    amount: Number(expenseData.amount || 0)
  };
  if (!isLocal && isFirebaseConfigured && db) {
    const docRef = doc(db, "users", uid, "expenses", id);
    await updateDoc(docRef, data);
    await logActivity(uid, isLocal, { action: "Update", details: `খরচ আপডেট করা হয়েছে: ৳${data.amount}` });
    return { id, ...data };
  } else {
    const updated = saveLocalDoc(uid, "expenses", id, data);
    await logActivity(uid, isLocal, { action: "Update", details: `খরচ আপডেট করা হয়েছে (লোকাল): ৳${data.amount}` });
    return updated;
  }
};

export const deleteExpense = async (uid, isLocal, id, amount) => {
  if (!isLocal && isFirebaseConfigured && db) {
    const docRef = doc(db, "users", uid, "expenses", id);
    await deleteDoc(docRef);
    await logActivity(uid, isLocal, { action: "Delete", details: `খরচ মুছে ফেলা হয়েছে: ৳${amount}` });
  } else {
    deleteLocalDoc(uid, "expenses", id);
    await logActivity(uid, isLocal, { action: "Delete", details: `খরচ মুছে ফেলা হয়েছে (লোকাল): ৳${amount}` });
  }
};


// --- SALES TRANSACTION (AUTO STOCK & DUE UPDATE) ---
export const getSales = async (uid, isLocal) => {
  if (!isLocal && isFirebaseConfigured && db) {
    const colRef = collection(db, "users", uid, "sales");
    const q = query(colRef, orderBy("date", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } else {
    return getLocalData(uid, "sales").sort((a, b) => b.date.localeCompare(a.date));
  }
};

export const addSale = async (uid, isLocal, saleData) => {
  // Parse numbers
  const totalAmount = Number(saleData.totalAmount || 0);
  const discount = Number(saleData.discount || 0);
  const payableAmount = Number(saleData.payableAmount || 0);
  const paidAmount = Number(saleData.paidAmount || 0);
  const dueAmount = Number(saleData.dueAmount || 0);
  
  const sale = {
    ...saleData,
    totalAmount,
    discount,
    payableAmount,
    paidAmount,
    dueAmount,
    createdAt: new Date().toISOString()
  };

  if (!isLocal && isFirebaseConfigured && db) {
    // 1. Firebase Implementation: Batch update
    const batch = writeBatch(db);
    
    // Create Sale Doc
    const salesColRef = collection(db, "users", uid, "sales");
    const newSaleDocRef = doc(salesColRef);
    batch.set(newSaleDocRef, sale);
    
    // Update Stocks
    for (const item of sale.items) {
      const prodRef = doc(db, "users", uid, "products", item.productId);
      batch.update(prodRef, {
        stock: increment(-item.quantity)
      });
    }

    // Update Customer Due if customer exists & there is due
    if (sale.customerId && dueAmount > 0) {
      const custRef = doc(db, "users", uid, "customers", sale.customerId);
      batch.update(custRef, {
        due: increment(dueAmount)
      });

      // Also create a Khata entry
      const khataColRef = collection(db, "users", uid, "khata");
      const newKhataDocRef = doc(khataColRef);
      batch.set(newKhataDocRef, {
        id: newKhataDocRef.id,
        partyId: sale.customerId,
        partyType: "customer",
        partyName: sale.customerName,
        type: "due", // money given (credit extended)
        amount: dueAmount,
        description: `বিক্রয় রসিদ নং: ${sale.invoiceNumber} (বাকী)`,
        date: sale.date,
        createdAt: new Date().toISOString()
      });
    }

    await batch.commit();
    await logActivity(uid, isLocal, { action: "Create", details: `বিক্রয় রসিদ নং ${sale.invoiceNumber} তৈরি করা হয়েছে। মোট: ৳${payableAmount}` });
    return { id: newSaleDocRef.id, ...sale };

  } else {
    // 2. Local Storage Implementation
    const localSales = getLocalData(uid, "sales");
    const saleId = "sale_" + Date.now();
    const newSale = { id: saleId, ...sale };
    
    localSales.push(newSale);
    saveLocalData(uid, "sales", localSales);
    
    // Update stocks locally
    const products = getLocalData(uid, "products");
    for (const item of sale.items) {
      const prodIdx = products.findIndex(p => p.id === item.productId);
      if (prodIdx >= 0) {
        products[prodIdx].stock = Number(products[prodIdx].stock || 0) - item.quantity;
      }
    }
    saveLocalData(uid, "products", products);

    // Update Customer Due and create Khata locally
    if (sale.customerId && dueAmount > 0) {
      const customers = getLocalData(uid, "customers");
      const custIdx = customers.findIndex(c => c.id === sale.customerId);
      if (custIdx >= 0) {
        customers[custIdx].due = Number(customers[custIdx].due || 0) + dueAmount;
        saveLocalData(uid, "customers", customers);
      }

      const khataList = getLocalData(uid, "khata");
      khataList.push({
        id: "khata_" + Date.now(),
        partyId: sale.customerId,
        partyType: "customer",
        partyName: sale.customerName,
        type: "due",
        amount: dueAmount,
        description: `বিক্রয় রসিদ নং: ${sale.invoiceNumber} (বাকী)`,
        date: sale.date,
        createdAt: new Date().toISOString()
      });
      saveLocalData(uid, "khata", khataList);
    }
    
    await logActivity(uid, isLocal, { action: "Create", details: `বিক্রয় রসিদ নং ${sale.invoiceNumber} তৈরি করা হয়েছে (লোকাল)। মোট: ৳${payableAmount}` });
    return newSale;
  }
};

export const deleteSale = async (uid, isLocal, saleId) => {
  // When deleting a sale, we should ideally reverse the stock, but for simplicity
  // and performance, we'll delete the sale entry and log it. In a real-world system, we reverse.
  // Let's implement stock reversing so it's fully production-ready!
  if (!isLocal && isFirebaseConfigured && db) {
    const saleRef = doc(db, "users", uid, "sales", saleId);
    const saleSnap = await getDocs(query(collection(db, "users", uid, "sales")));
    const sale = saleSnap.docs.find(d => d.id === saleId)?.data();
    
    if (sale) {
      const batch = writeBatch(db);
      
      // Reverse stock
      for (const item of sale.items) {
        const prodRef = doc(db, "users", uid, "products", item.productId);
        batch.update(prodRef, {
          stock: increment(item.quantity)
        });
      }
      
      // Reverse Customer Due
      if (sale.customerId && sale.dueAmount > 0) {
        const custRef = doc(db, "users", uid, "customers", sale.customerId);
        batch.update(custRef, {
          due: increment(-sale.dueAmount)
        });
        
        // Find and delete the khata entry corresponding to this sale
        // Firestore deletes are simpler via separate transactions, but let's delete the sale doc itself in this batch
      }
      
      batch.delete(saleRef);
      await batch.commit();
      await logActivity(uid, isLocal, { action: "Delete", details: `বিক্রয় রসিদ নং ${sale.invoiceNumber} ডিলিট করা হয়েছে (স্টক রিভার্স করা হয়েছে)` });
    }
  } else {
    const sales = getLocalData(uid, "sales");
    const sale = sales.find(s => s.id === saleId);
    if (sale) {
      // Reverse stock
      const products = getLocalData(uid, "products");
      for (const item of sale.items) {
        const prodIdx = products.findIndex(p => p.id === item.productId);
        if (prodIdx >= 0) {
          products[prodIdx].stock = Number(products[prodIdx].stock || 0) + item.quantity;
        }
      }
      saveLocalData(uid, "products", products);
      
      // Reverse customer due
      if (sale.customerId && sale.dueAmount > 0) {
        const customers = getLocalData(uid, "customers");
        const custIdx = customers.findIndex(c => c.id === sale.customerId);
        if (custIdx >= 0) {
          customers[custIdx].due = Math.max(0, Number(customers[custIdx].due || 0) - sale.dueAmount);
          saveLocalData(uid, "customers", customers);
        }
        
        // Delete corresponding local khata entry
        const khataList = getLocalData(uid, "khata");
        const filteredKhata = khataList.filter(k => k.description !== `বিক্রয় রসিদ নং: ${sale.invoiceNumber} (বাকী)`);
        saveLocalData(uid, "khata", filteredKhata);
      }
      
      deleteLocalDoc(uid, "sales", saleId);
      await logActivity(uid, isLocal, { action: "Delete", details: `বিক্রয় রসিদ নং ${sale.invoiceNumber} ডিলিট করা হয়েছে (লোকাল, স্টক রিভার্স করা হয়েছে)` });
    }
  }
};


// --- PURCHASES TRANSACTION (AUTO STOCK & DUE UPDATE) ---
export const getPurchases = async (uid, isLocal) => {
  if (!isLocal && isFirebaseConfigured && db) {
    const colRef = collection(db, "users", uid, "purchases");
    const q = query(colRef, orderBy("date", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } else {
    return getLocalData(uid, "purchases").sort((a, b) => b.date.localeCompare(a.date));
  }
};

export const addPurchase = async (uid, isLocal, purchaseData) => {
  const totalAmount = Number(purchaseData.totalAmount || 0);
  const paidAmount = Number(purchaseData.paidAmount || 0);
  const dueAmount = Number(purchaseData.dueAmount || 0);
  
  const purchase = {
    ...purchaseData,
    totalAmount,
    paidAmount,
    dueAmount,
    createdAt: new Date().toISOString()
  };

  if (!isLocal && isFirebaseConfigured && db) {
    const batch = writeBatch(db);
    
    // Create Purchase Doc
    const purchasesColRef = collection(db, "users", uid, "purchases");
    const newPurchaseDocRef = doc(purchasesColRef);
    batch.set(newPurchaseDocRef, purchase);
    
    // Update Stocks (Add stock on purchase)
    for (const item of purchase.items) {
      const prodRef = doc(db, "users", uid, "products", item.productId);
      batch.update(prodRef, {
        stock: increment(item.quantity)
      });
      // Optionally update product's purchase price to the latest one
      if (item.purchasePrice > 0) {
        batch.update(prodRef, {
          purchasePrice: item.purchasePrice
        });
      }
    }

    // Update Supplier Due if supplier exists & there is due
    if (purchase.supplierId && dueAmount > 0) {
      const suppRef = doc(db, "users", uid, "suppliers", purchase.supplierId);
      batch.update(suppRef, {
        due: increment(dueAmount)
      });

      // Also create a Khata entry
      const khataColRef = collection(db, "users", uid, "khata");
      const newKhataDocRef = doc(khataColRef);
      batch.set(newKhataDocRef, {
        id: newKhataDocRef.id,
        partyId: purchase.supplierId,
        partyType: "supplier",
        partyName: purchase.supplierName,
        type: "due", // money we owe (debit)
        amount: dueAmount,
        description: `ক্রয় রসিদ নং: ${purchase.invoiceNumber} (বাকী)`,
        date: purchase.date,
        createdAt: new Date().toISOString()
      });
    }

    await batch.commit();
    await logActivity(uid, isLocal, { action: "Create", details: `ক্রয় রসিদ নং ${purchase.invoiceNumber} তৈরি করা হয়েছে। মোট: ৳${totalAmount}` });
    return { id: newPurchaseDocRef.id, ...purchase };

  } else {
    // Local Mode
    const localPurchases = getLocalData(uid, "purchases");
    const purchaseId = "purch_" + Date.now();
    const newPurchase = { id: purchaseId, ...purchase };
    
    localPurchases.push(newPurchase);
    saveLocalData(uid, "purchases", localPurchases);
    
    // Update stocks and purchase prices locally
    const products = getLocalData(uid, "products");
    for (const item of purchase.items) {
      const prodIdx = products.findIndex(p => p.id === item.productId);
      if (prodIdx >= 0) {
        products[prodIdx].stock = Number(products[prodIdx].stock || 0) + item.quantity;
        if (item.purchasePrice > 0) {
          products[prodIdx].purchasePrice = item.purchasePrice;
        }
      }
    }
    saveLocalData(uid, "products", products);

    // Update Supplier Due and create Khata locally
    if (purchase.supplierId && dueAmount > 0) {
      const suppliers = getLocalData(uid, "suppliers");
      const suppIdx = suppliers.findIndex(s => s.id === purchase.supplierId);
      if (suppIdx >= 0) {
        suppliers[suppIdx].due = Number(suppliers[suppIdx].due || 0) + dueAmount;
        saveLocalData(uid, "suppliers", suppliers);
      }

      const khataList = getLocalData(uid, "khata");
      khataList.push({
        id: "khata_" + Date.now(),
        partyId: purchase.supplierId,
        partyType: "supplier",
        partyName: purchase.supplierName,
        type: "due",
        amount: dueAmount,
        description: `ক্রয় রসিদ নং: ${purchase.invoiceNumber} (বাকী)`,
        date: purchase.date,
        createdAt: new Date().toISOString()
      });
      saveLocalData(uid, "khata", khataList);
    }
    
    await logActivity(uid, isLocal, { action: "Create", details: `ক্রয় রসিদ নং ${purchase.invoiceNumber} তৈরি করা হয়েছে (লোকাল)। মোট: ৳${totalAmount}` });
    return newPurchase;
  }
};


// --- KHATA (DUE LEDGER) CRUD ---
export const getKhata = async (uid, isLocal) => {
  if (!isLocal && isFirebaseConfigured && db) {
    const colRef = collection(db, "users", uid, "khata");
    const q = query(colRef, orderBy("date", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } else {
    return getLocalData(uid, "khata").sort((a, b) => b.date.localeCompare(a.date));
  }
};

export const addKhataTransaction = async (uid, isLocal, transData) => {
  const amount = Number(transData.amount || 0);
  const data = {
    ...transData,
    amount,
    createdAt: new Date().toISOString()
  };

  if (!isLocal && isFirebaseConfigured && db) {
    const batch = writeBatch(db);
    
    // Add Khata Doc
    const khataColRef = collection(db, "users", uid, "khata");
    const newKhataDocRef = doc(khataColRef);
    batch.set(newKhataDocRef, data);
    
    // Update Customer/Supplier balances
    // type: "payment" (money received from customer, or money paid to supplier)
    // type: "due" (due added)
    const factor = data.type === "payment" ? -1 : 1;
    const balanceChange = amount * factor;

    if (data.partyType === "customer") {
      const custRef = doc(db, "users", uid, "customers", data.partyId);
      batch.update(custRef, {
        due: increment(balanceChange)
      });
    } else if (data.partyType === "supplier") {
      const suppRef = doc(db, "users", uid, "suppliers", data.partyId);
      batch.update(suppRef, {
        due: increment(balanceChange)
      });
    }

    await batch.commit();
    await logActivity(uid, isLocal, { 
      action: "Create", 
      details: `${data.partyType === "customer" ? "কাস্টমার" : "সাপ্লায়ার"} "${data.partyName}" এর খাতায় লেনদেন যুক্ত করা হয়েছে: ৳${amount} (${data.type === "payment" ? "পরিশোধ" : "বাকী"})` 
    });
    return { id: newKhataDocRef.id, ...data };

  } else {
    // Local Storage
    const khataList = getLocalData(uid, "khata");
    const id = "khata_" + Date.now();
    const created = { id, ...data };
    
    khataList.push(created);
    saveLocalData(uid, "khata", khataList);
    
    const factor = data.type === "payment" ? -1 : 1;
    const balanceChange = amount * factor;

    if (data.partyType === "customer") {
      const customers = getLocalData(uid, "customers");
      const idx = customers.findIndex(c => c.id === data.partyId);
      if (idx >= 0) {
        customers[idx].due = Math.max(0, Number(customers[idx].due || 0) + balanceChange);
        saveLocalData(uid, "customers", customers);
      }
    } else if (data.partyType === "supplier") {
      const suppliers = getLocalData(uid, "suppliers");
      const idx = suppliers.findIndex(s => s.id === data.partyId);
      if (idx >= 0) {
        suppliers[idx].due = Math.max(0, Number(suppliers[idx].due || 0) + balanceChange);
        saveLocalData(uid, "suppliers", suppliers);
      }
    }

    await logActivity(uid, isLocal, { 
      action: "Create", 
      details: `(লোকাল) ${data.partyType === "customer" ? "কাস্টমার" : "সাপ্লায়ার"} "${data.partyName}" এর খাতায় লেনদেন যুক্ত করা হয়েছে: ৳${amount} (${data.type === "payment" ? "পরিশোধ" : "বাকী"})` 
    });
    return created;
  }
};


// --- SHOP SETTINGS CRUD ---
export const getShopSettings = async (uid, isLocal) => {
  if (!isLocal && isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "users", uid, "settings", "shopInfo");
      const snapshot = await getDocs(query(collection(db, "users", uid, "settings")));
      const docData = snapshot.docs.find(d => d.id === "shopInfo")?.data();
      return docData || getDefaultSettings();
    } catch (e) {
      return getDefaultSettings();
    }
  } else {
    const key = `shop_khata_pro_${uid}_settings_shopInfo`;
    const settings = localStorage.getItem(key);
    return settings ? JSON.parse(settings) : getDefaultSettings();
  }
};

export const saveShopSettings = async (uid, isLocal, settingsData) => {
  if (!isLocal && isFirebaseConfigured && db) {
    const docRef = doc(db, "users", uid, "settings", "shopInfo");
    await setDoc(docRef, settingsData);
    await logActivity(uid, isLocal, { action: "Update", details: `দোকানের তথ্য আপডেট করা হয়েছে।` });
    return settingsData;
  } else {
    const key = `shop_khata_pro_${uid}_settings_shopInfo`;
    localStorage.setItem(key, JSON.stringify(settingsData));
    await logActivity(uid, isLocal, { action: "Update", details: `(লোকাল) দোকানের তথ্য আপডেট করা হয়েছে।` });
    return settingsData;
  }
};

const getDefaultSettings = () => ({
  shopName: "আমার দোকান",
  ownerName: "মালিক",
  phone: "017XXXXXXXX",
  address: "বাংলাদেশ",
  currency: "৳",
  taxPercent: 0,
  footerNote: "আবার আসবেন, ধন্যবাদ!"
});


// --- BULK BACKUP & RESTORE DATA ---
export const getFullBackupData = async (uid, isLocal) => {
  const collections = ["categories", "products", "customers", "suppliers", "expenses", "sales", "purchases", "khata", "activities"];
  const backup = {};
  
  for (const col of collections) {
    if (!isLocal && isFirebaseConfigured && db) {
      const colRef = collection(db, "users", uid, col);
      const snap = await getDocs(colRef);
      backup[col] = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      backup[col] = getLocalData(uid, col);
    }
  }
  
  // Settings
  backup["settings"] = await getShopSettings(uid, isLocal);
  return backup;
};

export const restoreFullBackupData = async (uid, isLocal, backupObj) => {
  if (!backupObj) return { success: false, error: "রিস্টোর করার মতো কোনো ডাটা পাওয়া যায়নি।" };
  
  const collections = ["categories", "products", "customers", "suppliers", "expenses", "sales", "purchases", "khata", "activities"];
  
  if (!isLocal && isFirebaseConfigured && db) {
    // Restore to Firestore (We can clear existing or merge. For safety, let's write what is present)
    for (const colName of collections) {
      if (Array.isArray(backupObj[colName])) {
        for (const item of backupObj[colName]) {
          const { id, ...data } = item;
          const docRef = doc(db, "users", uid, colName, id);
          await setDoc(docRef, data);
        }
      }
    }
    if (backupObj.settings) {
      await saveShopSettings(uid, false, backupObj.settings);
    }
  } else {
    // Restore to Local Storage
    for (const colName of collections) {
      if (Array.isArray(backupObj[colName])) {
        saveLocalData(uid, colName, backupObj[colName]);
      }
    }
    if (backupObj.settings) {
      const key = `shop_khata_pro_${uid}_settings_shopInfo`;
      localStorage.setItem(key, JSON.stringify(backupObj.settings));
    }
  }
  
  await logActivity(uid, isLocal, { action: "Restore", details: `ডাটা ব্যাকআপ থেকে রিস্টোর করা হয়েছে।` });
  return { success: true };
};

// --- DYNAMIC TRASH / SOFT DELETE SYSTEM ---
export const softDeleteDoc = async (uid, isLocal, collectionName, id, label) => {
  const data = { deleted: true, deletedAt: new Date().toISOString() };
  if (!isLocal && isFirebaseConfigured && db) {
    const docRef = doc(db, "users", uid, collectionName, id);
    await updateDoc(docRef, data);
  } else {
    const docData = getLocalDoc(uid, collectionName, id);
    if (docData) {
      saveLocalDoc(uid, collectionName, id, { ...docData, ...data });
    }
  }
  await logActivity(uid, isLocal, { action: "Delete", details: `${label} মুছে ফেলা হয়েছে (রিসাইকেল বিন)` });
};

export const restoreDoc = async (uid, isLocal, collectionName, id, label) => {
  if (!isLocal && isFirebaseConfigured && db) {
    const docRef = doc(db, "users", uid, collectionName, id);
    await updateDoc(docRef, { deleted: false, deletedAt: null });
  } else {
    const docData = getLocalDoc(uid, collectionName, id);
    if (docData) {
      const updated = { ...docData, deleted: false, deletedAt: null };
      saveLocalDoc(uid, collectionName, id, updated);
    }
  }
  await logActivity(uid, isLocal, { action: "Create", details: `${label} পুনরুদ্ধার (Restore) করা হয়েছে` });
};

export const hardDeleteDoc = async (uid, isLocal, collectionName, id, label) => {
  if (!isLocal && isFirebaseConfigured && db) {
    const docRef = doc(db, "users", uid, collectionName, id);
    await deleteDoc(docRef);
  } else {
    deleteLocalDoc(uid, collectionName, id);
  }
  await logActivity(uid, isLocal, { action: "Delete", details: `${label} চিরতরে মুছে ফেলা হয়েছে (Permanent)` });
};

export const factoryResetUserData = async (uid, isLocal) => {
  if (isLocal) {
    localStorage.clear();
    return { success: true };
  }
  
  if (!isFirebaseConfigured || !db) {
    localStorage.clear();
    return { success: true };
  }

  try {
    const cols = ["categories", "products", "customers", "suppliers", "expenses", "sales", "purchases", "khata", "settings", "activities"];
    for (const colName of cols) {
      const colRef = collection(db, "users", uid, colName);
      const snap = await getDocs(colRef);
      const deletePromises = snap.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    }
    localStorage.clear();
    return { success: true };
  } catch (error) {
    console.error("Factory reset execution failed:", error);
    throw error;
  }
};
