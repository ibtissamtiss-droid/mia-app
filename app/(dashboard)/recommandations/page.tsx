"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { CheckCircle2, Circle, Loader2, Sparkles } from "lucide-react";
import type { Recommendation } from "@/types/models";

const PRIORITY_LABEL: Record<Recommendation["priority"], string> = {
  HIGH: "Priorité haute",
  MEDIUM: "Priorité moyenne",
  LOW: "Priorité basse",
};

const PRIORITY_VARIANT: Record<Recommendation["priority"], "destructive" | "default" | "secondary"> = {
  HIGH: "destructive",
  MEDIUM: "default",
  LOW: "secondary",
};

export default function RecommandationsPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[] | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetch("/api/recommendations")
      .then((res) => res.json())
      .then((data: { recommendations: Recommendation[] }) => setRecommendations(data.recommendations));
  }, []);

  const generate = async () => {
    setGenerating(true);
    const res = await fetch("/api/recommendations/generate", { method: "POST" });
    setGenerating(false);
    if (res.ok) {
      const data: { recommendations: Recommendation[] } = await res.json();
      setRecommendations(data.recommendations);
      toast.success("Recommandations mises à jour");
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Échec de la génération");
    }
  };

  const toggleDone = async (rec: Recommendation) => {
    if (!recommendations) return;
    const nextDone = !rec.done;
    setRecommendations(recommendations.map((r) => (r.id === rec.id ? { ...r, done: nextDone } : r)));
    const res = await fetch(`/api/recommendations/${rec.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: nextDone }),
    });
    if (!res.ok) {
      setRecommendations(recommendations.map((r) => (r.id === rec.id ? { ...r, done: rec.done } : r)));
      toast.error("Échec de la mise à jour");
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Recommandations</h1>
          <p className="text-sm text-muted-foreground">
            Des recommandations générées par l&apos;IA à partir de vos données réelles dans MIA.
          </p>
        </div>
        <Button size="sm" onClick={generate} disabled={generating}>
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyse...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              {recommendations && recommendations.length > 0 ? "Régénérer" : "Générer"}
            </>
          )}
        </Button>
      </div>

      {recommendations === null ? (
        <p className="text-sm text-muted-foreground">Chargement...</p>
      ) : recommendations.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Cliquez sur « Générer » pour obtenir des recommandations basées sur vos factures,
          prospects, tâches et prévisionnel.
        </p>
      ) : (
        <div className="space-y-3">
          {recommendations.map((rec) => (
            <Card key={rec.id}>
              <CardContent className="flex items-start gap-3 py-3">
                <button
                  type="button"
                  onClick={() => toggleDone(rec)}
                  className="mt-0.5 shrink-0"
                  aria-label="Marquer comme fait"
                >
                  {rec.done ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className={
                        rec.done
                          ? "text-sm font-medium line-through text-muted-foreground"
                          : "text-sm font-medium"
                      }
                    >
                      {rec.title}
                    </p>
                    <Badge variant={PRIORITY_VARIANT[rec.priority]}>{PRIORITY_LABEL[rec.priority]}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{rec.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
