import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, Lock, Mail, User } from "lucide-react";

import { authApi } from "@/api/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuthStore } from "@/store/auth";
import { useT } from "@/i18n/useT";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { t } = useT();
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);
  const [form, setForm] = useState({
    full_name: "", email: "", password: "", phone: "", company_name: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const tokens = await authApi.register(form);
      setTokens(tokens.access_token, tokens.refresh_token);
      const me = await authApi.me();
      setUser(me);
      navigate("/portal");
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? t.auth.registerFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass rounded-2xl p-7">
      <h2 className="text-2xl font-semibold tracking-tight">{t.auth.registerTitle}</h2>
      <p className="text-[13px] text-text-2 mt-1">{t.auth.registerSubtitle}</p>

      <form onSubmit={submit} className="mt-6 grid gap-4">
        <Input
          label={t.auth.fullName} required
          iconLeft={<User className="size-4" />}
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
        />
        <Input
          label={t.auth.email} type="email" required
          iconLeft={<Mail className="size-4" />}
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <Input
          label={t.auth.password} type="password" required hint={t.auth.passwordHint}
          iconLeft={<Lock className="size-4" />}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <Input
          label={`${t.auth.company} (${t.auth.optional})`}
          iconLeft={<Building2 className="size-4" />}
          value={form.company_name}
          onChange={(e) => setForm({ ...form, company_name: e.target.value })}
        />
        <Input
          label={`${t.auth.phone} (${t.auth.optional})`}
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />

        {error ? (
          <div className="rounded-lg bg-danger/10 border border-danger/30 text-danger text-[13px] px-3 py-2">
            {error}
          </div>
        ) : null}

        <Button type="submit" loading={loading} full size="lg">
          {t.auth.createBtn}
        </Button>

        <p className="text-[13px] text-text-2 text-center">
          {t.auth.haveAccount}{" "}
          <Link to="/login" className="text-brand hover:underline">{t.auth.signIn}</Link>
        </p>
      </form>
    </div>
  );
}
