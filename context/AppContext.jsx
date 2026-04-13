import { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from "../config/api";

const AppContext = createContext(null);

/**
 * AppProvider – wraps the app and exposes auth state.
 *
 * currentUser shape: { id, name, role, phone, ... }
 * Supported roles: hospital_admin | doctor | nurse | lab_tech | receptionist | pharmacist | patient
 *
 * For the Patient app all authenticated users are role="patient" and are
 * routed to "Dashboard". Extend the routeByRole map in SplashScreen if
 * more roles are needed.
 */
export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  // isInitializing: true → still checking stored session, false → ready
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('currentUser');
        if (storedUser) {
          setCurrentUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.error("Failed to load session from AsyncStorage:", e);
      } finally {
        setIsInitializing(false);
      }
    };

    loadSession();
  }, []);

  /**
   * Call this after OTP or Password verification succeeds.
   * Pass a user object; role defaults to "patient" if omitted.
   */
  const login = async (userData) => {
    const user = { role: "patient", ...userData };
    setCurrentUser(user);
    try {
      await AsyncStorage.setItem('currentUser', JSON.stringify(user));
    } catch (e) {
      console.error("Failed to save session to AsyncStorage:", e);
    }
  };

  const logout = async () => {
    // Optimistic Logout: Clear local state immediately for instant UI response
    const token = currentUser?.token;
    setCurrentUser(null);
    AsyncStorage.removeItem('currentUser').catch(e => console.error("AsyncStorage Error:", e));

    if (!token) {
      console.log("No token found for background logout, skipping API call.");
      return;
    }

    // Process API logout in the background
    try {
      console.log("Backgrounding Logout API call...");
      fetch(API_ENDPOINTS.LOGOUT, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }).then(res => {
        if (!res.ok) console.warn("Background logout API returned error:", res.status);
        else console.log("Background logout successful.");
      }).catch(err => console.error("Background logout fetch error:", err));
    } catch (err) {
      console.error("Logout API setup error:", err);
    }
  };

  return (
    <AppContext.Provider value={{ isInitializing, currentUser, login, logout }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used inside <AppProvider>");
  return ctx;
}
