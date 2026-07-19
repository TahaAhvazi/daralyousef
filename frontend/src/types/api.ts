// Shared API types (mirror backend Pydantic schemas).

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface Role {
  id: number;
  name: string;
  slug: string;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone?: string | null;
  avatar_url?: string | null;
  department?: string | null;
  department_id?: number | null;
  title?: string | null;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  theme: string;
  locale: string;
  last_login_at?: string | null;
  daftra_id?: string | null;
  roles: Role[];
  permissions: string[];
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface Customer {
  id: number;
  code: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  title?: string | null;
  company_id?: number | null;
  user_id?: number | null;
  tags?: string | null;
  notes?: string | null;
}

export interface Company {
  id: number;
  name: string;
  industry?: string | null;
  website?: string | null;
  tax_id?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  notes?: string | null;
  logo_url?: string | null;
}

export interface Lead {
  id: number;
  full_name: string;
  company_name?: string | null;
  email?: string | null;
  phone?: string | null;
  source?: string | null;
  stage: string;
  score: number;
  estimated_value: number;
  notes?: string | null;
  owner_id?: number | null;
  converted_customer_id?: number | null;
}

export interface Opportunity {
  id: number;
  title: string;
  customer_id?: number | null;
  lead_id?: number | null;
  expected_value: number;
  probability: number;
  stage: string;
  close_date?: string | null;
  owner_id?: number | null;
  notes?: string | null;
}

export interface Department {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface ProductCategory {
  id: number;
  name: string;
  name_ar?: string | null;
  slug: string;
  icon?: string | null;
  sort_order: number;
  description?: string | null;
}

export interface PricingRule {
  id: number;
  attribute: string;
  value: string;
  multiplier: number;
  addend: number;
}

export interface ProductMaterial {
  id: number;
  product_id: number;
  material_id: number;
  quantity_per_unit: number;
  material?: {
    id: number;
    sku: string;
    name: string;
    unit: string;
    on_hand: number;
    cost: number;
    reorder_level: number;
  } | null;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  name_ar?: string | null;
  slug: string;
  category_id?: number | null;
  unit: string;
  base_price: number;
  cost: number;
  tax_rate: number;
  image_url?: string | null;
  description?: string | null;
  description_ar?: string | null;
  options?: Record<string, any> | null;
  is_active: boolean;
  is_customizable: boolean;
  pricing_model: string;
  pricing_rules: PricingRule[];
  required_departments?: Department[];
  materials?: ProductMaterial[];
  stock_status?: "in_stock" | "restock" | "out_of_stock" | string | null;
}

export interface QuoteEstimate {
  unit_price: number;
  line_total: number;
  breakdown: Record<string, number>;
  currency: string;
}

export interface OrderItem {
  id: number;
  product_id?: number | null;
  name: string;
  description?: string | null;
  quantity: number;
  unit: string;
  unit_price: number;
  discount_pct: number;
  tax_rate: number;
  line_total: number;
  spec?: Record<string, any> | null;
  workflow_status?: string;
  current_department_id?: number | null;
  current_department?: Department | null;
  status_history?: OrderItemStatusHistory[];
}

export interface OrderItemStatusHistory {
  id: number;
  department_id?: number | null;
  from_status?: string | null;
  to_status: string;
  actor_id?: number | null;
  notes?: string | null;
  occurred_at: string;
}

export interface OrderStatusEvent {
  id: number;
  from_status?: string | null;
  to_status: string;
  actor_id?: number | null;
  actor_name?: string | null;
  actor_kind?: string | null;
  occurred_at: string;
  notes?: string | null;
}

export interface WorkflowAssignment {
  workflow_status: string;
  assignee_id?: number | null;
  assignee_name?: string | null;
  assignee_ids?: number[];
  assignee_names?: string[];
  assignees?: { id: number; full_name: string }[];
  department_slug?: string | null;
  is_skipped?: boolean;
}

export interface WorkflowStaff {
  id: number;
  full_name: string;
  email: string;
  department_id?: number | null;
}

export interface Order {
  id: number;
  code: string;
  customer_id: number;
  company_id?: number | null;
  owner_id?: number | null;
  department?: string | null;
  title?: string | null;
  notes?: string | null;
  deadline?: string | null;
  delivery_method?: string | null;
  delivery_address?: string | null;
  priority: string;
  status: string;
  board_column?: string;
  placed_via: string;
  currency: string;
  subtotal: number;
  tax_total: number;
  discount_total: number;
  grand_total: number;
  daftra_id?: string | null;
  daftra_number?: string | null;
  daftra_workflow_type_id?: string | null;
  stock_check_status?: string | null;
  stock_checked_at?: string | null;
  stock_checked_by_id?: number | null;
  stock_check_notes?: string | null;
  materials_deducted?: boolean;
  stock_approved?: boolean;
  items: OrderItem[];
  events: OrderStatusEvent[];
  workflow_assignments?: WorkflowAssignment[];
  created_at: string;
  updated_at: string;
}

export interface WorkflowBoardOrder {
  order_id: number;
  order_code: string;
  order_title?: string | null;
  order_priority: string;
  order_deadline?: string | null;
  order_status: string;
  board_column: string;
  progress_pct: number;
  placed_via?: string | null;
  workflow_status: string;
  item_count: number;
  items_summary: string;
  updated_at: string;
  daftra_id?: string | null;
  daftra_number?: string | null;
  stage_assignee_id?: number | null;
  stage_assignee_name?: string | null;
  stage_assignee_ids?: number[];
  stage_assignee_names?: string[];
  assignments_ready?: boolean;
  stages_with_assignees?: string[];
  can_advance?: boolean;
  read_only_reason?: string | null;
  enabled_stages?: string[];
  skipped_stages?: string[];
  next_status?: string | null;
  prev_status?: string | null;
  prev_column?: string | null;
  can_revert?: boolean;
  revert_requires_reason?: boolean;
  stock_check_status?: string | null;
}

export interface WorkflowBoardActivity {
  id: number;
  order_code: string;
  summary: string;
  actor_name?: string | null;
  occurred_at: string;
}

export interface WorkflowBoardStats {
  total: number;
  by_column: Record<string, number>;
}

export interface WorkflowBoard {
  columns: Record<string, WorkflowBoardOrder[]>;
  stats: WorkflowBoardStats;
  recent_activity: WorkflowBoardActivity[];
}

export interface LineItem {
  id?: number;
  name: string;
  description?: string | null;
  quantity: number;
  unit: string;
  unit_price: number;
  discount_pct: number;
  tax_rate: number;
  line_total?: number;
}

export interface Quotation {
  id: number;
  code: string;
  customer_id: number;
  order_id?: number | null;
  opportunity_id?: number | null;
  status: string;
  issue_date: string;
  valid_until?: string | null;
  currency: string;
  subtotal: number;
  discount_total: number;
  tax_total: number;
  grand_total: number;
  accepted_at?: string | null;
  items: LineItem[];
  notes?: string | null;
  created_at: string;
}

export interface Invoice {
  id: number;
  code: string;
  customer_id: number;
  order_id?: number | null;
  quotation_id?: number | null;
  status: string;
  issue_date: string;
  due_date?: string | null;
  currency: string;
  subtotal: number;
  discount_total: number;
  tax_total: number;
  grand_total: number;
  paid_total: number;
  balance: number;
  portal_visible: boolean;
  pdf_lang?: string | null;
  issued_at?: string | null;
  items: LineItem[];
  notes?: string | null;
  created_at: string;
  customer_name?: string | null;
  customer_email?: string | null;
  order_code?: string | null;
  last_activity?: string | null;
  sold_by?: string | null;
  salesperson_id?: number | null;
  created_by_name?: string | null;
  created_by_id?: number | null;
  warehouse_name?: string | null;
  stock_issued?: boolean;
  stock_issue_code?: string | null;
  stock_issue_at?: string | null;
}

export interface InvoiceActivityEvent {
  id: string;
  kind: string;
  action: string;
  title: string;
  detail?: string | null;
  occurred_at: string;
  user_id?: number | null;
  user_name?: string | null;
  user_email?: string | null;
}

export interface Payment {
  id: number;
  invoice_id?: number | null;
  customer_id: number;
  method: string;
  amount: number;
  currency: string;
  paid_at: string;
  reference?: string | null;
  notes?: string | null;
}

export interface Material {
  id: number;
  sku: string;
  name: string;
  unit: string;
  on_hand: number;
  cost: number;
  reorder_level: number;
  warehouse_id?: number | null;
  category?: string | null;
  image_url?: string | null;
  notes?: string | null;
}

export interface StockMovement {
  id: number;
  material_id: number;
  warehouse_id?: number | null;
  type: string;
  quantity: number;
  unit_cost: number;
  actor_id?: number | null;
  reference_type?: string | null;
  reference_id?: number | null;
  notes?: string | null;
}

export interface Warehouse {
  id: number;
  name: string;
  code: string;
  address?: string | null;
}

export interface Attachment {
  id: number;
  entity_type: string;
  entity_id: number;
  filename: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  url: string;
  uploader_id?: number | null;
  caption?: string | null;
  kind?: string | null;
  created_at: string;
}

export interface ChatMessage {
  id: number;
  body: string;
  author_user_id?: number | null;
  author_name?: string | null;
  author_avatar_url?: string | null;
  order_id?: number | null;
  order_code?: string | null;
  order_title?: string | null;
  created_at: string;
}

export interface OrderNote {
  id: number;
  order_id: number;
  author_id?: number | null;
  author_name?: string | null;
  body: string;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ConversationMember {
  user_id: number;
  full_name: string;
  email: string;
  avatar_url?: string | null;
}

export interface Conversation {
  id: number;
  kind: string;
  title?: string | null;
  order_id?: number | null;
  order_code?: string | null;
  order_title?: string | null;
  created_by_id?: number | null;
  created_at: string;
  updated_at: string;
  members: ConversationMember[];
  messages: ChatMessage[];
  last_message?: string | null;
  last_message_at?: string | null;
  unread_count: number;
}

export interface TicketMessage {
  id: number;
  body: string;
  author_user_id?: number | null;
  author_kind: string;
  author_name?: string | null;
  created_at: string;
}

export interface Ticket {
  id: number;
  code: string;
  customer_id?: number | null;
  opener_user_id?: number | null;
  assignee_id?: number | null;
  assignee_name?: string | null;
  subject: string;
  body?: string | null;
  status: string;
  priority: string;
  category?: string | null;
  closed_at?: string | null;
  created_at: string;
  messages: TicketMessage[];
}

export interface NotificationItem {
  id: number;
  type: string;
  title: string;
  body?: string | null;
  link?: string | null;
  payload?: Record<string, any> | null;
  read_at?: string | null;
  created_at: string;
}

export interface AuditLog {
  id: number;
  occurred_at: string;
  user_id?: number | null;
  user_email?: string | null;
  department?: string | null;
  action: string;
  module: string;
  entity_type?: string | null;
  entity_id?: number | null;
  old_values?: Record<string, any> | null;
  new_values?: Record<string, any> | null;
  ip_address?: string | null;
  user_agent?: string | null;
  notes?: string | null;
}

export interface DashboardKPI {
  label: string;
  value: number;
  delta_pct?: number | null;
  hint?: string | null;
  currency?: string | null;
}

export interface TimeSeriesPoint {
  t: string;
  value: number;
}

export interface StatusBreakdown {
  status: string;
  count: number;
}

export interface DepartmentLoad {
  department: string;
  active: number;
  delayed: number;
}

export interface OnlineUser {
  id: number;
  full_name: string;
  department?: string | null;
  avatar_url?: string | null;
  last_seen_at?: string | null;
}

export interface ActivityFeedItem {
  id: number;
  occurred_at: string;
  user_id?: number | null;
  user_email?: string | null;
  user_name?: string | null;
  action: string;
  module: string;
  entity_type?: string | null;
  entity_id?: number | null;
  summary: string;
}

export interface ScheduleItem {
  id: string;
  kind: "order_deadline" | "follow_up";
  title: string;
  subtitle?: string | null;
  reference_code?: string | null;
  reference_id?: number | null;
  owner_name?: string | null;
  starts_at: string;
  ends_at?: string | null;
  status?: string | null;
  overdue: boolean;
}

export interface LowStockItem {
  id: number;
  name: string;
  sku: string;
  on_hand: number;
  reorder_level: number;
  unit: string;
  stock_status: "critical" | "low" | "ok";
}

export interface DashboardSummary {
  kpis: DashboardKPI[];
  revenue_series: TimeSeriesPoint[];
  orders_by_status: StatusBreakdown[];
  department_load: DepartmentLoad[];
  online_users: OnlineUser[];
  activity_feed: ActivityFeedItem[];
  upcoming_schedules: ScheduleItem[];
  schedules_total: number;
  low_stock: LowStockItem[];
  low_stock_total: number;
  overdue_invoices: Array<{ id: number; code: string; customer_id: number; due_date: string; balance: number; currency: string }>;
  pending_approvals: Array<{ id: number; order_id?: number | null; version: number; title?: string | null }>;
}

export interface BrandSettings {
  app_name: string;
  app_name_ar: string;
  tagline: string;
  tagline_ar: string;
  sidebar_subtitle: string;
  sidebar_subtitle_ar: string;
  logo_url?: string | null;
  brand_color: string;
  brand_color_dark: string;
  accent_color: string;
  accent_color_dark: string;
}

export interface HrDashboardSummary {
  contracts_by_status: Array<{ status: string; count: number }>;
  contracts_total: number;
  pending_requests: Array<{
    id: number;
    employee_id: number;
    employee_name: string;
    employee_avatar?: string | null;
    request_type: string;
    subject: string;
    status: string;
    starts_on?: string | null;
    ends_on?: string | null;
    created_at: string;
  }>;
  pending_requests_total: number;
  payroll: {
    currency: string;
    period_start: string;
    period_end: string;
    total_gross: number;
    total_deductions: number;
    total_net: number;
    payslip_count: number;
  };
  expiring_contracts: Array<{
    id: number;
    code: string;
    employee_id: number;
    employee_name: string;
    employee_avatar?: string | null;
    title?: string | null;
    start_date: string;
    end_date: string;
    status: string;
  }>;
  attendance: Array<{ status: string; count: number; pct: number }>;
  attendance_total: number;
  workforce?: {
    employees_total: number;
    employees_active: number;
    employees_inactive: number;
    synced_from_daftra: number;
    with_department: number;
    with_title: number;
    with_contract: number;
    by_department: Array<{ id?: number | null; name: string; count: number }>;
    by_title: Array<{ id?: number | null; name: string; count: number }>;
  };
}

export interface Designation {
  id: number;
  name: string;
  description?: string | null;
  is_active: boolean;
  department_id?: number | null;
  daftra_id?: string | null;
  daftra_department_id?: string | null;
  currency_code?: string | null;
}

export interface StaffProfile {
  employee_code?: string | null;
  staff_type?: string | null;
  can_access_system?: boolean;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country_code?: string | null;
  home_phone?: string | null;
  business_phone?: string | null;
  fax?: string | null;
  nationality?: string | null;
  citizenship_status?: string | null;
  official_id?: string | null;
  gender?: string | null;
  birth_date?: string | null;
  hire_date?: string | null;
  residence_expiry?: string | null;
  hourly_rate?: number | null;
  hourly_rate_currency?: string | null;
  employment_type_id?: string | null;
  employment_level_id?: string | null;
  notes?: string | null;
  daftra_id?: string | null;
}

export interface EmployeeContractDetail {
  id: number;
  code: string;
  employee_id: number;
  title?: string | null;
  job_title?: string | null;
  job_level?: string | null;
  description?: string | null;
  status: string;
  start_date: string;
  end_date?: string | null;
  join_date?: string | null;
  signed_at?: string | null;
  probation_end?: string | null;
  salary: number;
  currency: string;
  salary_template?: string | null;
  is_primary: boolean;
  notes?: string | null;
}

export interface EmployeeHrProfile {
  id: number;
  full_name: string;
  email: string;
  phone?: string | null;
  avatar_url?: string | null;
  title?: string | null;
  department?: string | null;
  department_id?: number | null;
  is_active: boolean;
  is_staff?: boolean;
  daftra_id?: string | null;
  last_login_at?: string | null;
  created_at?: string | null;
  roles: string[];
  role_slugs?: string[];
  profile?: StaffProfile | null;
  primary_contract?: EmployeeContractDetail | null;
  contracts: EmployeeContractDetail[];
  payslips: Array<{
    id: number;
    code: string;
    period_start: string;
    period_end: string;
    gross_pay: number;
    deductions: number;
    net_pay: number;
    base_salary?: number;
    overtime?: number;
    absence?: number;
    bonus?: number;
    currency: string;
    paid: boolean;
    paid_at?: string | null;
    status?: string;
    source?: string;
    notes?: string | null;
    daftra_id?: string | null;
  }>;
  attendance: Array<{
    id: number;
    work_date: string;
    status: string;
    check_in?: string | null;
    check_out?: string | null;
    notes?: string | null;
  }>;
  attendance_summary: Array<{ status: string; count: number; pct: number }>;
  requests: Array<{
    id: number;
    employee_id: number;
    employee_name: string;
    employee_avatar?: string | null;
    request_type: string;
    subject: string;
    status: string;
    starts_on?: string | null;
    ends_on?: string | null;
    created_at: string;
  }>;
  projects: Array<{
    order_id: number;
    code: string;
    title?: string | null;
    status: string;
    priority: string;
    deadline?: string | null;
    workflow_status?: string | null;
    role: "assignee" | "owner" | string;
    on_board: boolean;
    grand_total: number;
    currency: string;
  }>;
  activity: Array<{
    id: string;
    occurred_at: string;
    kind: string;
    summary: string;
    meta?: string | null;
  }>;
  payroll_totals: {
    currency: string;
    period_start: string;
    period_end: string;
    total_gross: number;
    total_deductions: number;
    total_net: number;
    payslip_count: number;
  };
  payroll_overview?: {
    currency: string;
    period_start: string;
    period_end: string;
    average_gross: number;
    average_net: number;
    total_net: number;
    total_gross: number;
    total_deductions: number;
    total_base_salary: number;
    total_overtime: number;
    total_absence: number;
    total_bonus?: number;
    payslip_count: number;
    months: Array<{
      year: number;
      month: number;
      label: string;
      base_salary: number;
      overtime: number;
      absence: number;
      bonus?: number;
      gross_pay: number;
      deductions: number;
      net_pay: number;
    }>;
  } | null;
}

export interface AttendanceMonthDay {
  date: string;
  day: number;
  weekday: number;
  status?: string | null;
  check_in?: string | null;
  check_out?: string | null;
  notes?: string | null;
  deduction_amount?: number | null;
  record_id?: number | null;
}

export interface AttendanceMonth {
  employee_id: number;
  year: number;
  month: number;
  daily_rate: number;
  currency: string;
  base_salary: number;
  counts: Record<string, number>;
  days: AttendanceMonthDay[];
}

export interface PayrollAdjustment {
  id: number;
  employee_id: number;
  period_year: number;
  period_month: number;
  kind: string;
  amount: number;
  currency: string;
  reason?: string | null;
  created_by_id?: number | null;
  created_at: string;
}

export interface PayslipDraftPreview {
  employee_id: number;
  year: number;
  month: number;
  period_start: string;
  period_end: string;
  currency: string;
  base_salary: number;
  daily_rate: number;
  absent_days: number;
  absence_deduction: number;
  overtime: number;
  bonus: number;
  extra_deduction: number;
  gross_pay: number;
  deductions: number;
  net_pay: number;
  adjustments: PayrollAdjustment[];
  draft_payslip?: {
    id: number;
    code: string;
    status: string;
    paid: boolean;
    net_pay: number;
    currency: string;
  } | null;
}

export interface PayrollReport {
  period_start: string;
  period_end: string;
  currency: string;
  total_gross: number;
  total_deductions: number;
  total_bonus: number;
  total_net: number;
  headcount: number;
  payslip_count: number;
  rows: Array<{
    payslip_id: number;
    employee_id: number;
    employee_name: string;
    department?: string | null;
    code: string;
    period_start: string;
    period_end: string;
    base_salary: number;
    overtime: number;
    absence: number;
    bonus: number;
    gross_pay: number;
    deductions: number;
    net_pay: number;
    currency: string;
    status: string;
    source: string;
    paid: boolean;
    paid_at?: string | null;
  }>;
}
