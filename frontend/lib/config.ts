// Configuration for backend communication
export const BACKEND_CONFIG = {
  // Backend HTTP API base URL
  API_BASE: "http://localhost:3001/api",
  
  // Backend WebSocket URL
  WEBSOCKET_URL: "ws://localhost:3001/telemetry",
  
  // Backend health check URL
  HEALTH_URL: "http://localhost:3001/health",
} as const;

// Helper function to check if backend is available
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(BACKEND_CONFIG.HEALTH_URL);
    return response.ok;
  } catch {
    return false;
  }
};