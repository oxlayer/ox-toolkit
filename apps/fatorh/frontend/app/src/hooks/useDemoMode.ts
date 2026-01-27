import { useLocation } from "react-router";
import { demoAgentData, demoHistoryData } from "./data";

/**
 * Hook to check if the app is in demo mode and provide demo data
 */
export const useDemoMode = () => {
  const location = useLocation();

  // Check if current path is the demo path
  const isDemoMode = location.pathname === "/demo";

  return {
    isDemoMode,
    demoAgentData,
    demoHistoryData,
  };
};
