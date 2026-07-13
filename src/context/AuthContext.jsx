import React, { createContext, useState, useEffect, useContext } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "../firebase/config";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLocalMode, setIsLocalMode] = useState(!isFirebaseConfigured);

  // Initialize Auth State
  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          setCurrentUser({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || "আমার দোকান",
            emailVerified: user.emailVerified,
            isFirebase: true
          });
          setIsLocalMode(false);
        } else {
          setCurrentUser(null);
        }
        setLoading(false);
      });
      return unsubscribe;
    } else {
      // Local Mode Initialization
      const localUser = localStorage.getItem("shop_khata_pro_active_user");
      if (localUser) {
        try {
          setCurrentUser(JSON.parse(localUser));
        } catch (e) {
          localStorage.removeItem("shop_khata_pro_active_user");
        }
      }
      setIsLocalMode(true);
      setLoading(false);
    }
  }, []);

  // Register Function
  const registerUser = async (email, password, shopName) => {
    setLoading(true);
    if (!isLocalMode && auth) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
          displayName: shopName
        });
        setCurrentUser({
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: shopName,
          isFirebase: true
        });
        setLoading(false);
        return { success: true };
      } catch (error) {
        setLoading(false);
        return { success: false, error: error.message };
      }
    } else {
      // Local Mode Registration
      const localUsers = JSON.parse(localStorage.getItem("shop_khata_pro_local_users") || "[]");
      if (localUsers.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        setLoading(false);
        return { success: false, error: "এই ইমেইলটি ইতিপূর্বে নিবন্ধিত হয়েছে।" };
      }
      
      const newUser = {
        uid: "local_" + Date.now(),
        email: email.toLowerCase(),
        password: password, // For mock testing
        displayName: shopName,
        isFirebase: false
      };
      
      localUsers.push(newUser);
      localStorage.setItem("shop_khata_pro_local_users", JSON.stringify(localUsers));
      
      // Log them in immediately
      const activeUser = { ...newUser };
      delete activeUser.password;
      localStorage.setItem("shop_khata_pro_active_user", JSON.stringify(activeUser));
      setCurrentUser(activeUser);
      setLoading(false);
      return { success: true };
    }
  };

  // Login Function
  const loginUser = async (email, password) => {
    setLoading(true);
    if (!isLocalMode && auth) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        setCurrentUser({
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: userCredential.user.displayName || "আমার দোকান",
          isFirebase: true
        });
        setLoading(false);
        return { success: true };
      } catch (error) {
        setLoading(false);
        let errorMsg = error.message;
        if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
          errorMsg = "ভুল ইমেইল অথবা পাসওয়ার্ড দিয়েছেন। অনুগ্রহ করে আবার চেষ্টা করুন।";
        }
        return { success: false, error: errorMsg };
      }
    } else {
      // Local Mode Login
      const localUsers = JSON.parse(localStorage.getItem("shop_khata_pro_local_users") || "[]");
      const foundUser = localUsers.find(
        u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );
      
      if (foundUser) {
        const activeUser = { ...foundUser };
        delete activeUser.password;
        localStorage.setItem("shop_khata_pro_active_user", JSON.stringify(activeUser));
        setCurrentUser(activeUser);
        setLoading(false);
        return { success: true };
      } else {
        setLoading(false);
        return { success: false, error: "ভুল ইমেইল অথবা পাসওয়ার্ড দিয়েছেন। অনুগ্রহ করে আবার চেষ্টা করুন।" };
      }
    }
  };

  // Logout Function
  const logoutUser = async () => {
    setLoading(true);
    if (!isLocalMode && auth) {
      try {
        await signOut(auth);
        setCurrentUser(null);
      } catch (error) {
        console.error("Logout failed:", error);
      }
    } else {
      localStorage.removeItem("shop_khata_pro_active_user");
      setCurrentUser(null);
    }
    setLoading(false);
  };

  // Reset Password Function
  const resetPassword = async (email) => {
    if (!isLocalMode && auth) {
      try {
        await sendPasswordResetEmail(auth, email);
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    } else {
      // Local Mode Reset Password Mock
      const localUsers = JSON.parse(localStorage.getItem("shop_khata_pro_local_users") || "[]");
      const userExists = localUsers.some(u => u.email.toLowerCase() === email.toLowerCase());
      if (userExists) {
        return { success: true, message: "পাসওয়ার্ড রিসেট লিংক আপনার ইমেইলে প্রেরণ করা হয়েছে (ডেমো)।" };
      } else {
        return { success: false, error: "এই ইমেইল দিয়ে কোনো অ্যাকাউন্ট খুঁজে পাওয়া যায়নি।" };
      }
    }
  };

  // Update Shop/Profile Name
  const updateShopProfile = async (shopName) => {
    if (!isLocalMode && auth && auth.currentUser) {
      try {
        await updateProfile(auth.currentUser, {
          displayName: shopName
        });
        setCurrentUser(prev => ({ ...prev, displayName: shopName }));
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    } else {
      // Local Mode Update Profile
      if (currentUser) {
        const localUsers = JSON.parse(localStorage.getItem("shop_khata_pro_local_users") || "[]");
        const updatedUsers = localUsers.map(u => {
          if (u.uid === currentUser.uid) {
            return { ...u, displayName: shopName };
          }
          return u;
        });
        localStorage.setItem("shop_khata_pro_local_users", JSON.stringify(updatedUsers));
        
        const updatedUser = { ...currentUser, displayName: shopName };
        localStorage.setItem("shop_khata_pro_active_user", JSON.stringify(updatedUser));
        setCurrentUser(updatedUser);
        return { success: true };
      }
      return { success: false, error: "ইউজার লগইন করা নেই।" };
    }
  };

  const value = {
    currentUser,
    loading,
    isLocalMode,
    login: loginUser,
    register: registerUser,
    logout: logoutUser,
    resetPassword,
    updateShopProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
