import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center py-24 text-muted-foreground", className)}>
      <Loader2 className="h-5 w-5 animate-spin" />
    </div>
  );
}
