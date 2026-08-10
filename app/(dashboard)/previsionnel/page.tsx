"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

type MonthEntry = { month: string; revenue: number; expenses: number };

function formatEuro(value: number) {
  return `${value.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, 1));
  const label = date.toLocaleDateString("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function PrevisionnelPage() {
  const [months, setMonths] = useState<MonthEntry[] | null>(null);
  const [rate, setRate] = useState(0);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/previsionnel")
      .then((res) => res.json())
      .then((data: { rate: number; months: MonthEntry[] }) => {
        setRate(data.rate);
        setMonths(data.months);
      });
  }, []);

  const updateLocal = (month: string, field: "revenue" | "expenses", value: number) => {
    setMonths((prev) =>
      prev ? prev.map((m) => (m.month === month ? { ...m, [field]: value } : m)) : prev
    );
  };

  const save = async (entry: MonthEntry) => {
    setSaving(entry.month);
    const res = await fetch("/api/previsionnel", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
    setSaving(null);
    if (!res.ok) toast.error("Échec de l'enregistrement");
  };

  const totals = months?.reduce(
    (acc, m) => ({
      revenue: acc.revenue + m.revenue,
      expenses: acc.expenses + m.expenses,
    }),
    { revenue: 0, expenses: 0 }
  ) ?? { revenue: 0, expenses: 0 };
  const totalCotisations = totals.revenue * (rate / 100);
  const totalNet = totals.revenue - totals.expenses - totalCotisations;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Prévisionnel financier</h1>
        <p className="text-sm text-muted-foreground">
          Estimez votre chiffre d&apos;affaires et vos dépenses sur les 12 prochains mois.
        </p>
      </div>

      {rate === 0 && (
        <p className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
          Configurez votre taux de cotisation dans la page{" "}
          <a href="/cotisations" className="underline">
            Cotisations
          </a>{" "}
          pour voir le net estimé après charges sociales.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total CA prévu</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{formatEuro(totals.revenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total dépenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{formatEuro(totals.expenses)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Cotisations estimées</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{formatEuro(totalCotisations)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Net estimé</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-primary">{formatEuro(totalNet)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Détail mensuel</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {months === null ? (
            <p className="p-6 text-sm text-muted-foreground">Chargement...</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Mois</th>
                  <th className="px-4 py-2 font-medium">CA prévu</th>
                  <th className="px-4 py-2 font-medium">Dépenses prévues</th>
                  <th className="px-4 py-2 font-medium">Cotisations</th>
                  <th className="px-4 py-2 font-medium">Net après charges</th>
                </tr>
              </thead>
              <tbody>
                {months.map((m) => {
                  const cotisations = m.revenue * (rate / 100);
                  const net = m.revenue - m.expenses - cotisations;
                  return (
                    <tr key={m.month} className="border-b last:border-0">
                      <td className="whitespace-nowrap px-4 py-2 text-muted-foreground">
                        {monthLabel(m.month)}
                      </td>
                      <td className="px-4 py-2">
                        <Input
                          type="number"
                          min="0"
                          step="10"
                          className="w-28"
                          value={m.revenue || ""}
                          onChange={(e) => updateLocal(m.month, "revenue", parseFloat(e.target.value) || 0)}
                          onBlur={() => save(months.find((x) => x.month === m.month)!)}
                          disabled={saving === m.month}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Input
                          type="number"
                          min="0"
                          step="10"
                          className="w-28"
                          value={m.expenses || ""}
                          onChange={(e) => updateLocal(m.month, "expenses", parseFloat(e.target.value) || 0)}
                          onBlur={() => save(months.find((x) => x.month === m.month)!)}
                          disabled={saving === m.month}
                        />
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-muted-foreground">
                        {formatEuro(cotisations)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 font-medium">{formatEuro(net)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Ce prévisionnel est une estimation basée sur les montants que vous saisissez ; il ne
        remplace pas un prévisionnel financier établi avec un expert-comptable.
      </p>
    </div>
  );
}
