"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageSpinner } from "@/components/ui/page-spinner";
import { computeRates, type PricingSettings as Settings } from "@/lib/pricing";

function formatEuro(value: number) {
  return `${value.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

export default function TarifsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [cotisationRate, setCotisationRate] = useState(0);

  useEffect(() => {
    fetch("/api/pricing")
      .then((res) => res.json())
      .then((data: { settings: Settings; cotisationRate: number }) => {
        setSettings(data.settings);
        setCotisationRate(data.cotisationRate);
      });
  }, []);

  const update = (field: keyof Settings, value: number) => {
    setSettings((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const save = async (field: keyof Settings, value: number) => {
    const current = settings ? { ...settings, [field]: value } : null;
    if (!current) return;
    await fetch("/api/pricing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(current),
    });
  };

  const results = settings ? computeRates(settings, cotisationRate) : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Calcul des tarifs</h1>
        <p className="text-sm text-muted-foreground">
          À partir du revenu net que vous visez, calculez le tarif journalier (TJM) et le taux
          horaire à pratiquer.
        </p>
      </div>

      {settings === null ? (
        <PageSpinner />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Vos objectifs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="targetNetIncome">Revenu net mensuel visé (€)</Label>
                <Input
                  id="targetNetIncome"
                  type="number"
                  min="0"
                  step="50"
                  value={settings.targetNetIncome || ""}
                  onChange={(e) => update("targetNetIncome", parseFloat(e.target.value) || 0)}
                  onBlur={(e) => save("targetNetIncome", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="workingDaysPerMonth">Jours facturables / mois</Label>
                  <Input
                    id="workingDaysPerMonth"
                    type="number"
                    min="0.1"
                    step="1"
                    value={settings.workingDaysPerMonth || ""}
                    onChange={(e) => update("workingDaysPerMonth", parseFloat(e.target.value) || 0)}
                    onBlur={(e) => save("workingDaysPerMonth", parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hoursPerDay">Heures facturables / jour</Label>
                  <Input
                    id="hoursPerDay"
                    type="number"
                    min="0.1"
                    step="0.5"
                    value={settings.hoursPerDay || ""}
                    onChange={(e) => update("hoursPerDay", parseFloat(e.target.value) || 0)}
                    onBlur={(e) => save("hoursPerDay", parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthlyExpenses">Charges professionnelles mensuelles (€)</Label>
                <Input
                  id="monthlyExpenses"
                  type="number"
                  min="0"
                  step="10"
                  value={settings.monthlyExpenses || ""}
                  onChange={(e) => update("monthlyExpenses", parseFloat(e.target.value) || 0)}
                  onBlur={(e) => save("monthlyExpenses", parseFloat(e.target.value) || 0)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Taux de cotisation utilisé : {cotisationRate > 0 ? `${cotisationRate}%` : "non configuré"} —{" "}
                <a href="/cotisations" className="underline">
                  modifier dans Cotisations
                </a>
                .
              </p>
            </CardContent>
          </Card>

          {results && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">
                    Tarif journalier (TJM)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold text-primary">{formatEuro(results.dailyRate)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">Taux horaire</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold text-primary">{formatEuro(results.hourlyRate)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">
                    CA brut mensuel nécessaire
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold">{formatEuro(results.grossRevenue)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">
                    Cotisations estimées incluses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold">{formatEuro(results.cotisations)}</p>
                </CardContent>
              </Card>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Ce calcul est une estimation indicative pour vous aider à fixer vos tarifs ; il ne
            tient pas compte de la concurrence, du marché ou de la valeur perçue de votre offre.
          </p>
        </>
      )}
    </div>
  );
}
