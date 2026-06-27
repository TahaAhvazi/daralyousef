# 07 — Design System

A premium SaaS aesthetic — Apple-grade quietness, with glassmorphism accents.

## 1. Brand

- **Product name**: Atelier ERP
- **Tagline**: "Run your creative business from one quiet, beautiful place."

## 2. Color Palette

### Light theme

| Token         | Value     | Use                                  |
| ------------- | --------- | ------------------------------------ |
| `--bg`        | #F7F8FB   | App background                       |
| `--surface`   | #FFFFFF   | Cards, sheets                        |
| `--surface-2` | #F0F2F7   | Subtle blocks                        |
| `--border`    | #E5E7EE   | Hairlines                            |
| `--text`      | #0B1220   | Primary text                         |
| `--text-2`    | #4A5468   | Secondary text                       |
| `--text-3`    | #8A93A6   | Tertiary text / placeholder          |
| `--brand`     | #5B6CFF   | Primary action (indigo-violet)       |
| `--brand-2`   | #8B5CF6   | Gradient end                         |
| `--accent`    | #06B6D4   | Accent / info                        |
| `--success`   | #10B981   | OK                                   |
| `--warning`   | #F59E0B   | Caution                              |
| `--danger`    | #EF4444   | Error / delete                       |

### Dark theme

| Token         | Value     |
| ------------- | --------- |
| `--bg`        | #0B0F1A   |
| `--surface`   | #111726   |
| `--surface-2` | #19223A   |
| `--border`    | #243054   |
| `--text`      | #F1F5FA   |
| `--text-2`    | #B7C0D6   |
| `--text-3`    | #6E7AA0   |

### Gradients

- `--grad-brand`: `linear-gradient(135deg, #5B6CFF 0%, #8B5CF6 50%, #EC4899 100%)`
- `--grad-aurora`: `linear-gradient(135deg, #6EE7F9 0%, #818CF8 50%, #C084FC 100%)`
- `--grad-glow`: `radial-gradient(800px 400px at top, rgba(91,108,255,.25), transparent 60%)`

## 3. Typography

- **Primary**: `Inter`, system-ui (variable, weights 400/500/600/700/800).
- **Display**: `Inter Display` fallback to Inter; tighter tracking.
- **Mono**: `JetBrains Mono`, `ui-monospace`.

Scale (rem):

| Token  | Size | LH   | Use                |
| ------ | ---- | ---- | ------------------ |
| `xs`   | .75  | 1rem | helper, badges     |
| `sm`   | .875 | 1.25 | body small         |
| `base` | 1    | 1.5  | body               |
| `lg`   | 1.125| 1.75 | emphasized body    |
| `xl`   | 1.25 | 1.75 | section subtitle   |
| `2xl`  | 1.5  | 2    | section title      |
| `3xl`  | 1.875| 2.25 | page title         |
| `4xl`  | 2.25 | 2.5  | dashboard hero     |

## 4. Spacing & Radius

- Spacing scale (px): 0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96.
- Radius: `sm = 8`, `md = 12`, `lg = 16`, `xl = 22`, `2xl = 28`, `full`.

## 5. Elevation (soft shadows)

```
--shadow-1: 0 1px 2px rgba(11,18,32,.04), 0 1px 3px rgba(11,18,32,.06);
--shadow-2: 0 4px 14px rgba(11,18,32,.06), 0 2px 6px rgba(11,18,32,.04);
--shadow-3: 0 18px 40px -12px rgba(91,108,255,.25),
            0 8px 24px -8px rgba(11,18,32,.08);
--shadow-glow: 0 0 0 1px rgba(91,108,255,.15), 0 12px 40px rgba(91,108,255,.18);
```

## 6. Glassmorphism

```
background: linear-gradient(180deg, rgba(255,255,255,.7), rgba(255,255,255,.45));
backdrop-filter: blur(18px) saturate(140%);
border: 1px solid rgba(255,255,255,.6);
box-shadow: var(--shadow-2);
```

Dark variant uses `rgba(17,23,38,.55) → rgba(17,23,38,.35)`.

## 7. Motion

- All transitions use `cubic-bezier(.2,.7,.2,1)` (Apple-ease).
- Hover lifts: `transform: translateY(-1px)`, `box-shadow → shadow-3`.
- Page transitions via Framer Motion: fade + 4px upward, 220ms.
- Skeletons shimmer at 1400ms loop.

## 8. Components (delivered)

- Button (primary, secondary, ghost, danger, icon, loading)
- Card / GlassCard
- Input, Textarea, Select, NumberInput, FileDrop, Switch, Checkbox, Radio
- Badge, Pill, Tag, Avatar, AvatarGroup
- Modal, Drawer, Sheet, Popover, Tooltip, ContextMenu
- Tabs, Accordion, Stepper
- Table (sortable, pageable, sticky header)
- Toast (success/info/warn/error)
- EmptyState, ErrorState, Skeleton
- KPI card, MetricCard, TrendChart, DonutChart, AreaChart
- Sidebar with section groups + collapsible
- Topbar with search, theme toggle, notifications, profile

## 9. UX Flows

### Order intake (customer)
1. Customer chooses category → service.
2. Configurator (material, size, qty, options) shows **live price**.
3. Customer uploads files → drag & drop with thumbnails.
4. Customer adds notes & deadline.
5. Quote preview → submit → confirmation page with order number & next steps.

### Design approval
1. Designer uploads revision → "Send for approval".
2. Customer receives notification → opens preview → Approve / Reject / Revise.
3. On Approve → captures device, IP, optional canvas signature, audit log row.
4. Order moves to production state automatically.

### Production
1. Operator opens Print Queue (sorted by due date + priority).
2. Tap **Start** on a job → status = In Progress, start timestamp.
3. Log material usage (auto stock-out).
4. Tap **Complete** → status = Ready for QA.

### CEO dashboard
1. Hero row: revenue today, MTD, active orders, delayed orders, online users.
2. Live activity feed (websocket-style polling).
3. Donut: orders by status. Area: revenue trend (30 days).
4. Tables: pending approvals, overdue invoices, low-stock materials.
