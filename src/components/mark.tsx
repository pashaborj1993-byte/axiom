import { cn } from "@/lib/cn";

export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden="true">
      <rect width="32" height="32" rx="9" className="fill-pine" />
      <path
        d="M8.5 22.5 16 8.5l7.5 14"
        className="stroke-paper"
        fill="none"
        strokeWidth="2.4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M11.6 17h8.8"
        className="stroke-copper"
        fill="none"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
