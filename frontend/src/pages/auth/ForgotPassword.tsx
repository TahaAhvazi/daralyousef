import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";

import { authApi } from "@/api/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useT } from "@/i18n/useT";

export default function ForgotPasswordPage() {
  const { t } = useT();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res: any = await authApi.forgotPassword(email);
      setToken(res?.dev_reset_token ?? null);
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-dar-auth-panel">
      <h2 className="text-2xl font-semibold tracking-tight">{t.auth.forgotTitle}</h2>
      <p className="text-[13px] text-white/70 mt-1">{t.auth.forgotSubtitle}</p>

      {!done ? (
        <form onSubmit={submit} className="mt-6 grid gap-4">
          <Input
            label={t.auth.email} type="email" required
            iconLeft={<Mail className="size-4" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" loading={loading} full size="lg" className="landing-dar-auth-submit">
            {t.auth.sendReset}
          </Button>
        </form>
      ) : (
        <div className="mt-6 grid gap-4">
          <div className="rounded-lg bg-success/10 border border-success/30 text-success text-[13px] px-3 py-2">
            {t.auth.forgotSent}
          </div>
          {token ? (
            <div className="rounded-lg bg-warning/10 border border-warning/30 text-warning text-[12px] px-3 py-2 break-all">
              <span className="font-semibold">{t.auth.devTokenLabel}</span><br />
              {token}
            </div>
          ) : null}
          <Link to="/login" className="text-[#f5c518] text-[13px] hover:underline text-center">
            {t.auth.backToSignIn}
          </Link>
        </div>
      )}
    </div>
  );
}
