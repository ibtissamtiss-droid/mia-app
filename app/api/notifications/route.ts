import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const userId = session.user.id;
  const now = new Date();
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  const soon = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const [overdueTasks, dueTodayTasks, upcomingEvents] = await Promise.all([
    prisma.task.findMany({
      where: { userId, status: { not: "DONE" }, dueDate: { lt: now } },
      select: { id: true, title: true, dueDate: true },
      orderBy: { dueDate: "asc" },
      take: 10,
    }),
    prisma.task.findMany({
      where: {
        userId,
        status: { not: "DONE" },
        dueDate: { gte: now, lte: endOfToday },
      },
      select: { id: true, title: true, dueDate: true },
      orderBy: { dueDate: "asc" },
      take: 10,
    }),
    prisma.event.findMany({
      where: { userId, startTime: { gte: now, lte: soon } },
      select: { id: true, title: true, startTime: true },
      orderBy: { startTime: "asc" },
      take: 10,
    }),
  ]);

  return NextResponse.json({ overdueTasks, dueTodayTasks, upcomingEvents });
}
