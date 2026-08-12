"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageSpinner } from "@/components/ui/page-spinner";
import { toast } from "sonner";
import { effectiveCotisationRate } from "@/lib/forecast-calc";

type UrssafPeriod = "MONTHLY" | "QUARTERLY";

type Declaration = {
  period: UrssafPeriod;
  declarationDay: number | null;
  periodLabel: string;
  revenue: number;
  amountDue: number;
  nextDeadline: string | null;
};

type Summary = {
  rate: number;
  acreEligible: boolean;
  revenue: { month: number; quarter: number; year: number };
  declaration: Declaration;
};

const URSSAF_PERIOD_LABEL: Record<UrssafPeriod, string> = {
  MONTHLY: "Mensuelle",
  QUARTERLY: "Trimestrielle",
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
  const [savingDeclaration, setSavingDeclaration] = useState(false);
  const [declarationDayInput, setDeclarationDayInput] = useState("");

  const load = () => {
    fetch("/api/cotisations")
      .then((res) => res.json())
      .then((data: Summary) => {
        setSummary(data);
        setRateInput(String(data.rate || ""));
        setDeclarationDayInput(data.declaration.declarationDay ? String(data.declaration.declarationDay) : "");
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
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

  const saveDeclarationPeriod = async (period: UrssafPeriod) => {
    const res = await fetch("/api/cotisations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urssafPeriod: period }),
    });
    if (res.ok) {
      load();
      toast.success("Périodicité mise à jour");
    } else {
      toast.error("Échec de la mise à jour");
    }
  };

  const saveDeclarationDay = async (e: React.FormEvent) => {
    e.preventDefault();
    const day = declarationDayInput ? parseInt(declarationDayInput, 10) : null;
    if (day !== null && (isNaN(day) || day < 1 || day > 28)) {
      toast.error("Entrez un jour entre 1 et 28");
      return;
    }
    setSavingDeclaration(true);
    const res = await fetch("/api/cotisations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urssafDeclarationDay: day }),
    });
    if (res.ok) {
      load();
      toast.success("Jour d'échéance mis à jour");
    } else {
      toast.error("Échec de la mise à jour");
    }
    setSavingDeclaration(false);
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

      {!loading && summary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Déclaration URSSAF</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end gap-4">
              <div className="space-y-2">
                <Label>Périodicité</Label>
                <Select
                  value={summary.declaration.period}
                  onValueChange={(v) => saveDeclarationPeriod(v as UrssafPeriod)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue>
                      {(value: UrssafPeriod) => URSSAF_PERIOD_LABEL[value]}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(URSSAF_PERIOD_LABEL).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <form onSubmit={saveDeclarationDay} className="flex items-end gap-2">
                <div className="space-y-2">
                  <Label htmlFor="declarationDay">Jour d&apos;échéance</Label>
                  <Input
                    id="declarationDay"
                    type="number"
                    min="1"
                    max="28"
                    className="w-24"
                    placeholder="Ex: 20"
                    value={declarationDayInput}
                    onChange={(e) => setDeclarationDayInput(e.target.value)}
                  />
                </div>
                <Button type="submit" size="sm" variant="outline" disabled={savingDeclaration}>
                  {savingDeclaration ? "..." : "Enregistrer"}
                </Button>
              </form>
            </div>
            <p className="text-xs text-muted-foreground">
              Le jour d&apos;échéance est celui indiqué sur votre compte URSSAF (entre 1 et 28).
              MIA ne le devine pas, il faut le renseigner vous-même.
            </p>

            <div className="rounded-md border bg-muted/40 p-3">
              <p className="text-sm font-medium">Déclaration {summary.declaration.periodLabel}</p>
              <div className="mt-2 grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">CA encaissé sur la période</p>
                  <p className="font-semibold">{formatEuro(summary.declaration.revenue)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Montant à déclarer</p>
                  <p className="font-semibold text-primary">{formatEuro(summary.declaration.amountDue)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Prochaine échéance</p>
                  <p className="font-semibold">
                    {summary.declaration.nextDeadline
                      ? new Date(summary.declaration.nextDeadline).toLocaleDateString("fr-FR")
                      : "Non configurée"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <PageSpinner />
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
