import { Navigate, useLocation } from "react-router-dom";

import { useAuthStore } from "@/store/auth";
import { canViewExecutiveDashboard } from "@/lib/permissions";
import { getStaffHomePath } from "@/lib/roleHome";
import DashboardPage from "@/pages/dashboard/Dashboard";
import type { User } from "@/types/api";

function check(user: User | null | undefined, perm: string | string[]): boolean {
  if (!user) return false;
  if (user.is_superuser) return true;
  const perms = user.permissions ?? [];
  if (perms.includes("*")) return true;
  const needed = Array.isArray(perm) ? perm : [perm];
  return needed.some((p) => perms.includes(p));
}

export function RequirePermission({
  perm,
  children,
}: {
  perm: string | string[];
  children: React.ReactNode;
}) {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (check(user, perm)) return <>{children}</>;

  return <Navigate to={getStaffHomePath(user)} replace />;
}

export function RoleBasedHome() {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (canViewExecutiveDashboard(user)) return <DashboardPage />;
  return <Navigate to={getStaffHomePath(user)} replace />;
}
