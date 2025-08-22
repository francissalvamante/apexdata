// Helper function to check if backend is available
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(BACKEND_CONFIG.HEALTH_URL);
    return response.ok;
  } catch {
    return false;
  }
};

const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_BACKEND_HOST) {
    return process.env.NEXT_PUBLIC_BACKEND_HOST;
  }

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      return `http://${hostname}:3001`;
    }
  }

  return "http://localhost:3001";
};

const getWebSocketUrl = () => {
  const baseUrl = getBaseUrl();
  return baseUrl.replace("http", "ws") + "/telemetry";
};

// Configuration for backend communication
export const BACKEND_CONFIG = {
  // Backend HTTP API base URL
  API_BASE: getBaseUrl() + "/api",

  // Backend WebSocket URL
  WEBSOCKET_URL: getWebSocketUrl(),

  // Backend health check URL
  HEALTH_URL: getBaseUrl() + "/health",
} as const;
