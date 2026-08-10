import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  getValidAccessToken,
  listGoogleEvents,
  insertGoogleEvent,
} from "@/lib/google/client";

export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const account = await prisma.googleAccount.findUnique({ where: { userId: session.user.id } });
  if (!account) {
    return NextResponse.json({ error: "Google Calendar non connecté" }, { status: 400 });
  }

  const accessToken = await getValidAccessToken(account);
  if (accessToken !== account.accessToken) {
    await prisma.googleAccount.update({
      where: { userId: session.user.id },
      data: { accessToken, expiryDate: new Date(Date.now() + 55 * 60 * 1000) },
    });
  }

  const now = new Date();
  const timeMin = new Date(now);
  timeMin.setMonth(timeMin.getMonth() - 3);
  const timeMax = new Date(now);
  timeMax.setMonth(timeMax.getMonth() + 6);

  let imported = 0;
  let exported = 0;

  const googleEvents = await listGoogleEvents(accessToken, timeMin, timeMax);
  for (const event of googleEvents) {
    if (event.status === "cancelled") continue;
    const start = event.start?.dateTime ?? event.start?.date;
    const end = event.end?.dateTime ?? event.end?.date;
    if (!start || !end || !event.summary) continue;

    await prisma.event.upsert({
      where: { googleEventId: event.id },
      create: {
        userId: session.user.id,
        title: event.summary,
        description: event.description ?? null,
        location: event.location ?? null,
        startTime: new Date(start),
        endTime: new Date(end),
        googleEventId: event.id,
      },
      update: {
        title: event.summary,
        description: event.description ?? null,
        location: event.location ?? null,
        startTime: new Date(start),
        endTime: new Date(end),
      },
    });
    imported++;
  }

  const localOnlyEvents = await prisma.event.findMany({
    where: { userId: session.user.id, googleEventId: null },
  });
  for (const event of localOnlyEvents) {
    const created = await insertGoogleEvent(accessToken, {
      title: event.title,
      description: event.description,
      location: event.location,
      startTime: event.startTime,
      endTime: event.endTime,
    });
    await prisma.event.update({
      where: { id: event.id },
      data: { googleEventId: created.id },
    });
    exported++;
  }

  return NextResponse.json({ imported, exported });
}
