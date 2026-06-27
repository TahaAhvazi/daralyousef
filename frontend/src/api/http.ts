import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import toast from "react-hot-toast";

import { API_BASE } from "@/config/backend";
import { translateApiError } from "@/lib/apiErrors";
import { useAuthStore } from "@/store/auth";
import { useLocaleStore } from "@/store/locale";

let isRefreshing = false;
let waiters: Array<(t: string) => void> = [];

function onRefreshed(token: string) {
  waiters.forEach((cb) => cb(token));
  waiters = [];
}

export const http: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (r) => r,
  async (error: AxiosError<any>) => {
    const status = error.response?.status;
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (status === 401 && !original._retry && !original.url?.includes("/auth/")) {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (!refreshToken) {
        useAuthStore.getState().logout();
        if (!location.pathname.startsWith("/login")) location.href = "/login";
        return Promise.reject(error);
      }

      original._retry = true;
      if (isRefreshing) {
        return new Promise((resolve) => {
          waiters.push((token) => {
            original.headers!.Authorization = `Bearer ${token}`;
            resolve(http(original));
          });
        });
      }

      isRefreshing = true;
      try {
        const { data } = await axios.post(`${API_BASE}/auth/refresh`, {
          refresh_token: refreshToken,
        });
        useAuthStore.getState().setTokens(data.access_token, data.refresh_token);
        onRefreshed(data.access_token);
        original.headers!.Authorization = `Bearer ${data.access_token}`;
        return http(original);
      } catch (e) {
        useAuthStore.getState().logout();
        if (!location.pathname.startsWith("/login")) location.href = "/login";
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }

    const locale = useLocaleStore.getState().locale;
    const message = translateApiError(error, locale);
    if (status && status >= 400 && status !== 401) {
      toast.error(message);
    }
    const wrapped = new Error(message);
    (wrapped as Error & { cause?: unknown }).cause = error;
    return Promise.reject(wrapped);
  }
);
