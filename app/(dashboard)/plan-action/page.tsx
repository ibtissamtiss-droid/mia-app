"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { CheckCircle2, Circle, Loader2, Sparkles } from "lucide-react";

type Step = { id: string; title: string; description: string | null; done: boolean };
type Plan = { id: string; goal: string; context: string | null; steps: Step[] };

export default function PlanActionPage() {
  const [plan, setPlan] = useState<Plan | null | undefined>(undefined);
  const [goal, setGoal] = useState("");
  const [context, setContext] = useState("");
  const [generating, setGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetch("/api/plan-action")
      .then((res) => res.json())
      .then((data: { plan: Plan | null }) => setPlan(data.plan));
  }, []);

  const generate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) {
      toast.error("Indiquez votre objectif principal");
      return;
    }
    setGenerating(true);
    const res = await fetch("/api/plan-action/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal, context: context || undefined }),
    });
    setGenerating(false);
    if (res.ok) {
      const data: { plan: Plan } = await res.json();
      setPlan(data.plan);
      setShowForm(false);
      toast.success("Plan d'action généré");
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Échec de la génération");
    }
  };

  const toggleStep = async (step: Step) => {
    if (!plan) return;
    const nextDone = !step.done;
    setPlan({
      ...plan,
      steps: plan.steps.map((s) => (s.id === step.id ? { ...s, done: nextDone } : s)),
    });
    const res = await fetch(`/api/plan-action/steps/${step.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: nextDone }),
    });
    if (!res.ok) {
      setPlan({
        ...plan,
        steps: plan.steps.map((s) => (s.id === step.id ? { ...s, done: step.done } : s)),
      });
      toast.error("Échec de la mise à jour");
    }
  };

  const startNewPlan = () => {
    if (plan) {
      setGoal(plan.goal);
      setContext(plan.context || "");
    }
    setShowForm(true);
  };

  const doneCount = plan?.steps.filter((s) => s.done).length ?? 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Plan d&apos;action personnalisé</h1>
        <p className="text-sm text-muted-foreground">
          Un plan généré par l&apos;IA à partir de votre objectif, pour avancer étape par étape.
        </p>
      </div>

      {plan === undefined ? (
        <p className="text-sm text-muted-foreground">Chargement...</p>
      ) : plan && !showForm ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Objectif</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">{plan.goal}</p>
              {plan.context && (
                <p className="text-sm text-muted-foreground">{plan.context}</p>
              )}
              <p className="pt-1 text-xs text-muted-foreground">
                {doneCount} / {plan.steps.length} étapes terminées
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Étapes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {plan.steps.map((step) => (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => toggleStep(step)}
                  className="flex w-full items-start gap-3 rounded-md p-2 text-left transition-colors hover:bg-secondary/60"
                >
                  {step.done ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  ) : (
                    <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                  )}
                  <span>
                    <span
                      className={
                        step.done
                          ? "text-sm font-medium line-through text-muted-foreground"
                          : "text-sm font-medium"
                      }
                    >
                      {step.title}
                    </span>
                    {step.description && (
                      <span className="block text-xs text-muted-foreground">
                        {step.description}
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </CardContent>
          </Card>

          <Button variant="outline" size="sm" onClick={startNewPlan}>
            <Sparkles className="h-4 w-4" />
            Générer un nouveau plan
          </Button>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {plan ? "Générer un nouveau plan" : "Créez votre plan d'action"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={generate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="goal">Objectif principal</Label>
                <Textarea
                  id="goal"
                  placeholder="Ex: Trouver 3 nouveaux clients d'ici la fin du trimestre"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="context">Contexte (optionnel)</Label>
                <Textarea
                  id="context"
                  placeholder="Ex: Je suis développeur freelance depuis 1 an, je travaille seul, je dispose de 5h par semaine pour la prospection"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button type="submit" disabled={generating}>
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Génération...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Générer mon plan
                    </>
                  )}
                </Button>
                {plan && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowForm(false)}
                    disabled={generating}
                  >
                    Annuler
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
