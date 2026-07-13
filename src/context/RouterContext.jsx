import React, { createContext, useState, useEffect, useContext } from "react";
import { useAuth } from "./AuthContext";

const RouterContext = createContext();

export function useRouter() {
  return useContext(RouterContext);
}

export function RouterProvider({ children }) {
  const { currentUser } = useAuth();
  const [currentView, setCurrentView] = useState("dashboard");
  const [routeParams, setRouteParams] = useState({});

  // Parse hash and update state
  const parseHash = () => {
    const hash = window.location.hash || "#/";
    const pathPart = hash.split("?")[0].replace("#", "") || "/";
    
    // Parse query parameters
    const params = {};
    const queryIdx = hash.indexOf("?");
    if (queryIdx >= 0) {
      const queryString = hash.substring(queryIdx + 1);
      const urlParams = new URLSearchParams(queryString);
      for (const [key, value] of urlParams.entries()) {
        params[key] = value;
      }
    }
    
    setRouteParams(params);

    // Map path to view
    let view = "dashboard";
    if (pathPart === "/") view = "dashboard";
    else if (pathPart.startsWith("/login")) view = "login";
    else if (pathPart.startsWith("/register")) view = "register";
    else if (pathPart.startsWith("/forgot-password")) view = "forgot-password";
    else if (pathPart.startsWith("/products")) view = "products";
    else if (pathPart.startsWith("/categories")) view = "categories";
    else if (pathPart.startsWith("/sales/new")) view = "sales-new";
    else if (pathPart.startsWith("/sales")) view = "sales";
    else if (pathPart.startsWith("/purchases/new")) view = "purchases-new";
    else if (pathPart.startsWith("/purchases")) view = "purchases";
    else if (pathPart.startsWith("/expenses")) view = "expenses";
    else if (pathPart.startsWith("/customers")) view = "customers";
    else if (pathPart.startsWith("/suppliers")) view = "suppliers";
    else if (pathPart.startsWith("/khata")) view = "khata";
    else if (pathPart.startsWith("/reports")) view = "reports";
    else if (pathPart.startsWith("/settings")) view = "settings";
    else if (pathPart.startsWith("/trash")) view = "trash";
    
    setCurrentView(view);
  };

  useEffect(() => {
    parseHash();
    window.addEventListener("hashchange", parseHash);
    return () => window.removeEventListener("hashchange", parseHash);
  }, []);

  // Programmatic navigation helper
  const navigateTo = (path, params = null) => {
    let hashPath = `#${path}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        searchParams.append(key, params[key]);
      });
      hashPath += `?${searchParams.toString()}`;
    }
    window.location.hash = hashPath;
  };

  // Protect Routes logic
  useEffect(() => {
    const authRoutes = ["login", "register", "forgot-password"];
    const hash = window.location.hash || "#/";
    const pathPart = hash.split("?")[0].replace("#", "") || "/";
    
    const isAuthRoute = authRoutes.some(route => pathPart.startsWith("/" + route));
    
    if (!currentUser && !isAuthRoute) {
      // Redirect to login if not authenticated and not on an auth route
      navigateTo("/login");
    } else if (currentUser && isAuthRoute) {
      // Redirect to dashboard if logged in and trying to access login/register
      navigateTo("/");
    }
  }, [currentUser]);

  const value = {
    currentView,
    routeParams,
    navigateTo
  };

  return (
    <RouterContext.Provider value={value}>
      {children}
    </RouterContext.Provider>
  );
}
