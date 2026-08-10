"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";

export function ProspectingIdeas() {
  const [context, setContext] = useState("");
  const [ideas, setIdeas] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    const res = await fetch("/api/prospects/ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ context: context || undefined }),
    });
    setLoading(false);
    if (res.ok) {
      const data: { ideas: string[] } = await res.json();
      setIdeas(data.ideas);
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Échec de la génération");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Idées de prospection</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          rows={2}
          placeholder="Décrivez votre activité (optionnel si vous avez déjà un business plan)"
          value={context}
          onChange={(e) => setContext(e.target.value)}
        />
        <Button type="button" variant="outline" size="sm" onClick={generate} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Génération...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              {ideas ? "Régénérer des idées" : "Générer des idées"}
            </>
          )}
        </Button>
        {ideas && (
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {ideas.map((idea, i) => (
              <li key={i}>{idea}</li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
