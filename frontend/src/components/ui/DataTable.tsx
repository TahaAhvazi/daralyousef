import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface Column<T> {
  key: string;
  header: ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
  render: (row: T, index: number) => ReactNode;
  width?: string | number;
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  empty?: ReactNode;
  onRowClick?: (row: T) => void;
  rowKey?: (row: T, index: number) => string | number;
  stickyHeader?: boolean;
}

export function DataTable<T>({
  columns,
  rows,
  loading,
  empty,
  onRowClick,
  rowKey,
  stickyHeader = true,
}: DataTableProps<T>) {
  return (
    <div className="card min-w-0 max-w-full overflow-hidden">
      <div className="overflow-x-auto overscroll-x-contain">
        <table className="min-w-full border-collapse">
          <thead
            className={cn(
              "border-b border-border bg-surface-2/70",
              stickyHeader && "sticky top-0 z-[1] backdrop-blur-sm",
            )}
          >
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  style={{ width: c.width }}
                  className={cn(
                    "px-4 py-3 text-start text-overline",
                    c.align === "right" && "text-end",
                    c.align === "center" && "text-center",
                    c.hideOnMobile && "hidden sm:table-cell",
                    c.className,
                  )}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/70">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={cn("px-4 py-3.5", c.hideOnMobile && "hidden sm:table-cell")}
                    >
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
                    onRowClick && "cursor-pointer hover:bg-surface-2/50",
                  )}
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={cn(
                        "px-4 py-3.5 text-body",
                        c.align === "right" && "text-end",
                        c.align === "center" && "text-center",
                        c.hideOnMobile && "hidden sm:table-cell",
                        c.className,
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
