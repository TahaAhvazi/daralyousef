import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface Column<T> {
  key: string;
  header: ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
  render: (row: T, index: number) => ReactNode;
  width?: string | number;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  empty?: ReactNode;
  onRowClick?: (row: T) => void;
  rowKey?: (row: T, index: number) => string | number;
}

export function DataTable<T>({
  columns,
  rows,
  loading,
  empty,
  onRowClick,
  rowKey,
}: DataTableProps<T>) {
  return (
    <div className="card min-w-0 max-w-full overflow-hidden">
      <div className="overflow-x-auto overscroll-x-contain">
        <table className="min-w-full">
          <thead className="bg-surface-2/60 border-b border-border">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  style={{ width: c.width }}
                  className={cn(
                    "px-4 py-3 text-start text-[11.5px] font-semibold uppercase tracking-wider text-text-3",
                    c.align === "right" && "text-end",
                    c.align === "center" && "text-center",
                    c.className
                  )}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/80">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3">
                      <div className="skeleton h-4 w-2/3" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-0">
                  {empty}
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={rowKey ? rowKey(row, i) : i}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "transition-colors",
                    onRowClick && "cursor-pointer hover:bg-surface-2/60"
                  )}
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={cn(
                        "px-4 py-3 text-[13.5px] text-text",
                        c.align === "right" && "text-end",
                        c.align === "center" && "text-center",
                        c.className
                      )}
                    >
                      {c.render(row, i)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
