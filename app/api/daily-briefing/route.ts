import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDailyBriefing, regenerateDailyBriefing } from "@/lib/ai/daily-briefing";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const content = await getDailyBriefing(session.user.id);
  return NextResponse.json({ content });
}

export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { allowed } = await checkRateLimit(`daily-briefing:${session.user.id}`, 10, 60 * 60 * 1000);
  if (!allowed) return rateLimitResponse();

  const content = await regenerateDailyBriefing(session.user.id);
  return NextResponse.json({ content });
}
