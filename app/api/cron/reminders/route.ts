import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resend, EMAIL_FROM } from "@/lib/email/resend";
import { buildReminderDigestHtml } from "@/lib/email/reminder-digest";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const appUrl = new URL(req.url).origin;
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const users = await prisma.user.findMany({ select: { id: true, email: true, name: true } });

  let sent = 0;

  for (const user of users) {
    const [overdueTasks, dueTodayTasks, todayEvents] = await Promise.all([
      prisma.task.findMany({
        where: { userId: user.id, status: { not: "DONE" }, dueDate: { lt: startOfToday } },
        select: { title: true, dueDate: true },
        orderBy: { dueDate: "asc" },
      }),
      prisma.task.findMany({
        where: {
          userId: user.id,
          status: { not: "DONE" },
          dueDate: { gte: startOfToday, lte: endOfToday },
        },
        select: { title: true, dueDate: true },
        orderBy: { dueDate: "asc" },
      }),
      prisma.event.findMany({
        where: { userId: user.id, startTime: { gte: startOfToday, lte: endOfToday } },
        select: { title: true, startTime: true },
        orderBy: { startTime: "asc" },
      }),
    ]);

    if (overdueTasks.length === 0 && dueTodayTasks.length === 0 && todayEvents.length === 0) {
      continue;
    }

    const html = buildReminderDigestHtml({
      userName: user.name,
      overdueTasks,
      dueTodayTasks,
      todayEvents,
      appUrl,
    });

    await resend.emails.send({
      from: EMAIL_FROM,
      to: user.email,
      subject: "Votre récapitulatif MIA du jour",
      html,
    });
    sent++;
  }

  return NextResponse.json({ ok: true, usersChecked: users.length, emailsSent: sent });
}
