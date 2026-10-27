import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-xl bg-line/[0.07]", className)} aria-hidden>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/5" />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="glass flex gap-3 p-4" aria-hidden>
      <Skeleton className="h-14 w-14 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2 pt-1">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-9 w-full" />
      </div>
    </div>
  );
}
