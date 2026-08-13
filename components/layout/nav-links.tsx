"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  CheckSquare,
  CalendarDays,
  NotebookText,
  MessageSquare,
  LayoutDashboard,
  Settings,
  Receipt,
  PiggyBank,
  Target,
  TrendingUp,
  Briefcase,
  Users,
  Lightbulb,
  Calculator,
  Landmark,
  Sparkles,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/tasks", label: "Tâches", icon: CheckSquare },
  { href: "/calendar", label: "Calendrier", icon: CalendarDays },
  { href: "/prospects", label: "Recherche de clients", icon: Users },
  { href: "/notes", label: "Notes", icon: NotebookText },
  { href: "/invoicing", label: "Devis & Factures", icon: Receipt },
  { href: "/banque", label: "Banque", icon: Landmark },
  { href: "/plan-action", label: "Plan d'action", icon: Target },
  { href: "/recommandations", label: "Recommandations", icon: Lightbulb },
  { href: "/cotisations", label: "Cotisations", icon: PiggyBank },
  { href: "/tarifs", label: "Calcul des tarifs", icon: Calculator },
  { href: "/previsionnel", label: "Prévisionnel", icon: TrendingUp },
  { href: "/business-plan", label: "Business plan", icon: Briefcase },
  { href: "/chat", label: "Assistant IA", icon: MessageSquare },
];

export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-1 border-t p-3">
        <Link
          href="/abonnement"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            pathname.startsWith("/abonnement")
              ? "bg-secondary text-secondary-foreground"
              : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
          )}
        >
          <Sparkles className="h-4 w-4" />
          Abonnement
        </Link>
        <Link
          href="/settings"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            pathname.startsWith("/settings")
              ? "bg-secondary text-secondary-foreground"
              : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
          )}
        >
          <Settings className="h-4 w-4" />
          Paramètres
        </Link>
      </div>
    </>
  );
}
