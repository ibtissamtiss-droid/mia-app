"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageSpinner } from "@/components/ui/page-spinner";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";

type BillingStatus = { plan: "FREE" | "PAID"; subscriptionStatus: string | null };

const FREE_FEATURES = [
  "Tâches, calendrier, notes",
  "Recherche de clients",
  "Devis & factures",
  "Cotisations & tarifs",
  "Plan d'action & recommandations",
  "Prévisionnel & business plan",
];

const PRO_FEATURES = [
  "Tout ce qu'il y a dans Gratuit",
  "Assistant IA",
  "Point du jour (résumé quotidien)",
  "Synchronisation bancaire",
  "Facturation électronique (Factur-X)",
];

export default function AbonnementPage() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <AbonnementContent />
    </Suspense>
  );
}

function AbonnementContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);

  useEffect(() => {
    fetch("/api/billing/status")
      .then((res) => res.json())
      .then((body: BillingStatus) => setStatus(body));
  }, []);

  useEffect(() => {
    if (searchParams.get("success")) toast.success("Abonnement activé, bienvenue dans MIA Pro !");
    if (searchParams.get("canceled")) toast("Paiement annulé.");
  }, [searchParams]);

  const upgrade = () => {
    setLoadingAction(true);
    fetch("/api/billing/checkout", { method: "POST" })
      .then(async (res) => {
        if (!res.ok) {
          toast.error(await res.text());
          return;
        }
        const body = (await res.json()) as { url: string };
        window.location.href = body.url;
      })
      .finally(() => setLoadingAction(false));
  };

  const manage = () => {
    setLoadingAction(true);
    fetch("/api/billing/portal", { method: "POST" })
      .then(async (res) => {
        if (!res.ok) {
          toast.error(await res.text());
          return;
        }
        const body = (await res.json()) as { url: string };
        window.location.href = body.url;
      })
      .finally(() => setLoadingAction(false));
  };

  if (!status) {
    return <PageSpinner />;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Abonnement</h1>
        <p className="text-sm text-muted-foreground">
          Formule actuelle : <Badge variant={status.plan === "PAID" ? "default" : "secondary"}>
            {status.plan === "PAID" ? "Pro" : "Gratuit"}
          </Badge>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gratuit</CardTitle>
            <p className="text-2xl font-semibold">0€</p>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {FREE_FEATURES.map((f) => (
              <div key={f} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <span>{f}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-base">Pro</CardTitle>
            <p className="text-2xl font-semibold">
              9,99€<span className="text-sm font-normal text-muted-foreground">/mois</span>
            </p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {PRO_FEATURES.map((f) => (
              <div key={f} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{f}</span>
              </div>
            ))}
            {status.plan === "FREE" ? (
              <Button className="w-full" onClick={upgrade} disabled={loadingAction}>
                {loadingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Passer Pro
              </Button>
            ) : (
              <Button className="w-full" variant="outline" onClick={manage} disabled={loadingAction}>
                {loadingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Gérer mon abonnement
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
