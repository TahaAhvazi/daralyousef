import { http } from "@/api/http";
import type { BrandSettings } from "@/types/api";

export const brandApi = {
  get: () => http.get<BrandSettings>("/brand").then((r) => r.data),

  update: (data: Partial<Omit<BrandSettings, "logo_url">>) =>
    http.patch<BrandSettings>("/brand", data).then((r) => r.data),

  uploadLogo: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return http
      .post<BrandSettings>("/brand/logo", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },

  removeLogo: () => http.delete<BrandSettings>("/brand/logo").then((r) => r.data),
};
