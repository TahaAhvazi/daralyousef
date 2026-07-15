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
  title?: string | null;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  theme: string;
  locale: string;
  last_login_at?: string | null;
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
  user_email?: string | null;
  action: string;
  module: string;
  entity_type?: string | null;
  entity_id?: number | null;
  summary: string;
}

export interface DashboardSummary {
  kpis: DashboardKPI[];
  revenue_series: TimeSeriesPoint[];
  orders_by_status: StatusBreakdown[];
  department_load: DepartmentLoad[];
  online_users: OnlineUser[];
  activity_feed: ActivityFeedItem[];
  low_stock: Array<{ id: number; name: string; sku: string; on_hand: number; reorder_level: number; unit: string }>;
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
