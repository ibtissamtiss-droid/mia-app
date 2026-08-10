"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Download, Loader2, Sparkles } from "lucide-react";

type Plan = {
  id: string;
  projectName: string;
  summary: string;
  presentation: string;
  offer: string;
  market: string;
  strategy: string;
};

type ForecastMonth = { month: string; revenue: number; expenses: number };

const SECTIONS: { key: keyof Omit<Plan, "id" | "projectName">; label: string }[] = [
  { key: "summary", label: "Résumé" },
  { key: "presentation", label: "Présentation du projet" },
  { key: "offer", label: "L'offre" },
  { key: "market", label: "Marché cible et clientèle" },
  { key: "strategy", label: "Stratégie commerciale" },
];

function formatEuro(value: number) {
  return `${value.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

export default function BusinessPlanPage() {
  const [plan, setPlan] = useState<Plan | null | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({
    projectName: "",
    activity: "",
    offer: "",
    targetClients: "",
    objectives: "",
  });
  const [forecast, setForecast] = useState<{ rate: number; months: ForecastMonth[] } | null>(null);

  useEffect(() => {
    fetch("/api/business-plan")
      .then((res) => res.json())
      .then((data: { plan: Plan | null }) => {
        setPlan(data.plan);
        if (data.plan) setForm((f) => ({ ...f, projectName: data.plan!.projectName }));
      });
    fetch("/api/previsionnel")
      .then((res) => res.json())
      .then((data: { rate: number; months: ForecastMonth[] }) => setForecast(data));
  }, []);

  const generate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.projectName.trim() || !form.activity.trim() || !form.offer.trim() || !form.targetClients.trim()) {
      toast.error("Merci de compléter les champs requis");
      return;
    }
    setGenerating(true);
    const res = await fetch("/api/business-plan/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setGenerating(false);
    if (res.ok) {
      const data: { plan: Plan } = await res.json();
      setPlan(data.plan);
      setShowForm(false);
      toast.success("Business plan généré");
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Échec de la génération");
    }
  };

  const saveSection = async (key: keyof Plan, value: string) => {
    if (!plan) return;
    const res = await fetch("/api/business-plan", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });
    if (!res.ok) toast.error("Échec de l'enregistrement");
  };

  const startNewPlan = () => {
    if (plan) setForm((f) => ({ ...f, projectName: plan.projectName }));
    setShowForm(true);
  };

  const totals = forecast?.months.reduce(
    (acc, m) => ({ revenue: acc.revenue + m.revenue, expenses: acc.expenses + m.expenses }),
    { revenue: 0, expenses: 0 }
  ) ?? { revenue: 0, expenses: 0 };
  const rate = forecast?.rate ?? 0;
  const cotisations = totals.revenue * (rate / 100);
  const net = totals.revenue - totals.expenses - cotisations;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Business plan</h1>
          <p className="text-sm text-muted-foreground">
            Un business plan généré par l&apos;IA, avec votre prévisionnel financier intégré.
          </p>
        </div>
        {plan && !showForm && (
          <a href="/api/business-plan/pdf">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4" />
              PDF
            </Button>
          </a>
        )}
      </div>

      {plan === undefined ? (
        <p className="text-sm text-muted-foreground">Chargement...</p>
      ) : plan && !showForm ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Nom du projet</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={plan.projectName}
                onChange={(e) => setPlan({ ...plan, projectName: e.target.value })}
                onBlur={(e) => saveSection("projectName", e.target.value)}
              />
            </CardContent>
          </Card>

          {SECTIONS.map((section) => (
            <Card key={section.key}>
              <CardHeader>
                <CardTitle className="text-base">{section.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  rows={5}
                  value={plan[section.key]}
                  onChange={(e) => setPlan({ ...plan, [section.key]: e.target.value })}
                  onBlur={(e) => saveSection(section.key, e.target.value)}
                />
              </CardContent>
            </Card>
          ))}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Prévisionnel financier (12 mois)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-muted-foreground">Total CA prévu</p>
                  <p className="font-semibold">{formatEuro(totals.revenue)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total dépenses</p>
                  <p className="font-semibold">{formatEuro(totals.expenses)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cotisations estimées</p>
                  <p className="font-semibold">{formatEuro(cotisations)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Net estimé</p>
                  <p className="font-semibold text-primary">{formatEuro(net)}</p>
                </div>
              </div>
              <p className="pt-2 text-xs text-muted-foreground">
                Basé sur votre page{" "}
                <a href="/previsionnel" className="underline">
                  Prévisionnel
                </a>{" "}
                — modifiez-le là-bas pour mettre à jour ces chiffres.
              </p>
            </CardContent>
          </Card>

          <Button variant="outline" size="sm" onClick={startNewPlan}>
            <Sparkles className="h-4 w-4" />
            Générer un nouveau business plan
          </Button>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {plan ? "Générer un nouveau business plan" : "Créez votre business plan"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={generate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="projectName">Nom du projet</Label>
                <Input
                  id="projectName"
                  value={form.projectName}
                  onChange={(e) => setForm({ ...form, projectName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="activity">Activité</Label>
                <Textarea
                  id="activity"
                  placeholder="Ex: Création de sites web et identités visuelles pour petites entreprises"
                  rows={2}
                  value={form.activity}
                  onChange={(e) => setForm({ ...form, activity: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="offer">Offre / produits-services</Label>
                <Textarea
                  id="offer"
                  placeholder="Ex: Sites vitrines, refontes, formations à la prise en main"
                  rows={2}
                  value={form.offer}
                  onChange={(e) => setForm({ ...form, offer: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetClients">Clientèle cible</Label>
                <Textarea
                  id="targetClients"
                  placeholder="Ex: TPE et indépendants dans le secteur du bien-être et du commerce local"
                  rows={2}
                  value={form.targetClients}
                  onChange={(e) => setForm({ ...form, targetClients: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="objectives">Objectifs (optionnel)</Label>
                <Textarea
                  id="objectives"
                  placeholder="Ex: Atteindre 2000€ de CA mensuel d'ici 6 mois"
                  rows={2}
                  value={form.objectives}
                  onChange={(e) => setForm({ ...form, objectives: e.target.value })}
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
                      Générer mon business plan
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
