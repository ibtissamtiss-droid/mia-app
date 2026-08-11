"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { effectiveCotisationRate } from "@/lib/forecast-calc";

type Summary = {
  rate: number;
  acreEligible: boolean;
  revenue: { month: number; quarter: number; year: number };
};

const PERIODS: { key: keyof Summary["revenue"]; label: string }[] = [
  { key: "month", label: "Ce mois-ci" },
  { key: "quarter", label: "Ce trimestre" },
  { key: "year", label: "Cette année" },
];

function formatEuro(value: number) {
  return `${value.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

export default function CotisationsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [rateInput, setRateInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingAcre, setSavingAcre] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/cotisations")
      .then((res) => res.json())
      .then((data: Summary) => {
        if (cancelled) return;
        setSummary(data);
        setRateInput(String(data.rate || ""));
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const saveRate = async (e: React.FormEvent) => {
    e.preventDefault();
    const rate = parseFloat(rateInput);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast.error("Entrez un taux entre 0 et 100");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/cotisations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rate }),
    });
    setSaving(false);
    if (res.ok) {
      setSummary((prev) => (prev ? { ...prev, rate } : prev));
      toast.success("Taux de cotisation mis à jour");
    } else {
      toast.error("Échec de la mise à jour");
    }
  };

  const saveAcre = async (checked: boolean) => {
    setSavingAcre(true);
    const res = await fetch("/api/cotisations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acreEligible: checked }),
    });
    setSavingAcre(false);
    if (res.ok) {
      setSummary((prev) => (prev ? { ...prev, acreEligible: checked } : prev));
      toast.success("Préférence ACRE mise à jour");
    } else {
      toast.error("Échec de la mise à jour");
    }
  };

  const effectiveRate = summary ? effectiveCotisationRate(summary.rate, summary.acreEligible) : 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Cotisations</h1>
        <p className="text-sm text-muted-foreground">
          Estimation de vos cotisations sociales à partir de vos factures payées.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Taux de cotisation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Indiquez votre taux de cotisations sociales (auto-entrepreneur), par exemple 21,1%
            pour une activité de prestation de services (BNC).
          </p>
          <form onSubmit={saveRate} className="flex items-end gap-2">
            <div className="space-y-2">
              <Label htmlFor="rate">Taux (%)</Label>
              <Input
                id="rate"
                type="number"
                min="0"
                max="100"
                step="0.1"
                className="w-32"
                value={rateInput}
                onChange={(e) => setRateInput(e.target.value)}
              />
            </div>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "..." : "Enregistrer"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {!loading && summary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">ACRE</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="flex cursor-pointer items-start gap-3">
              <Checkbox
                checked={summary.acreEligible}
                onCheckedChange={(checked) => saveAcre(checked === true)}
                disabled={savingAcre}
                className="mt-0.5"
              />
              <span className="text-sm">
                <span className="font-medium">Je bénéficie de l&apos;ACRE</span>
                <span className="block text-xs text-muted-foreground">
                  L&apos;ACRE réduit vos cotisations sociales de moitié pendant votre 1ère année
                  d&apos;activité, sous conditions d&apos;éligibilité. Vérifiez votre situation
                  auprès de l&apos;URSSAF.
                </span>
              </span>
            </label>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Chargement...</p>
      ) : summary && summary.rate > 0 ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {PERIODS.map((period) => {
            const revenue = summary.revenue[period.key];
            const cotisations = revenue * (effectiveRate / 100);
            return (
              <Card key={period.key}>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">{period.label}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <p className="text-xs text-muted-foreground">CA encaissé</p>
                  <p className="text-lg font-semibold">{formatEuro(revenue)}</p>
                  <p className="pt-2 text-xs text-muted-foreground">Cotisations estimées</p>
                  <p className="text-lg font-semibold text-primary">{formatEuro(cotisations)}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Indiquez votre taux de cotisation ci-dessus pour voir vos estimations.
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        Ces montants sont une estimation indicative basée sur vos factures marquées « Payé ».
        Ils ne remplacent pas votre déclaration officielle auprès de l&apos;URSSAF.
      </p>
    </div>
  );
}
