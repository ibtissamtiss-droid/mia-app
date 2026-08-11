"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
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
    <html lang="fr">
      <body className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="flex max-w-sm flex-col items-center gap-3 text-center">
          <AlertTriangle className="h-8 w-8 text-muted-foreground" />
          <h1 className="text-lg font-semibold">Une erreur est survenue</h1>
          <p className="text-sm text-muted-foreground">
            Quelque chose s&apos;est mal passé. Vous pouvez réessayer ou revenir plus tard.
          </p>
          <Button onClick={reset}>Réessayer</Button>
        </div>
      </body>
    </html>
  );
}
