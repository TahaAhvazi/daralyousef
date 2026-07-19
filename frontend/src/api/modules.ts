import { http } from "@/api/http";
import type {
  AuditLog, Customer, Company, DashboardSummary, Invoice, InvoiceActivityEvent, Lead, Material,
  NotificationItem, Opportunity, Order, Paginated, Payment, Product,
  ProductCategory, ProductMaterial, QuoteEstimate, Quotation, StockMovement, Ticket, TicketMessage,
  Conversation, ChatMessage, Attachment, User, OrderNote,
  WorkflowStaff, Warehouse, Department, WorkflowBoard, HrDashboardSummary, EmployeeHrProfile,
  Designation,
} from "@/types/api";

const list = <T,>(url: string, params?: Record<string, any>) =>
  http.get<Paginated<T>>(url, { params }).then((r) => r.data);

// ── Users / Roles ────────────────────────────────────────────────────────────
export const usersApi = {
  list: (params?: {
    page?: number;
    page_size?: number;
    q?: string;
    is_staff?: boolean;
    department_id?: number;
  }) => list<User>("/users", params),
  create: (data: any) => http.post<User>("/users", data).then((r) => r.data),
  update: (id: number, data: any) => http.patch<{ ok: boolean }>(`/users/${id}`, data).then((r) => r.data),
  remove: (id: number) => http.delete(`/users/${id}`).then((r) => r.data),
  roles: () => http.get<{ id: number; name: string; slug: string }[]>("/users/roles/all").then((r) => r.data),
};

// ── Customers / Companies ───────────────────────────────────────────────────
export const customersApi = {
  list: (params?: { page?: number; page_size?: number; q?: string }) =>
    list<Customer>("/customers", params),
  get: (id: number) => http.get<Customer>(`/customers/${id}`).then((r) => r.data),
  summary: (id: number) =>
    http.get<{
      customer_id: number;
      orders_count: number;
      invoices_count: number;
      quotations_count: number;
      tickets_count: number;
      payments_count: number;
      invoices_balance: number;
      invoices_paid: number;
      currency: string;
    }>(`/sales/customers/${id}/summary`).then((r) => r.data),
  create: (data: Partial<Customer> & { create_portal_access?: boolean; portal_password?: string }) =>
    http.post<Customer>("/customers", data).then((r) => r.data),
  update: (
    id: number,
    data: Partial<Customer> & { create_portal_access?: boolean; portal_password?: string },
  ) => http.patch<Customer>(`/customers/${id}`, data).then((r) => r.data),
  remove: (id: number) => http.delete(`/customers/${id}`).then((r) => r.data),
  listCompanies: (params?: { page?: number; page_size?: number; q?: string }) =>
    list<Company>("/customers/companies", params),
  createCompany: (data: Partial<Company>) =>
    http.post<Company>("/customers/companies", data).then((r) => r.data),
};

// ── CRM ──────────────────────────────────────────────────────────────────────
export const crmApi = {
  listLeads: (params?: { page?: number; page_size?: number; q?: string; stage?: string }) =>
    list<Lead>("/crm/leads", params),
  createLead: (data: Partial<Lead>) => http.post<Lead>("/crm/leads", data).then((r) => r.data),
  updateLead: (id: number, data: Partial<Lead>) => http.patch<Lead>(`/crm/leads/${id}`, data).then((r) => r.data),
  convertLead: (id: number) => http.post<Lead>(`/crm/leads/${id}/convert`).then((r) => r.data),
  listOpportunities: (params?: { page?: number; page_size?: number; q?: string }) =>
    list<Opportunity>("/crm/opportunities", params),
  createOpportunity: (data: Partial<Opportunity>) =>
    http.post<Opportunity>("/crm/opportunities", data).then((r) => r.data),
};

// ── Catalog ──────────────────────────────────────────────────────────────────
export const catalogApi = {
  categories: () => http.get<ProductCategory[]>("/catalog/categories").then((r) => r.data),
  products: (params?: { page?: number; page_size?: number; q?: string; category_id?: number; active_only?: boolean }) =>
    list<Product>("/catalog/products", params),
  product: (id: number) => http.get<Product>(`/catalog/products/${id}`).then((r) => r.data),
  createProduct: (data: Partial<Product>) => http.post<Product>("/catalog/products", data).then((r) => r.data),
  updateProduct: (id: number, data: Partial<Product>) => http.patch<Product>(`/catalog/products/${id}`, data).then((r) => r.data),
  removeProduct: (id: number) => http.delete(`/catalog/products/${id}`).then((r) => r.data),
  productMaterials: (id: number) =>
    http.get<ProductMaterial[]>(`/catalog/products/${id}/materials`).then((r) => r.data),
  setProductMaterials: (id: number, lines: { material_id: number; quantity_per_unit: number }[]) =>
    http.put<ProductMaterial[]>(`/catalog/products/${id}/materials`, { lines }).then((r) => r.data),
  quote: (data: { product_id: number; quantity: number; options: Record<string, string> }) =>
    http.post<QuoteEstimate>("/catalog/quote", data).then((r) => r.data),
};

// ── Departments ──────────────────────────────────────────────────────────────
export const departmentsApi = {
  list: () => http.get<Department[]>("/departments").then((r) => r.data),
};

// ── Orders ───────────────────────────────────────────────────────────────────
export const ordersApi = {
  list: (params?: { page?: number; page_size?: number; q?: string; status?: string; customer_id?: number }) =>
    list<Order>("/orders", params),
  get: (id: number) => http.get<Order>(`/orders/${id}`).then((r) => r.data),
  create: (data: Partial<Order> & { items: Partial<Order["items"][number]>[] }) =>
    http.post<Order>("/orders", data).then((r) => r.data),
  update: (id: number, data: Partial<Order>) => http.patch<Order>(`/orders/${id}`, data).then((r) => r.data),
  changeStatus: (id: number, to_status: string, notes?: string) =>
    http.post<Order>(`/orders/${id}/status`, { to_status, notes }).then((r) => r.data),
  changeItemWorkflow: (itemId: number, to_status: string, notes?: string) =>
    http.post<Order["items"][number]>(`/orders/items/${itemId}/workflow`, { to_status, notes }).then((r) => r.data),
  changeOrderWorkflow: (orderId: number, to_status: string, notes?: string) =>
    http.post<Order>(`/orders/${orderId}/workflow`, { to_status, notes }).then((r) => r.data),
  proposeOrder: (id: number, data: {
    deadline?: string;
    notes?: string;
    admin_message?: string;
    items: Partial<Order["items"][number]>[];
  }) => http.post<Order>(`/orders/${id}/propose`, data).then((r) => r.data),
  customerRespond: (id: number, approved: boolean, notes?: string) =>
    http.post<Order>(`/orders/${id}/customer-response`, { approved, notes }).then((r) => r.data),
  confirmReceipt: (id: number, notes?: string) =>
    http.post<Order>(`/orders/${id}/confirm-receipt`, { notes }).then((r) => r.data),
  setPayment: (id: number, paid: boolean, notes?: string) =>
    http.post<Order>(`/orders/${id}/payment`, { paid, notes }).then((r) => r.data),
  releaseOrder: (id: number, data?: { notes?: string; workflow_assignments?: { workflow_status: string; assignee_ids?: number[]; assignee_id?: number | null; is_skipped?: boolean }[] }) =>
    http.post<Order>(`/orders/${id}/release`, data ?? {}).then((r) => r.data),
  setWorkflowAssignments: (id: number, workflow_assignments: { workflow_status: string; assignee_ids?: number[]; assignee_id?: number | null; is_skipped?: boolean }[]) =>
    http.put<Order>(`/orders/${id}/workflow-assignments`, workflow_assignments).then((r) => r.data),
  workflowStaff: (workflow_status: string) =>
    http.get<WorkflowStaff[]>("/orders/workflow/staff", { params: { workflow_status } }).then((r) => r.data),
  workflowBoard: (params?: {
    department_id?: number;
    department_slug?: string;
    include_done?: boolean;
  }) => http.get<WorkflowBoard>("/orders/workflow/board", { params }).then((r) => r.data),
  boardMove: (id: number, to_column: string, notes?: string) =>
    http.post<Order>(`/orders/${id}/board-move`, { to_column, notes }).then((r) => r.data),
  stockCheck: (id: number, data: { approved: boolean; notes?: string }) =>
    http.post<Order>(`/orders/${id}/stock-check`, data).then((r) => r.data),
  remove: (id: number) => http.delete(`/orders/${id}`).then((r) => r.data),
  listNotes: (id: number) => http.get<OrderNote[]>(`/orders/${id}/notes`).then((r) => r.data),
  createNote: (id: number, body: string) =>
    http.post<OrderNote>(`/orders/${id}/notes`, { body }).then((r) => r.data),
  updateNote: (id: number, noteId: number, body: string) =>
    http.patch<OrderNote>(`/orders/${id}/notes/${noteId}`, { body }).then((r) => r.data),
  deleteNote: (id: number, noteId: number) =>
    http.delete(`/orders/${id}/notes/${noteId}`).then((r) => r.data),
};

// ── Finance ──────────────────────────────────────────────────────────────────
export const financeApi = {
  quotations: (params?: { page?: number; page_size?: number; q?: string; status?: string; customer_id?: number }) =>
    list<Quotation>("/finance/quotations", params),
  createQuotation: (data: any) => http.post<Quotation>("/finance/quotations", data).then((r) => r.data),
  acceptQuotation: (id: number) => http.post<Quotation>(`/finance/quotations/${id}/accept`).then((r) => r.data),
  invoices: (params?: {
    page?: number;
    page_size?: number;
    q?: string;
    status?: string;
    customer_id?: number;
    bucket?: string;
    sort?: string;
  }) => list<Invoice>("/finance/invoices", params),
  getInvoice: (id: number) => http.get<Invoice>(`/finance/invoices/${id}`).then((r) => r.data),
  invoiceActivity: (
    id: number,
    params?: { action?: string; from_date?: string; to_date?: string },
  ) =>
    http
      .get<{ items: InvoiceActivityEvent[] }>(`/finance/invoices/${id}/activity`, { params })
      .then((r) => r.data),
  issueInvoiceStock: (id: number, data?: { warehouse_name?: string; notes?: string }) =>
    http.post<Invoice>(`/finance/invoices/${id}/stock-issue`, data ?? {}).then((r) => r.data),
  voidInvoiceStock: (id: number) =>
    http.delete<Invoice>(`/finance/invoices/${id}/stock-issue`).then((r) => r.data),
  updateInvoice: (id: number, data: Partial<Pick<Invoice, "portal_visible" | "due_date" | "notes" | "pdf_lang">>) =>
    http.patch<Invoice>(`/finance/invoices/${id}`, data).then((r) => r.data),
  removeInvoice: (id: number) => http.delete(`/finance/invoices/${id}`).then((r) => r.data),
  invoiceFromOrder: (
    orderId: number,
    data: { lang: "en" | "ar"; portal_visible?: boolean; due_days?: number; notes?: string },
  ) => http.post<Invoice>(`/finance/invoices/from-order/${orderId}`, data).then((r) => r.data),
  orderInvoices: (orderId: number) =>
    http.get<{ items: Invoice[]; total: number }>(`/finance/orders/${orderId}/invoices`).then((r) => r.data),
  downloadInvoicePdf: async (id: number, lang: "en" | "ar") => {
    const res = await http.get(`/finance/invoices/${id}/pdf`, {
      params: { lang },
      responseType: "blob",
      timeout: 120000,
    });
    const data = res.data as Blob;
    // FastAPI errors come back as JSON blobs when responseType is blob
    if (data.type && data.type.includes("application/json")) {
      const text = await data.text();
      let msg = "PDF download failed";
      try {
        msg = JSON.parse(text)?.detail ?? msg;
      } catch {
        /* ignore */
      }
      throw new Error(typeof msg === "string" ? msg : "PDF download failed");
    }
    return data;
  },
  createInvoice: (data: any) => http.post<Invoice>("/finance/invoices", data).then((r) => r.data),
  invoiceFromQuotation: (qid: number) =>
    http.post<Invoice>(`/finance/invoices/from-quotation/${qid}`).then((r) => r.data),
  payments: (params?: {
    page?: number;
    page_size?: number;
    invoice_id?: number;
    customer_id?: number;
    q?: string;
  }) => list<Payment>("/finance/payments", params),
  recordPayment: (data: any) => http.post<Payment>("/finance/payments", data).then((r) => r.data),
  expenses: (params?: { page?: number; page_size?: number; q?: string }) =>
    list<any>("/finance/expenses", params),
  createExpense: (data: any) => http.post<any>("/finance/expenses", data).then((r) => r.data),
};

export const salesApi = {
  creditNotes: (params?: { page?: number; page_size?: number; customer_id?: number; q?: string }) =>
    list<any>("/sales/credit-notes", params),
  createCreditNote: (data: any) => http.post<any>("/sales/credit-notes", data).then((r) => r.data),
  removeCreditNote: (id: number) => http.delete(`/sales/credit-notes/${id}`).then((r) => r.data),
  returns: (params?: { page?: number; page_size?: number; customer_id?: number }) =>
    list<any>("/sales/returns", params),
  createReturn: (data: any) => http.post<any>("/sales/returns", data).then((r) => r.data),
  recurring: (params?: { page?: number; page_size?: number }) =>
    list<any>("/sales/recurring-invoices", params),
  createRecurring: (data: any) => http.post<any>("/sales/recurring-invoices", data).then((r) => r.data),
  runRecurring: (id: number) => http.post<any>(`/sales/recurring-invoices/${id}/run`).then((r) => r.data),
  installments: (params?: { page?: number; page_size?: number; customer_id?: number }) =>
    list<any>("/sales/installments", params),
  createInstallmentPlan: (data: any) => http.post<any>("/sales/installments", data).then((r) => r.data),
  payInstallment: (id: number) => http.post<any>(`/sales/installments/${id}/pay`).then((r) => r.data),
  posSessions: (params?: { page?: number; page_size?: number }) =>
    list<any>("/sales/pos/sessions", params),
  openPosSession: (data: { opening_float?: number; notes?: string }) =>
    http.post<any>("/sales/pos/sessions", data).then((r) => r.data),
  closePosSession: (id: number, data: { closing_cash: number; notes?: string }) =>
    http.post<any>(`/sales/pos/sessions/${id}/close`, data).then((r) => r.data),
  posCheckout: (data: any) => http.post<any>("/sales/pos/checkout", data).then((r) => r.data),
  vendors: (params?: { page?: number; page_size?: number; q?: string }) =>
    list<any>("/sales/vendors", params),
  createVendor: (data: any) => http.post<any>("/sales/vendors", data).then((r) => r.data),
  purchases: (params?: { page?: number; page_size?: number }) =>
    list<any>("/sales/purchases", params),
  createPurchase: (data: any) => http.post<any>("/sales/purchases", data).then((r) => r.data),
  receivePurchase: (id: number) => http.post<any>(`/sales/purchases/${id}/receive`).then((r) => r.data),
  salesSettings: () => http.get<any>("/sales/sales-settings").then((r) => r.data),
  updateSalesSettings: (data: any) => http.patch<any>("/sales/sales-settings", data).then((r) => r.data),
  templates: (params?: { page?: number; page_size?: number }) =>
    list<any>("/sales/templates", params),
  createTemplate: (data: any) => http.post<any>("/sales/templates", data).then((r) => r.data),
  salesReport: (params?: { days?: number; currency?: string }) =>
    http.get<any>("/sales/reports/sales", { params }).then((r) => r.data),
};

// ── Inventory ────────────────────────────────────────────────────────────────
export const inventoryApi = {
  warehouses: () => http.get<Warehouse[]>("/inventory/warehouses").then((r) => r.data),
  materials: (params?: { page?: number; page_size?: number; q?: string; low_stock?: boolean }) =>
    list<Material>("/inventory/materials", params),
  createMaterial: (data: Partial<Material>) =>
    http.post<Material>("/inventory/materials", data).then((r) => r.data),
  updateMaterial: (id: number, data: Partial<Material>) =>
    http.patch<Material>(`/inventory/materials/${id}`, data).then((r) => r.data),
  removeMaterial: (id: number) => http.delete(`/inventory/materials/${id}`).then((r) => r.data),
  movements: (params?: { page?: number; page_size?: number; material_id?: number; type?: string }) =>
    list<StockMovement>("/inventory/movements", params),
  createMovement: (data: Partial<StockMovement>) =>
    http.post<StockMovement>("/inventory/movements", data).then((r) => r.data),
};

// ── Tickets ──────────────────────────────────────────────────────────────────
export const ticketsApi = {
  list: (params?: { page?: number; page_size?: number; q?: string; status?: string; customer_id?: number }) =>
    list<Ticket>("/tickets", params),
  get: (id: number) => http.get<Ticket>(`/tickets/${id}`).then((r) => r.data),
  create: (data: Partial<Ticket>) => http.post<Ticket>("/tickets", data).then((r) => r.data),
  update: (id: number, data: Partial<Ticket>) => http.patch<Ticket>(`/tickets/${id}`, data).then((r) => r.data),
  reply: (id: number, body: string) =>
    http.post<TicketMessage>(`/tickets/${id}/messages`, { body }).then((r) => r.data),
  assignees: () =>
    http.get<{ id: number; full_name: string; email: string }[]>("/tickets/assignees").then((r) => r.data),
};

// ── Conversations (internal messaging) ───────────────────────────────────────
export const conversationsApi = {
  list: () => http.get<Conversation[]>("/conversations").then((r) => r.data),
  get: (id: number) => http.get<Conversation>(`/conversations/${id}`).then((r) => r.data),
  byOrder: (orderId: number) =>
    http.get<Conversation>(`/conversations/by-order/${orderId}`).then((r) => r.data),
  create: (data: { kind?: string; title?: string; order_id?: number; member_ids?: number[] }) =>
    http.post<Conversation>("/conversations", data).then((r) => r.data),
  send: (id: number, data: { body: string; order_id?: number }) =>
    http.post<ChatMessage>(`/conversations/${id}/messages`, data).then((r) => r.data),
  staff: () =>
    http
      .get<{ id: number; full_name: string; email: string; avatar_url?: string | null }[]>(
        "/conversations/meta/staff",
      )
      .then((r) => r.data),
  orders: () =>
    http.get<{ id: number; code: string; title?: string | null }[]>("/conversations/meta/orders").then((r) => r.data),
};

// ── Files ────────────────────────────────────────────────────────────────────
export const filesApi = {
  upload: (entity_type: string, entity_id: number, file: File, kind?: string, caption?: string) => {
    const form = new FormData();
    form.append("entity_type", entity_type);
    form.append("entity_id", String(entity_id));
    if (kind) form.append("kind", kind);
    if (caption) form.append("caption", caption);
    form.append("file", file);
    return http.post<Attachment>("/files", form, { headers: { "Content-Type": "multipart/form-data" } })
      .then((r) => r.data);
  },
  list: (entity_type: string, entity_id: number) =>
    http.get<Attachment[]>("/files", { params: { entity_type, entity_id } }).then((r) => r.data),
  remove: (id: number) => http.delete(`/files/${id}`).then((r) => r.data),
};

// ── Notifications ────────────────────────────────────────────────────────────
export const notificationsApi = {
  list: (params?: { page?: number; page_size?: number; unread_only?: boolean }) =>
    list<NotificationItem>("/notifications", params),
  unreadCount: () =>
    http.get<{ count: number }>("/notifications/unread-count").then((r) => r.data),
  markRead: (id: number) => http.post(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => http.post("/notifications/read-all").then((r) => r.data),
  pushVapidPublicKey: () =>
    http
      .get<{ public_key: string | null; configured: boolean }>("/notifications/push/vapid-public-key")
      .then((r) => r.data),
  pushStatus: () =>
    http
      .get<{ enabled: boolean; vapid_configured: boolean; subscription_count: number }>(
        "/notifications/push/status",
      )
      .then((r) => r.data),
  pushSubscribe: (data: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
    user_agent?: string;
  }) => http.post("/notifications/push/subscribe", data).then((r) => r.data),
  pushUnsubscribe: (endpoint: string) =>
    http.post("/notifications/push/unsubscribe", { endpoint }).then((r) => r.data),
  pushUnsubscribeAll: () => http.post("/notifications/push/unsubscribe-all").then((r) => r.data),
};

// ── Audit ────────────────────────────────────────────────────────────────────
export const auditApi = {
  list: (params?: { page?: number; page_size?: number; user_id?: number; module?: string; action?: string }) =>
    list<AuditLog>("/audit", params),
};

// ── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardApi = {
  summary: () => http.get<DashboardSummary>("/dashboard/summary").then((r) => r.data),
};

// ── HR ───────────────────────────────────────────────────────────────────────
export const hrApi = {
  summary: (params?: { currency?: string; days?: number }) =>
    http.get<HrDashboardSummary>("/hr/summary", { params }).then((r) => r.data),
  employee: (id: number, params?: { days?: number }) =>
    http.get<EmployeeHrProfile>(`/hr/employees/${id}`, { params }).then((r) => r.data),
  designations: (params?: { active_only?: boolean }) =>
    http.get<Designation[]>("/hr/designations", { params }).then((r) => r.data),
  attendanceMonth: (id: number, params: { year: number; month: number }) =>
    http.get<import("@/types/api").AttendanceMonth>(`/hr/employees/${id}/attendance`, { params }).then((r) => r.data),
  upsertAttendance: (id: number, body: {
    date: string;
    status: string;
    check_in?: string | null;
    check_out?: string | null;
    notes?: string | null;
    deduction_amount?: number | null;
  }) => http.put(`/hr/employees/${id}/attendance`, body).then((r) => r.data),
  bulkAttendance: (id: number, body: {
    start_date: string;
    end_date: string;
    status?: string;
    weekdays_only?: boolean;
  }) => http.post<import("@/types/api").AttendanceMonth>(`/hr/employees/${id}/attendance/bulk`, body).then((r) => r.data),
  adjustments: (id: number, params: { year: number; month: number }) =>
    http.get<import("@/types/api").PayrollAdjustment[]>(`/hr/employees/${id}/adjustments`, { params }).then((r) => r.data),
  createAdjustment: (id: number, body: {
    period_year: number;
    period_month: number;
    kind: string;
    amount: number;
    currency?: string;
    reason?: string;
  }) => http.post<import("@/types/api").PayrollAdjustment>(`/hr/employees/${id}/adjustments`, body).then((r) => r.data),
  deleteAdjustment: (id: number, adjustmentId: number) =>
    http.delete(`/hr/employees/${id}/adjustments/${adjustmentId}`).then((r) => r.data),
  payslipPreview: (id: number, params: { year: number; month: number }) =>
    http.get<import("@/types/api").PayslipDraftPreview>(`/hr/employees/${id}/payslips/preview`, { params }).then((r) => r.data),
  createPayslipDraft: (id: number, params: { year: number; month: number }) =>
    http.post(`/hr/employees/${id}/payslips/draft`, null, { params }).then((r) => r.data),
  confirmPayslip: (payslipId: number) =>
    http.post(`/hr/payslips/${payslipId}/confirm`).then((r) => r.data),
  createPayslip: (id: number, body: {
    period_start: string;
    period_end: string;
    base_salary?: number;
    overtime?: number;
    absence?: number;
    bonus?: number;
    currency?: string;
    notes?: string;
    status?: string;
    mark_paid?: boolean;
  }) => http.post(`/hr/employees/${id}/payslips`, body).then((r) => r.data),
  updatePayslip: (payslipId: number, body: Record<string, unknown>) =>
    http.patch(`/hr/payslips/${payslipId}`, body).then((r) => r.data),
  deletePayslip: (payslipId: number) =>
    http.delete(`/hr/payslips/${payslipId}`).then((r) => r.data),
  payrollReport: (params: { from: string; to: string; department_id?: number }) =>
    http.get<import("@/types/api").PayrollReport>("/hr/payroll/report", { params }).then((r) => r.data),
};

// ── Daftra integration ───────────────────────────────────────────────────────
export type DaftraModuleResult = {
  module: string;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
  pages_done?: number;
  total_pages?: number | null;
};

export type DaftraSyncReport = {
  ok: boolean;
  status?: string | null;
  current_module?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  message?: string | null;
  modules: DaftraModuleResult[];
};

export type DaftraStatus = {
  enabled: boolean;
  configured: boolean;
  base_url: string;
  last_sync?: DaftraSyncReport | Record<string, unknown> | null;
  mapped_counts: Record<string, number>;
  sync_running?: boolean;
};

export const daftraApi = {
  status: () => http.get<DaftraStatus>("/integrations/daftra/status").then((r) => r.data),
  test: () => http.post<{ ok: boolean; message: string; site?: Record<string, unknown> | null }>(
    "/integrations/daftra/test",
  ).then((r) => r.data),
  sync: (modules?: string[]) =>
    http
      .post<DaftraSyncReport>(
        "/integrations/daftra/sync",
        modules ? { modules } : {},
        { timeout: 60000 },
      )
      .then((r) => r.data),
};
