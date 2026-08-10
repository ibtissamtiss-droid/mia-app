import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const [openTasks, todayEvents, recentNotes] = await Promise.all([
    prisma.task.findMany({
      where: { userId, status: { not: "DONE" } },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    prisma.event.findMany({
      where: { userId, startTime: { gte: now, lte: endOfDay } },
      orderBy: { startTime: "asc" },
    }),
    prisma.note.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 3,
    }),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Bonjour{session?.user?.name ? `, ${session.user.name}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground">Voici un aperçu de votre journée.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tâches en cours</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {openTasks.length === 0 && (
              <p className="text-sm text-muted-foreground">Rien en attente. Bien joué.</p>
            )}
            {openTasks.map((t) => (
              <div key={t.id} className="flex items-center justify-between text-sm">
                <span className="truncate">{t.title}</span>
                <Badge variant="outline">{t.priority}</Badge>
              </div>
            ))}
            <Link href="/tasks" className="block text-xs text-muted-foreground underline underline-offset-4">
              Voir toutes les tâches
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aujourd&apos;hui</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {todayEvents.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucun événement aujourd&apos;hui.</p>
            )}
            {todayEvents.map((e) => (
              <div key={e.id} className="text-sm">
                <span className="font-medium">
                  {new Date(e.startTime).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>{" "}
                — {e.title}
              </div>
            ))}
            <Link href="/calendar" className="block text-xs text-muted-foreground underline underline-offset-4">
              Voir le calendrier
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes récentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentNotes.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucune note pour le moment.</p>
            )}
            {recentNotes.map((n) => (
              <div key={n.id} className="truncate text-sm">
                {n.title}
              </div>
            ))}
            <Link href="/notes" className="block text-xs text-muted-foreground underline underline-offset-4">
              Voir toutes les notes
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
