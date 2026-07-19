import { useState } from "react";
import { useQueries } from "@tanstack/react-query";

import { ordersApi } from "@/api/modules";
import { cn } from "@/lib/cn";
import {
  WORKFLOW_ASSIGNMENT_STAGES,
  type WorkflowAssignmentDraft,
  type WorkflowAssignmentStage,
} from "@/lib/workflow";
import { useT } from "@/i18n/useT";
import type { WorkflowStaff } from "@/types/api";

export type { WorkflowAssignmentDraft, WorkflowAssignmentStage };
export {
  WORKFLOW_ASSIGNMENT_STAGES,
  emptyAssignmentDrafts,
  draftsFromOrder,
  draftsToPayload,
  assignmentsReadyForRelease,
  allStagesAssigned,
  applySuggestedStages,
  suggestedStagesFromProducts,
} from "@/lib/workflow";

interface WorkflowAssignmentFormProps {
  value: WorkflowAssignmentDraft[];
  onChange: (next: WorkflowAssignmentDraft[]) => void;
  disabled?: boolean;
}

function staffMatchesQuery(u: WorkflowStaff, q: string): boolean {
  if (!q) return true;
  const hay = `${u.full_name} ${u.email}`.toLowerCase();
  return hay.includes(q);
}

export function WorkflowAssignmentForm({ value, onChange, disabled }: WorkflowAssignmentFormProps) {
  const { t } = useT();
  const wa = t.staffUi.workflowAssignments;
  const stageLabels: Record<WorkflowAssignmentStage, string> = wa.stages;
  const [staffSearch, setStaffSearch] = useState<Partial<Record<WorkflowAssignmentStage, string>>>({});

  const staffQueries = useQueries({
    queries: WORKFLOW_ASSIGNMENT_STAGES.map((stage) => ({
      queryKey: ["workflow-staff", stage],
      queryFn: () => ordersApi.workflowStaff(stage),
      staleTime: 60_000,
    })),
  });

  const toggleAssignee = (stage: WorkflowAssignmentStage, userId: number) => {
    onChange(
      value.map((d) => {
        if (d.workflow_status !== stage) return d;
        const has = d.assignee_ids.includes(userId);
        return {
          ...d,
          assignee_ids: has
            ? d.assignee_ids.filter((id) => id !== userId)
            : [...d.assignee_ids, userId],
        };
      }),
    );
  };

  return (
    <div className="space-y-3">
      <p className="text-[12.5px] text-text-2">{wa.description}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {WORKFLOW_ASSIGNMENT_STAGES.map((stage, idx) => {
          const staff = staffQueries[idx]?.data ?? [];
          const row = value.find((d) => d.workflow_status === stage);
          const skipped = row?.skipped ?? false;
          const selected = new Set(row?.assignee_ids ?? []);
          const q = (staffSearch[stage] ?? "").trim().toLowerCase();
          // Match name/email; keep already-selected people visible while filtering
          const list = staff.filter(
            (u) => !q || selected.has(u.id) || staffMatchesQuery(u, q),
          );

          return (
            <div
              key={stage}
              className={cn(
                "rounded-lg border p-3 space-y-2 transition-opacity",
                skipped ? "border-border/60 bg-surface-2/40 opacity-60" : "border-border bg-surface/40",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-medium text-text">{stageLabels[stage]}</span>
                <label className="flex items-center gap-1.5 text-[11.5px] text-text-3 select-none cursor-pointer">
                  <input
                    type="checkbox"
                    className="size-3.5 accent-[rgb(var(--brand))]"
                    checked={skipped}
                    disabled={disabled}
                    onChange={(e) => {
                      const na = e.target.checked;
                      onChange(
                        value.map((d) =>
                          d.workflow_status === stage
                            ? { ...d, skipped: na, assignee_ids: na ? [] : d.assignee_ids }
                            : d,
                        ),
                      );
                    }}
                  />
                  {wa.notApplicable}
                </label>
              </div>
              {!skipped ? (
                <div className="space-y-1.5">
                  {staff.length > 0 ? (
                    <input
                      type="search"
                      value={staffSearch[stage] ?? ""}
                      disabled={disabled}
                      placeholder={t.staffUi.common.search}
                      onChange={(e) =>
                        setStaffSearch((prev) => ({ ...prev, [stage]: e.target.value }))
                      }
                      className="w-full rounded-md border border-border bg-bg px-2.5 py-1.5 text-[12.5px] text-text placeholder:text-text-3 outline-none focus:border-brand/50"
                    />
                  ) : null}
                  <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                    {staffQueries[idx]?.isLoading ? (
                      <p className="text-[11.5px] text-text-3">{t.common.loading}</p>
                    ) : staff.length === 0 ? (
                      <p className="text-[11.5px] text-text-3 italic">{wa.noStaff}</p>
                    ) : list.length === 0 ? (
                      <p className="text-[11.5px] text-text-3 italic">{t.staffUi.common.noResults}</p>
                    ) : (
                      list.map((u) => (
                        <label
                          key={u.id}
                          className={cn(
                            "flex items-center gap-2 rounded-md px-2 py-1.5 text-[12.5px] cursor-pointer",
                            "hover:bg-surface-2/80",
                            selected.has(u.id) && "bg-brand/10 text-brand",
                          )}
                        >
                          <input
                            type="checkbox"
                            className="size-3.5 accent-[rgb(var(--brand))]"
                            checked={selected.has(u.id)}
                            disabled={disabled}
                            onChange={() => toggleAssignee(stage, u.id)}
                          />
                          <span className="min-w-0 flex-1 truncate">{u.full_name}</span>
                        </label>
                      ))
                    )}
                  </div>
                  {selected.size > 0 ? (
                    <p className="text-[10.5px] text-text-3 pt-0.5">
                      {wa.selectedCount.replace("{n}", String(selected.size))}
                    </p>
                  ) : (
                    <p className="text-[10.5px] text-amber-600 dark:text-amber-400">{wa.selectStaff}</p>
                  )}
                </div>
              ) : (
                <p className="text-[11.5px] text-text-3 italic">{wa.skippedHint}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
