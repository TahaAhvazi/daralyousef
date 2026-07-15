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

  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return http
      .post<User>("/auth/me/avatar", form, { headers: { "Content-Type": "multipart/form-data" } })
      .then((r) => r.data);
  },

  removeAvatar: () => http.delete<User>("/auth/me/avatar").then((r) => r.data),

  publicProfile: (uid: number) => http.get<User>(`/auth/users/${uid}/profile`).then((r) => r.data),
};
