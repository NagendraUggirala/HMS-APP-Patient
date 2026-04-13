import React, { createContext, useContext } from "react";
import Constants from "expo-constants";

const HospitalContext = createContext();

export const HospitalProvider = ({ children }) => {
  const extra = Constants.expoConfig?.extra || {};

  const config = {
    hospitalId: extra.HOSPITAL_ID || "apollo",
    hospitalName: extra.APP_NAME || "Apollo Hospitals",
    apiBaseUrl: extra.API_BASE_URL || "https://hospital-backend-9mg3.onrender.com",
    branding: {
      primaryColor: extra.PRIMARY_COLOR || "#1C3F60",
      secondaryColor: extra.SECONDARY_COLOR || "#FDBA21",
      logoPath: extra.LOGO_PATH || "apollo/logo.png",
    },
    features: {
      appointments: extra.FEATURE_APPOINTMENTS === "true",
      billing: extra.FEATURE_BILLING === "true",
    },
  };

  return (
    <HospitalContext.Provider value={config}>
      {children}
    </HospitalContext.Provider>
  );
};

export const useHospital = () => {
  const ctx = useContext(HospitalContext);
  if (!ctx) throw new Error("useHospital must be used inside <HospitalProvider>");
  return ctx;
};
