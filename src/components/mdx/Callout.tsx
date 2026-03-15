import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type CalloutType = "info" | "warning" | "danger" | "tip";

interface CalloutProps {
  type?: CalloutType;
  title?: string;
  children: ReactNode;
}

const icons: Record<CalloutType, ReactNode> = {
  info: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  warning: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  danger: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  tip: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="9" y1="18" x2="15" y2="18" />
      <line x1="10" y1="22" x2="14" y2="22" />
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0018 8 6 6 0 006 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 018.91 14" />
    </svg>
  ),
};

const styles: Record<
  CalloutType,
  { border: string; bg: string; icon: string }
> = {
  info: {
    border: "border-l-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    icon: "text-blue-500",
  },
  warning: {
    border: "border-l-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    icon: "text-amber-500",
  },
  danger: {
    border: "border-l-red-500",
    bg: "bg-red-50 dark:bg-red-950/30",
    icon: "text-red-500",
  },
  tip: {
    border: "border-l-green-500",
    bg: "bg-green-50 dark:bg-green-950/30",
    icon: "text-green-500",
  },
};

const defaultTitles: Record<CalloutType, string> = {
  info: "Info",
  warning: "Warning",
  danger: "Danger",
  tip: "Tip",
};

export default function Callout({
  type = "info",
  title,
  children,
}: CalloutProps) {
  const style = styles[type];
  const displayTitle = title ?? defaultTitles[type];

  return (
    <aside
      role="note"
      className={cn("my-6 rounded-r-lg border-l-4 p-4", style.border, style.bg)}
    >
      <div className="flex items-center gap-2 font-semibold">
        <span className={style.icon}>{icons[type]}</span>
        <span>{displayTitle}</span>
      </div>
      <div className="mt-2 text-sm leading-relaxed [&>p]:m-0">{children}</div>
    </aside>
  );
}
