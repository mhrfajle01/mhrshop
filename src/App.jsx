import React from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { RouterProvider, useRouter } from "./context/RouterContext";
import { DataProvider } from "./context/DataContext";

// Import Layout Components
import Navbar from "./components/Navbar";
import BottomNav from "./components/BottomNav";

// Import Pages Views
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Sales from "./pages/Sales";
import SalesNew from "./pages/SalesNew";
import Purchases from "./pages/Purchases";
import PurchasesNew from "./pages/PurchasesNew";
import Expenses from "./pages/Expenses";
import Customers from "./pages/Customers";
import Suppliers from "./pages/Suppliers";
import Khata from "./pages/Khata";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Trash from "./pages/Trash";

function AppContent() {
  const { currentView } = useRouter();
  const { currentUser } = useAuth();

  // Render correct view based on state router
  const renderView = () => {
    switch (currentView) {
      case "login":
        return <Login />;
      case "register":
        return <Register />;
      case "forgot-password":
        return <ForgotPassword />;
      case "dashboard":
        return <Dashboard />;
      case "products":
        return <Products />;
      case "categories":
        return <Categories />;
      case "sales":
        return <Sales />;
      case "sales-new":
        return <SalesNew />;
      case "purchases":
        return <Purchases />;
      case "purchases-new":
        return <PurchasesNew />;
      case "expenses":
        return <Expenses />;
      case "customers":
        return <Customers />;
      case "suppliers":
        return <Suppliers />;
      case "khata":
        return <Khata />;
      case "reports":
        return <Reports />;
      case "settings":
        return <Settings />;
      case "trash":
        return <Trash />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      {currentUser && <Navbar />}
      
      <main className="flex-grow-1">
        {renderView()}
      </main>
      
      {currentUser && <BottomNav />}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider>
        <DataProvider>
          <AppContent />
        </DataProvider>
      </RouterProvider>
    </AuthProvider>
  );
}
