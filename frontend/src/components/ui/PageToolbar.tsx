import { cn } from "@/lib/cn";

export const TOOLBAR_INPUT = "w-full min-w-0 sm:w-auto sm:min-w-[9rem] lg:w-72";
export const TOOLBAR_SELECT = "w-full min-w-0 sm:w-auto sm:min-w-[9rem] lg:w-44";
export const TOOLBAR_SELECT_SM = "w-full min-w-0 sm:w-auto sm:min-w-[9rem] lg:w-40";

export function PageToolbar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-4 flex w-full min-w-0 max-w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center",
        className,
      )}
    >
      {children}
    </div>
  );
}
