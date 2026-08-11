"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
      <AlertTriangle className="h-8 w-8 text-muted-foreground" />
      <h1 className="text-lg font-semibold">Une erreur est survenue</h1>
      <p className="text-sm text-muted-foreground">
        Cette page a rencontré un problème. Vous pouvez réessayer.
      </p>
      <Button onClick={reset}>Réessayer</Button>
    </div>
  );
}
