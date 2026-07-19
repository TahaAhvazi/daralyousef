import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { AppShell } from "@/layouts/AppShell";
import { AuthLayout } from "@/layouts/AuthLayout";
import { PortalLayout } from "@/layouts/PortalLayout";
import { RoleBasedHome, RequirePermission } from "@/components/auth/RequirePermission";
import { ScrollLock } from "@/components/layout/ScrollLock";
import { Skeleton } from "@/components/ui/Skeleton";

import { authApi } from "@/api/auth";
import { useAuthStore } from "@/store/auth";
import { applyThemeClass, useThemeStore } from "@/store/theme";
import { useBrand } from "@/hooks/useBrand";

const LoginPage = lazy(() => import("@/pages/auth/Login"));
const RegisterPage = lazy(() => import("@/pages/auth/Register"));
const ForgotPasswordPage = lazy(() => import("@/pages/auth/ForgotPassword"));
const WorkHomePage = lazy(() => import("@/pages/dashboard/WorkHomePage"));
const CustomersPage = lazy(() => import("@/pages/crm/CustomersPage"));
const LeadsPage = lazy(() => import("@/pages/crm/LeadsPage"));
const OrdersPage = lazy(() => import("@/pages/orders/OrdersPage"));
const OrderBoardPage = lazy(() => import("@/pages/orders/OrderBoardPage"));
const OrderDetailPage = lazy(() => import("@/pages/orders/OrderDetailPage"));
const NewOrderPage = lazy(() => import("@/pages/orders/NewOrderPage"));
const QuotationsPage = lazy(() => import("@/pages/finance/QuotationsPage"));
const InvoicesPage = lazy(() => import("@/pages/finance/InvoicesPage"));
const InvoiceDetailPage = lazy(() => import("@/pages/finance/InvoiceDetailPage"));
const MaterialsPage = lazy(() => import("@/pages/inventory/MaterialsPage"));
const TicketsPage = lazy(() => import("@/pages/support/TicketsPage"));
const TicketDetailPage = lazy(() => import("@/pages/support/TicketDetailPage"));
const ProductsPage = lazy(() => import("@/pages/catalog/ProductsPage"));
const AuditLogPage = lazy(() => import("@/pages/audit/AuditLogPage"));
const SettingsPage = lazy(() => import("@/pages/settings/SettingsPage"));
const UsersPage = lazy(() => import("@/pages/settings/UsersPage"));
const PortalHome = lazy(() => import("@/pages/portal/PortalHome"));
const PortalOrderDetailPage = lazy(() => import("@/pages/portal/PortalOrderDetailPage"));
const PortalOrders = lazy(() => import("@/pages/portal/PortalOrders"));
const PortalProfilePage = lazy(() => import("@/pages/portal/PortalProfilePage"));
const MessagesPage = lazy(() => import("@/pages/messages/MessagesPage"));
const NotificationsPage = lazy(() => import("@/pages/notifications/NotificationsPage"));
const LandingPage = lazy(() => import("@/pages/landing/LandingPage"));
const HrPage = lazy(() => import("@/pages/hr/HrPage"));
const EmployeeDetailPage = lazy(() => import("@/pages/hr/EmployeeDetailPage"));
const PayrollReportPage = lazy(() => import("@/pages/hr/PayrollReportPage"));
const CustomerDetailPage = lazy(() => import("@/pages/crm/CustomerDetailPage"));
const CreditNotesPage = lazy(() => import("@/pages/finance/CreditNotesPage"));
const SalesReturnsPage = lazy(() => import("@/pages/finance/SalesReturnsPage"));
const RecurringInvoicesPage = lazy(() => import("@/pages/finance/RecurringInvoicesPage"));
const PaymentsPage = lazy(() => import("@/pages/finance/PaymentsPage"));
const NewInvoicePage = lazy(() => import("@/pages/finance/NewInvoicePage"));
const InstallmentsPage = lazy(() => import("@/pages/finance/InstallmentsPage"));
const PosPage = lazy(() => import("@/pages/finance/PosPage"));
const PosSessionsPage = lazy(() => import("@/pages/finance/PosSessionsPage"));
const ExpensesPage = lazy(() => import("@/pages/finance/ExpensesPage"));
const SalesSettingsPage = lazy(() => import("@/pages/finance/SalesSettingsPage"));
const TemplatesPage = lazy(() => import("@/pages/finance/TemplatesPage"));
const SalesReportsPage = lazy(() => import("@/pages/finance/SalesReportsPage"));
const VendorsPage = lazy(() => import("@/pages/inventory/VendorsPage"));
const PurchasesPage = lazy(() => import("@/pages/inventory/PurchasesPage"));
const ServiceCategoryPage = lazy(() => import("@/pages/landing/ServiceCategoryPage"));

function RouteFallback() {
  return (
    <div className="page-shell space-y-4 p-4 sm:p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card p-5 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}

function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>;
}

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
            boxShadow: "0 4px 14px rgb(var(--text) / .08)",
          },
        }}
      />
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LazyPage><LoginPage /></LazyPage>} />
          <Route path="/register" element={<LazyPage><RegisterPage /></LazyPage>} />
          <Route path="/forgot-password" element={<LazyPage><ForgotPasswordPage /></LazyPage>} />
        </Route>

        <Route
          path="/app"
          element={
            <RequireAuth staffOnly>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route index element={<LazyPage><RoleBasedHome /></LazyPage>} />
          <Route path="work" element={<LazyPage><WorkHomePage /></LazyPage>} />
          <Route path="hr" element={<LazyPage><RequirePermission perm={["hr:read", "users:read", "dashboard:read"]}><HrPage /></RequirePermission></LazyPage>} />
          <Route path="hr/payroll-report" element={<LazyPage><RequirePermission perm={["hr:read", "users:read", "dashboard:read"]}><PayrollReportPage /></RequirePermission></LazyPage>} />
          <Route path="hr/employees/:id" element={<LazyPage><RequirePermission perm={["hr:read", "users:read", "dashboard:read"]}><EmployeeDetailPage /></RequirePermission></LazyPage>} />
          <Route path="customers" element={<LazyPage><RequirePermission perm="crm:read"><CustomersPage /></RequirePermission></LazyPage>} />
          <Route path="customers/:id" element={<LazyPage><RequirePermission perm="crm:read"><CustomerDetailPage /></RequirePermission></LazyPage>} />
          <Route path="leads" element={<LazyPage><RequirePermission perm="crm:read"><LeadsPage /></RequirePermission></LazyPage>} />
          <Route path="orders" element={<LazyPage><RequirePermission perm={["orders:read", "orders:admin"]}><OrdersPage /></RequirePermission></LazyPage>} />
          <Route path="orders/board" element={<LazyPage><RequirePermission perm={["production:read", "production:update"]}><OrderBoardPage /></RequirePermission></LazyPage>} />
          <Route path="orders/new" element={<LazyPage><RequirePermission perm="orders:create"><NewOrderPage /></RequirePermission></LazyPage>} />
          <Route path="orders/:id" element={<LazyPage><RequirePermission perm={["orders:admin", "orders:read", "orders:update", "orders:create", "production:read", "production:update"]}><OrderDetailPage /></RequirePermission></LazyPage>} />
          <Route path="quotations" element={<LazyPage><RequirePermission perm="finance:read"><QuotationsPage /></RequirePermission></LazyPage>} />
          <Route path="invoices" element={<LazyPage><RequirePermission perm="finance:read"><InvoicesPage /></RequirePermission></LazyPage>} />
          <Route path="invoices/new" element={<LazyPage><RequirePermission perm="finance:create"><NewInvoicePage /></RequirePermission></LazyPage>} />
          <Route path="invoices/:id" element={<LazyPage><RequirePermission perm="finance:read"><InvoiceDetailPage /></RequirePermission></LazyPage>} />
          <Route path="credit-notes" element={<LazyPage><RequirePermission perm="finance:read"><CreditNotesPage /></RequirePermission></LazyPage>} />
          <Route path="returns" element={<LazyPage><RequirePermission perm="finance:read"><SalesReturnsPage /></RequirePermission></LazyPage>} />
          <Route path="recurring-invoices" element={<LazyPage><RequirePermission perm="finance:read"><RecurringInvoicesPage /></RequirePermission></LazyPage>} />
          <Route path="payments" element={<LazyPage><RequirePermission perm="finance:read"><PaymentsPage /></RequirePermission></LazyPage>} />
          <Route path="installments" element={<LazyPage><RequirePermission perm="finance:read"><InstallmentsPage /></RequirePermission></LazyPage>} />
          <Route path="pos" element={<LazyPage><RequirePermission perm={["finance:create", "finance:read"]}><PosPage /></RequirePermission></LazyPage>} />
          <Route path="pos/sessions" element={<LazyPage><RequirePermission perm={["finance:create", "finance:read"]}><PosSessionsPage /></RequirePermission></LazyPage>} />
          <Route path="expenses" element={<LazyPage><RequirePermission perm="finance:read"><ExpensesPage /></RequirePermission></LazyPage>} />
          <Route path="sales-settings" element={<LazyPage><RequirePermission perm="finance:update"><SalesSettingsPage /></RequirePermission></LazyPage>} />
          <Route path="templates" element={<LazyPage><RequirePermission perm="finance:read"><TemplatesPage /></RequirePermission></LazyPage>} />
          <Route path="reports/sales" element={<LazyPage><RequirePermission perm={["finance:read", "dashboard:read"]}><SalesReportsPage /></RequirePermission></LazyPage>} />
          <Route path="vendors" element={<LazyPage><RequirePermission perm="inventory:read"><VendorsPage /></RequirePermission></LazyPage>} />
          <Route path="purchases" element={<LazyPage><RequirePermission perm="inventory:read"><PurchasesPage /></RequirePermission></LazyPage>} />
          <Route path="materials" element={<LazyPage><RequirePermission perm="inventory:read"><MaterialsPage /></RequirePermission></LazyPage>} />
          <Route path="tickets" element={<LazyPage><RequirePermission perm={["support:read", "support:reply"]}><TicketsPage /></RequirePermission></LazyPage>} />
          <Route path="tickets/:id" element={<LazyPage><RequirePermission perm={["support:read", "support:reply"]}><TicketDetailPage /></RequirePermission></LazyPage>} />
          <Route path="messages" element={<LazyPage><RequirePermission perm={["messages:read", "messages:send"]}><MessagesPage /></RequirePermission></LazyPage>} />
          <Route path="notifications" element={<LazyPage><NotificationsPage /></LazyPage>} />
          <Route path="products" element={<LazyPage><RequirePermission perm="catalog:manage"><ProductsPage /></RequirePermission></LazyPage>} />
          <Route path="audit" element={<LazyPage><RequirePermission perm="audit:read"><AuditLogPage /></RequirePermission></LazyPage>} />
          <Route path="users" element={<LazyPage><RequirePermission perm="users:read"><UsersPage /></RequirePermission></LazyPage>} />
          <Route path="settings" element={<LazyPage><SettingsPage /></LazyPage>} />
        </Route>

        <Route
          path="/portal"
          element={
            <PortalGuard>
              <PortalLayout />
            </PortalGuard>
          }
        >
          <Route index element={<LazyPage><PortalHome /></LazyPage>} />
          <Route path="orders" element={<LazyPage><PortalOrders /></LazyPage>} />
          <Route path="orders/new" element={<LazyPage><NewOrderPage /></LazyPage>} />
          <Route path="orders/:id" element={<LazyPage><PortalOrderDetailPage /></LazyPage>} />
          <Route path="invoices" element={<LazyPage><InvoicesPage /></LazyPage>} />
          <Route path="invoices/:id" element={<LazyPage><InvoiceDetailPage /></LazyPage>} />
          <Route path="quotations" element={<LazyPage><QuotationsPage /></LazyPage>} />
          <Route path="tickets" element={<LazyPage><TicketsPage /></LazyPage>} />
          <Route path="tickets/:id" element={<LazyPage><TicketDetailPage /></LazyPage>} />
          <Route path="profile" element={<LazyPage><PortalProfilePage /></LazyPage>} />
        </Route>

        <Route path="/" element={<LazyPage><LandingPage /></LazyPage>} />
        <Route path="/services/:slug" element={<LazyPage><ServiceCategoryPage /></LazyPage>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
