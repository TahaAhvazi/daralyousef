import type { AxiosError } from "axios";

import type { Locale } from "@/i18n/config";
import { MESSAGES, type Dict } from "@/i18n/messages";

type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
    details?: { stage?: string; [key: string]: unknown };
  };
};

export function stageLabel(t: Dict, stage?: string): string {
  if (!stage) return "";
  const cols = t.staffUi.orderBoard.columns as Record<string, string>;
  const stages = t.staffUi.workflowAssignments.stages as Record<string, string>;
  return cols[stage] ?? stages[stage] ?? stage.replace(/_/g, " ");
}

export function translateApiError(error: unknown, locale: Locale): string {
  const t = MESSAGES[locale];
  const ax = error as AxiosError<ApiErrorBody>;
  const body = ax.response?.data?.error;
  const code = body?.code;
  const stage = body?.details?.stage as string | undefined;
  const label = stageLabel(t, stage);
  const bb = t.staffUi.orderBoard;

  switch (code) {
    case "board_stage_marked_na":
      return bb.stageMarkedNa.replace("{stage}", label || "—");
    case "board_stage_no_assignees":
      return bb.stageNoAssignees.replace("{stage}", label || "—");
    case "board_revert_reason_required":
      return bb.revertRequiresReason;
    case "board_one_stage_back":
      return bb.oneStageBackOnly;
    case "forbidden":
      return body?.message ?? t.common.error;
    case "validation_error":
      return body?.message && body.message !== "Validation failed"
        ? body.message
        : t.common.error;
    default:
      if (body?.message) return body.message;
      if (ax.message && !ax.message.startsWith("Request failed with status code")) {
        return ax.message;
      }
      return t.common.error;
  }
}

export function apiErrorMessage(error: unknown, locale: Locale): string {
  return translateApiError(error, locale);
}
