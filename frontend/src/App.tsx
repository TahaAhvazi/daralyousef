import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";

import { AppShell } from "@/layouts/AppShell";
import { AuthLayout } from "@/layouts/AuthLayout";
import { PortalLayout } from "@/layouts/PortalLayout";

import ForgotPasswordPage from "@/pages/auth/ForgotPassword";
import LoginPage from "@/pages/auth/Login";
import RegisterPage from "@/pages/auth/Register";

import { RoleBasedHome, RequirePermission } from "@/components/auth/RequirePermission";
import WorkHomePage from "@/pages/dashboard/WorkHomePage";
import CustomersPage from "@/pages/crm/CustomersPage";
import LeadsPage from "@/pages/crm/LeadsPage";
import OrdersPage from "@/pages/orders/OrdersPage";
import OrderBoardPage from "@/pages/orders/OrderBoardPage";
import OrderDetailPage from "@/pages/orders/OrderDetailPage";
import NewOrderPage from "@/pages/orders/NewOrderPage";
import QuotationsPage from "@/pages/finance/QuotationsPage";
import InvoicesPage from "@/pages/finance/InvoicesPage";
import InvoiceDetailPage from "@/pages/finance/InvoiceDetailPage";
import MaterialsPage from "@/pages/inventory/MaterialsPage";
import TicketsPage from "@/pages/support/TicketsPage";
import ProductsPage from "@/pages/catalog/ProductsPage";
import AuditLogPage from "@/pages/audit/AuditLogPage";
import SettingsPage from "@/pages/settings/SettingsPage";
import UsersPage from "@/pages/settings/UsersPage";

import PortalHome from "@/pages/portal/PortalHome";
import PortalOrderDetailPage from "@/pages/portal/PortalOrderDetailPage";
import PortalOrders from "@/pages/portal/PortalOrders";
import TicketDetailPage from "@/pages/support/TicketDetailPage";
import MessagesPage from "@/pages/messages/MessagesPage";
import NotificationsPage from "@/pages/notifications/NotificationsPage";

import LandingPage from "@/pages/landing/LandingPage";
import ServiceCategoryPage from "@/pages/landing/ServiceCategoryPage";

import { ScrollLock } from "@/components/layout/ScrollLock";

import { authApi } from "@/api/auth";
import { useAuthStore } from "@/store/auth";
import { applyThemeClass, useThemeStore } from "@/store/theme";
import { useBrand } from "@/hooks/useBrand";

function RequireAuth({
  children,
  staffOnly,
}: {
  children: React.ReactNode;
  staffOnly?: boolean;
}) {
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  if (!token) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if (staffOnly && user && !user.is_staff && !user.is_superuser) {
    return <Navigate to="/portal" replace />;
  }
  return <>{children}</>;
}

function PortalGuard({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.accessToken);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/**
 * Side-effect: keep the browser tab title and favicon in sync with the
 * admin-managed brand. Falls back to i18n defaults when the API is unreachable.
 */
function BrandHead() {
  const { name, logoUrl } = useBrand();

  useEffect(() => {
    if (name) document.title = name;
  }, [name]);

  useEffect(() => {
    if (!logoUrl) return;
    const head = document.head;

    const setLink = (rel: string, type?: string) => {
      let el = head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
      if (!el) {
        el = document.createElement("link");
        el.rel = rel;
        head.appendChild(el);
      }
      if (type) el.type = type;
      el.href = logoUrl;
    };

    setLink("icon");
    setLink("shortcut icon");
    setLink("apple-touch-icon");
  }, [logoUrl]);

  return null;
}

export default function App() {
  const setUser = useAuthStore((s) => s.setUser);
  const token = useAuthStore((s) => s.accessToken);
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => { applyThemeClass(theme); }, [theme]);

  // Hydrate user info on load if token exists
  useEffect(() => {
    if (!token) return;
    authApi.me().then(setUser).catch(() => {});
  }, [token, setUser]);

  return (
    <>
      <ScrollLock />
      <BrandHead />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "rgb(var(--surface))",
            color: "rgb(var(--text))",
            border: "1px solid rgb(var(--border))",
            fontSize: "13.5px",
            borderRadius: "12px",
          },
        }}
      />
      <Routes>
        {/* Auth */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>

        {/* Staff app */}
        <Route
          path="/app"
          element={
            <RequireAuth staffOnly>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route index element={<RoleBasedHome />} />
          <Route path="work" element={<WorkHomePage />} />
          <Route path="customers" element={<RequirePermission perm="crm:read"><CustomersPage /></RequirePermission>} />
          <Route path="leads" element={<RequirePermission perm="crm:read"><LeadsPage /></RequirePermission>} />
          <Route path="orders" element={<RequirePermission perm={["orders:read", "orders:admin"]}><OrdersPage /></RequirePermission>} />
          <Route path="orders/board" element={<RequirePermission perm={["production:read", "production:update"]}><OrderBoardPage /></RequirePermission>} />
          <Route path="orders/new" element={<RequirePermission perm="orders:create"><NewOrderPage /></RequirePermission>} />
          <Route path="orders/:id" element={<RequirePermission perm="orders:admin"><OrderDetailPage /></RequirePermission>} />
          <Route path="quotations" element={<RequirePermission perm="finance:read"><QuotationsPage /></RequirePermission>} />
          <Route path="invoices" element={<RequirePermission perm="finance:read"><InvoicesPage /></RequirePermission>} />
          <Route path="invoices/:id" element={<RequirePermission perm="finance:read"><InvoiceDetailPage /></RequirePermission>} />
          <Route path="materials" element={<RequirePermission perm="inventory:read"><MaterialsPage /></RequirePermission>} />
          <Route path="tickets" element={<RequirePermission perm={["support:read", "support:reply"]}><TicketsPage /></RequirePermission>} />
          <Route path="tickets/:id" element={<RequirePermission perm={["support:read", "support:reply"]}><TicketDetailPage /></RequirePermission>} />
          <Route path="messages" element={<RequirePermission perm={["messages:read", "messages:send"]}><MessagesPage /></RequirePermission>} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="products" element={<RequirePermission perm="catalog:manage"><ProductsPage /></RequirePermission>} />
          <Route path="audit" element={<RequirePermission perm="audit:read"><AuditLogPage /></RequirePermission>} />
          <Route path="users" element={<RequirePermission perm="users:read"><UsersPage /></RequirePermission>} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Customer portal */}
        <Route
          path="/portal"
          element={
            <PortalGuard>
              <PortalLayout />
            </PortalGuard>
          }
        >
          <Route index element={<PortalHome />} />
          <Route path="orders" element={<PortalOrders />} />
          <Route path="orders/new" element={<NewOrderPage />} />
          <Route path="orders/:id" element={<PortalOrderDetailPage />} />
          <Route path="invoices" element={<InvoicesPage />} />
          <Route path="invoices/:id" element={<InvoiceDetailPage />} />
          <Route path="quotations" element={<QuotationsPage />} />
          <Route path="tickets" element={<TicketsPage />} />
          <Route path="tickets/:id" element={<TicketDetailPage />} />
        </Route>

        <Route path="/" element={<LandingPage />} />
        <Route path="/services/:slug" element={<ServiceCategoryPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
