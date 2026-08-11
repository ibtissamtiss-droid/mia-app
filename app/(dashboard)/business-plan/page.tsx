"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Download, Loader2, Sparkles } from "lucide-react";
import { computeForecastTotals, effectiveCotisationRate, type ForecastMonth } from "@/lib/forecast-calc";
import { LineItemsCard, formatEuro, type LineItem } from "@/components/business-plan/line-items-card";
import { ProductMarginsCard, type ProductRow } from "@/components/business-plan/product-margins-card";

type Plan = {
  id: string;
  projectName: string;
  summary: string;
  presentation: string;
  offer: string;
  market: string;
  strategy: string;
};

type Financials = {
  startupCosts: LineItem[];
  financingSources: LineItem[];
  monthlyCharges: LineItem[];
  productMargins: ProductRow[];
  rate: number;
  acreEligible: boolean;
};

const SECTIONS: { key: keyof Omit<Plan, "id" | "projectName">; label: string }[] = [
  { key: "summary", label: "Résumé" },
  { key: "presentation", label: "Présentation du projet" },
  { key: "offer", label: "L'offre" },
  { key: "market", label: "Marché cible et clientèle" },
  { key: "strategy", label: "Stratégie commerciale" },
];

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
  const [financials, setFinancials] = useState<Financials | null>(null);

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
    fetch("/api/business-plan/financials")
      .then((res) => res.json())
      .then((data: Financials) => setFinancials(data));
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

  const saveFinancials = async (section: keyof Pick<
    Financials,
    "startupCosts" | "financingSources" | "monthlyCharges" | "productMargins"
  >, items: LineItem[] | ProductRow[]) => {
    const res = await fetch("/api/business-plan/financials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section, items }),
    });
    if (!res.ok) {
      toast.error("Échec de l'enregistrement");
      return;
    }
    const data: { items: (LineItem | ProductRow)[] } = await res.json();
    setFinancials((prev) => (prev ? { ...prev, [section]: data.items } : prev));
  };

  const rate = forecast?.rate ?? 0;
  const { cotisations, net, ...totals } = computeForecastTotals(forecast?.months ?? [], rate);

  const totalStartupCosts = (financials?.startupCosts ?? []).reduce((s, i) => s + (i.amount || 0), 0);
  const totalFinancing = (financials?.financingSources ?? []).reduce((s, i) => s + (i.amount || 0), 0);
  const totalMonthlyCharges = (financials?.monthlyCharges ?? []).reduce((s, i) => s + (i.amount || 0), 0);
  const monthlyRevenue = (financials?.productMargins ?? []).reduce(
    (s, p) => s + p.unitPrice * p.monthlyVolume,
    0
  );
  const monthlyMargin = (financials?.productMargins ?? []).reduce(
    (s, p) => s + (p.unitPrice - p.unitCost) * p.monthlyVolume,
    0
  );
  const financingGap = totalStartupCosts - totalFinancing;
  const effectiveRate = financials ? effectiveCotisationRate(financials.rate, financials.acreEligible) : 0;
  const monthlyCotisations = monthlyRevenue * (effectiveRate / 100);
  const monthlyResult = monthlyMargin - totalMonthlyCharges - monthlyCotisations;
  const breakevenMonths =
    financingGap > 0 && monthlyResult > 0 ? Math.ceil(financingGap / monthlyResult) : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Business plan</h1>
          <p className="text-sm text-muted-foreground">
            Un business plan généré par l&apos;IA, avec votre chiffrage financier intégré.
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
        <Tabs defaultValue="presentation">
          <TabsList>
            <TabsTrigger value="presentation">Présentation</TabsTrigger>
            <TabsTrigger value="chiffrage">Chiffrage du projet</TabsTrigger>
          </TabsList>

          <TabsContent value="presentation" className="space-y-6 pt-4">
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

            <Button variant="outline" size="sm" onClick={startNewPlan}>
              <Sparkles className="h-4 w-4" />
              Générer un nouveau business plan
            </Button>
          </TabsContent>

          <TabsContent value="chiffrage" className="space-y-6 pt-4">
            {!financials ? (
              <p className="text-sm text-muted-foreground">Chargement...</p>
            ) : (
              <>
                <LineItemsCard
                  title="Besoins de démarrage"
                  description="Tout ce qu'il faut pour lancer votre activité : matériel, stock, dépôt de garantie, frais d'immatriculation..."
                  labelPlaceholder="Ex: Ordinateur portable"
                  items={financials.startupCosts}
                  onChange={(items) => setFinancials({ ...financials, startupCosts: items })}
                  onCommit={(items) => saveFinancials("startupCosts", items)}
                  totalLabel="Total des besoins"
                />

                <LineItemsCard
                  title="Plan de financement"
                  description="D'où vient l'argent pour couvrir vos besoins de démarrage : épargne, prêt, aides..."
                  labelPlaceholder="Ex: Épargne personnelle"
                  items={financials.financingSources}
                  onChange={(items) => setFinancials({ ...financials, financingSources: items })}
                  onCommit={(items) => saveFinancials("financingSources", items)}
                  totalLabel="Total du financement"
                />

                <Card className={financingGap > 0 ? "border-orange-300" : "border-primary/40"}>
                  <CardContent className="flex items-center justify-between py-4">
                    <span className="text-sm font-medium">
                      {financingGap > 0 ? "Reste à financer" : "Financement suffisant"}
                    </span>
                    <span className={financingGap > 0 ? "font-semibold text-orange-600" : "font-semibold text-primary"}>
                      {formatEuro(Math.abs(financingGap))}
                    </span>
                  </CardContent>
                </Card>

                <LineItemsCard
                  title="Charges mensuelles détaillées"
                  description="Vos charges fixes récurrentes : loyer, assurance, télécom, comptable..."
                  labelPlaceholder="Ex: Assurance professionnelle"
                  items={financials.monthlyCharges}
                  onChange={(items) => setFinancials({ ...financials, monthlyCharges: items })}
                  onCommit={(items) => saveFinancials("monthlyCharges", items)}
                  totalLabel="Total des charges mensuelles"
                />

                <ProductMarginsCard
                  items={financials.productMargins}
                  onChange={(items) => setFinancials({ ...financials, productMargins: items })}
                  onCommit={(items) => saveFinancials("productMargins", items)}
                />

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Résultats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs text-muted-foreground">CA mensuel estimé</p>
                        <p className="font-semibold">{formatEuro(monthlyRevenue)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Charges mensuelles</p>
                        <p className="font-semibold">{formatEuro(totalMonthlyCharges)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Cotisations estimées{financials.acreEligible ? " (ACRE)" : ""}
                        </p>
                        <p className="font-semibold">{formatEuro(monthlyCotisations)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Résultat mensuel net</p>
                        <p className={monthlyResult >= 0 ? "font-semibold text-primary" : "font-semibold text-orange-600"}>
                          {formatEuro(monthlyResult)}
                        </p>
                      </div>
                    </div>
                    <p className="pt-2 text-xs text-muted-foreground">
                      {breakevenMonths !== null
                        ? `Au rythme actuel, votre financement de démarrage serait couvert en environ ${breakevenMonths} mois.`
                        : financingGap <= 0
                          ? "Votre financement de démarrage est déjà couvert."
                          : "Complétez vos produits/services et charges pour estimer le seuil de rentabilité."}
                    </p>
                  </CardContent>
                </Card>

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

                <p className="text-xs text-muted-foreground">
                  Ce chiffrage est une estimation basée sur les montants que vous saisissez ; il ne
                  remplace pas un prévisionnel établi avec un expert-comptable.
                </p>
              </>
            )}
          </TabsContent>
        </Tabs>
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
