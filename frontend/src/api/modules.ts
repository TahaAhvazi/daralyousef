import { http } from "@/api/http";
import type {
  AuditLog, Customer, Company, DashboardSummary, Invoice, Lead, Material,
  NotificationItem, Opportunity, Order, Paginated, Payment, Product,
  ProductCategory, ProductMaterial, QuoteEstimate, Quotation, StockMovement, Ticket, TicketMessage,
  Conversation, ChatMessage, Attachment, User,
  WorkflowStaff, Warehouse, Department, WorkflowBoard,
} from "@/types/api";

const list = <T,>(url: string, params?: Record<string, any>) =>
  http.get<Paginated<T>>(url, { params }).then((r) => r.data);

// ── Users / Roles ────────────────────────────────────────────────────────────
export const usersApi = {
  list: (params?: { page?: number; page_size?: number; q?: string }) =>
    list<User>("/users", params),
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
  create: (data: Partial<Customer>) => http.post<Customer>("/customers", data).then((r) => r.data),
  update: (id: number, data: Partial<Customer>) => http.patch<Customer>(`/customers/${id}`, data).then((r) => r.data),
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
  workflowBoard: (params?: { department_id?: number; department_slug?: string }) =>
    http.get<WorkflowBoard>("/orders/workflow/board", { params }).then((r) => r.data),
  boardMove: (id: number, to_column: string, notes?: string) =>
    http.post<Order>(`/orders/${id}/board-move`, { to_column, notes }).then((r) => r.data),
  remove: (id: number) => http.delete(`/orders/${id}`).then((r) => r.data),
};

// ── Finance ──────────────────────────────────────────────────────────────────
export const financeApi = {
  quotations: (params?: { page?: number; page_size?: number; q?: string; status?: string }) =>
    list<Quotation>("/finance/quotations", params),
  createQuotation: (data: any) => http.post<Quotation>("/finance/quotations", data).then((r) => r.data),
  acceptQuotation: (id: number) => http.post<Quotation>(`/finance/quotations/${id}/accept`).then((r) => r.data),
  invoices: (params?: { page?: number; page_size?: number; q?: string; status?: string }) =>
    list<Invoice>("/finance/invoices", params),
  getInvoice: (id: number) => http.get<Invoice>(`/finance/invoices/${id}`).then((r) => r.data),
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
    });
    return res.data as Blob;
  },
  createInvoice: (data: any) => http.post<Invoice>("/finance/invoices", data).then((r) => r.data),
  invoiceFromQuotation: (qid: number) =>
    http.post<Invoice>(`/finance/invoices/from-quotation/${qid}`).then((r) => r.data),
  payments: (params?: { page?: number; page_size?: number; invoice_id?: number; customer_id?: number }) =>
    list<Payment>("/finance/payments", params),
  recordPayment: (data: any) => http.post<Payment>("/finance/payments", data).then((r) => r.data),
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
  list: (params?: { page?: number; page_size?: number; q?: string; status?: string }) =>
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
  create: (data: { kind?: string; title?: string; order_id?: number; member_ids?: number[] }) =>
    http.post<Conversation>("/conversations", data).then((r) => r.data),
  send: (id: number, data: { body: string; order_id?: number }) =>
    http.post<ChatMessage>(`/conversations/${id}/messages`, data).then((r) => r.data),
  staff: () =>
    http.get<{ id: number; full_name: string; email: string }[]>("/conversations/meta/staff").then((r) => r.data),
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
