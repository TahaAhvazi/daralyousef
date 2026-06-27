import { http } from "@/api/http";
import type { TokenResponse, User } from "@/types/api";

export const authApi = {
  login: (email: string, password: string) =>
    http.post<TokenResponse>("/auth/login", { email, password }).then((r) => r.data),

  register: (payload: { email: string; password: string; full_name: string; phone?: string; company_name?: string }) =>
    http.post<TokenResponse>("/auth/register", payload).then((r) => r.data),

  refresh: (refresh_token: string) =>
    http.post<TokenResponse>("/auth/refresh", { refresh_token }).then((r) => r.data),

  logout: (refresh_token: string) =>
    http.post("/auth/logout", { refresh_token }).then((r) => r.data),

  forgotPassword: (email: string) =>
    http.post("/auth/forgot-password", { email }).then((r) => r.data),

  resetPassword: (token: string, new_password: string) =>
    http.post("/auth/reset-password", { token, new_password }).then((r) => r.data),

  me: () => http.get<User>("/auth/me").then((r) => r.data),

  updateProfile: (data: Partial<{ full_name: string; phone: string; theme: string; locale: string; avatar_url: string }>) =>
    http.patch<User>("/auth/me", data).then((r) => r.data),
};
