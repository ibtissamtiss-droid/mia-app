"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageSpinner } from "@/components/ui/page-spinner";
import { Sparkles } from "lucide-react";

export function PaidFeatureGate({
  feature,
  children,
}: {
  feature: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [plan, setPlan] = useState<"FREE" | "PAID" | null>(null);

  useEffect(() => {
    fetch("/api/billing/status")
      .then((res) => res.json())
      .then((body: { plan: "FREE" | "PAID" }) => setPlan(body.plan));
  }, []);

  if (plan === null) {
    return <PageSpinner />;
  }

  if (plan === "FREE") {
    return (
      <div className="mx-auto max-w-md">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <Sparkles className="h-10 w-10 text-primary" />
            <div>
              <p className="font-medium">{feature} fait partie de la formule Pro</p>
              <p className="text-sm text-muted-foreground">
                Passez à MIA Pro (9,99€/mois) pour débloquer cette fonctionnalité.
              </p>
            </div>
            <Button onClick={() => router.push("/abonnement")}>Voir la formule Pro</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
