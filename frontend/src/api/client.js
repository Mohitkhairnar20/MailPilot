import axios from "axios";

const normalizeApiBaseUrl = (value) => {
  const fallbackUrl = "http://localhost:5000/api";

  if (!value) {
    return fallbackUrl;
  }

  const trimmedValue = value.trim().replace(/\/+$/, "");

  if (!trimmedValue) {
    return fallbackUrl;
  }

  return trimmedValue.endsWith("/api") ? trimmedValue : `${trimmedValue}/api`;
};

const apiClient = axios.create({
  baseURL: normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL)
});

export const tokenStorageKey = "mailpilot_token";
export const userStorageKey = "mailpilot_user";

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(tokenStorageKey);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(tokenStorageKey);
      localStorage.removeItem(userStorageKey);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
