import type { Dict } from "@/i18n/messages";

export function departmentLabel(
  dept: { slug?: string; name: string } | string | null | undefined,
  t: Dict,
): string {
  if (!dept) return "";
  const slug = typeof dept === "string" ? dept : dept.slug;
  const fallback = typeof dept === "string" ? dept : dept.name;
  if (slug && t.staffUi.departments[slug]) return t.staffUi.departments[slug];
  return fallback;
}

export function workflowStageLabel(stage: string, t: Dict): string {
  const ws = t.staffUi.orders.detail.workflowStages as Record<string, string>;
  return ws[stage] ?? stage.replace(/_/g, " ");
}

export function priorityLabel(priority: string, t: Dict): string {
  const p = t.staffUi.priorities as Record<string, string>;
  return p[priority] ?? priority;
}
