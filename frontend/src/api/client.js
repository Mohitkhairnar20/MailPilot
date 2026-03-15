import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
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
