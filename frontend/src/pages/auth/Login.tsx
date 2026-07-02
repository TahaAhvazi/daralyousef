import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { motion } from "framer-motion";

import { authApi } from "@/api/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuthStore } from "@/store/auth";
import { useT } from "@/i18n/useT";
import { getPostLoginPath } from "@/lib/roleHome";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useT();
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);
  const [email, setEmail] = useState("ceo@atelier.app");
  const [password, setPassword] = useState("Demo@1234");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const DEMO = [
    { label: t.auth.demo.ceo,               email: "ceo@atelier.app" },
    { label: t.auth.demo.generalManager,    email: "gm@atelier.app" },
    { label: t.auth.demo.departmentManager, email: "design.lead@atelier.app" },
    { label: t.auth.demo.designer,          email: "designer@atelier.app" },
    { label: t.auth.demo.printingOperator,  email: "printop@atelier.app" },
    { label: t.auth.demo.accountant,        email: "accountant@atelier.app" },
    { label: t.auth.demo.marketing,         email: "marketing@atelier.app" },
    { label: t.auth.demo.warehouse,         email: "warehouse@atelier.app" },
    { label: t.auth.demo.sales,             email: "sales@atelier.app" },
    { label: t.auth.demo.support,           email: "support@atelier.app" },
    { label: t.auth.demo.customer,          email: "customer@atelier.app" },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const tokens = await authApi.login(email, password);
      setTokens(tokens.access_token, tokens.refresh_token);
      const me = await authApi.me();
      setUser(me);
      const next = (location.state as any)?.from ?? getPostLoginPath(me);
      navigate(next, { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? t.auth.loginFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="landing-dar-auth-panel"
    >
      <h2 className="text-2xl font-semibold tracking-tight">{t.auth.welcome}</h2>
      <p className="text-[13px] text-white/70 mt-1">{t.auth.signInSubtitle}</p>

      <form onSubmit={handleLogin} className="mt-6 grid gap-4">
        <Input
          label={t.auth.email}
          type="email"
          required
          autoComplete="email"
          iconLeft={<Mail className="size-4" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label={t.auth.password}
          type={show ? "text" : "password"}
          required
          autoComplete="current-password"
          iconLeft={<Lock className="size-4" />}
          iconRight={
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="grid place-items-center hover:text-white"
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          }
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-[12.5px] text-white/70">
            <input type="checkbox" className="size-3.5 accent-[#f5c518]" /> {t.auth.remember}
          </label>
          <Link to="/forgot-password" className="text-[12.5px] text-[#f5c518] hover:underline">
            {t.auth.forgot}
          </Link>
        </div>

        {error ? (
          <div className="rounded-lg bg-danger/10 border border-danger/30 text-danger text-[13px] px-3 py-2">
            {error}
          </div>
        ) : null}

        <Button type="submit" loading={loading} full size="lg" className="landing-dar-auth-submit">
          {t.auth.signIn}
        </Button>

        <p className="text-[13px] text-white/70 text-center">
          {t.auth.newHere}{" "}
          <Link to="/register" className="text-[#f5c518] hover:underline">
            {t.auth.createAccount}
          </Link>
        </p>
      </form>

      <div className="mt-6 border-t border-white/15 pt-4">
        <div className="text-[11.5px] uppercase tracking-wider text-white/50 mb-2 text-center">
          {t.auth.tryDemo}
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          {DEMO.map((d) => (
            <button
              key={d.email}
              type="button"
              onClick={() => { setEmail(d.email); setPassword("Demo@1234"); }}
              className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[12px] text-white/85 hover:bg-white/15 transition-colors"
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
