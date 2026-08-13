"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageSpinner } from "@/components/ui/page-spinner";
import { toast } from "sonner";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";

export function DailyBriefingCard() {
  const [content, setContent] = useState<string | null>(null);
  const [paidRequired, setPaidRequired] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    fetch("/api/daily-briefing").then(async (res) => {
      if (res.status === 402) {
        setPaidRequired(true);
        return;
      }
      const data: { content: string } = await res.json();
      setContent(data.content);
    });
  }, []);

  const regenerate = async () => {
    setRegenerating(true);
    const res = await fetch("/api/daily-briefing", { method: "POST" });
    setRegenerating(false);
    if (res.ok) {
      const data: { content: string } = await res.json();
      setContent(data.content);
    } else {
      toast.error("Échec de la mise à jour du point du jour");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" />
          Point du jour
        </CardTitle>
        {content !== null && (
          <Button variant="ghost" size="icon" onClick={regenerate} disabled={regenerating}>
            {regenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {paidRequired ? (
          <div className="flex items-center justify-between gap-4 text-sm">
            <p className="text-muted-foreground">Le point du jour fait partie de la formule Pro.</p>
            <Link href="/abonnement">
              <Button size="sm" variant="outline">
                Voir la formule Pro
              </Button>
            </Link>
          </div>
        ) : content === null ? (
          <PageSpinner className="py-6" />
        ) : (
          <p className="text-sm">{content}</p>
        )}
      </CardContent>
    </Card>
  );
}
