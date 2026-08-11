import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = {
  href: string;
  label: string;
  description: string;
  done: boolean;
};

export function OnboardingChecklist({
  hasProspect,
  hasPlan,
  hasCotisationRate,
  hasDocument,
}: {
  hasProspect: boolean;
  hasPlan: boolean;
  hasCotisationRate: boolean;
  hasDocument: boolean;
}) {
  const steps: Step[] = [
    {
      href: "/prospects",
      label: "Trouvez vos premiers clients",
      description: "Ajoutez un prospect et laissez l'IA vous aider à l'approcher.",
      done: hasProspect,
    },
    {
      href: "/plan-action",
      label: "Clarifiez votre plan d'action",
      description: "Un objectif, et l'IA vous propose des étapes concrètes.",
      done: hasPlan,
    },
    {
      href: "/cotisations",
      label: "Configurez votre taux de cotisation",
      description: "Pour estimer ce que vous devez mettre de côté.",
      done: hasCotisationRate,
    },
    {
      href: "/invoicing",
      label: "Créez votre premier devis ou facture",
      description: "Formalisez une proposition pour un client.",
      done: hasDocument,
    },
  ];

  if (steps.every((s) => s.done)) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Bien démarrer avec MIA</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {steps.map((step) => (
          <Link
            key={step.href}
            href={step.href}
            className="flex items-start gap-3 rounded-md p-2 transition-colors hover:bg-secondary/60"
          >
            {step.done ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            ) : (
              <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
            )}
            <span>
              <span
                className={cn(
                  "text-sm font-medium",
                  step.done && "text-muted-foreground line-through"
                )}
              >
                {step.label}
              </span>
              <span className="block text-xs text-muted-foreground">{step.description}</span>
            </span>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
