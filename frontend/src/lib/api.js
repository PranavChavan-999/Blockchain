import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const data = error.response?.data;
    const err = new Error(
      data?.error || error.message || "Request failed"
    );
    err.status = error.response?.status;
    err.body = data;
    err.code = data?.code;
    return Promise.reject(err);
  }
);

export async function apiGet(path, config) {
  const { data } = await api.get(path, config);
  return data;
}

export async function apiPost(path, body, config) {
  const { data } = await api.post(path, body, config);
  return data;
}
