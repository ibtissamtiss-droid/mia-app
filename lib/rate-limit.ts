import { prisma } from "@/lib/db";

export async function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = new Date();
  const existing = await prisma.rateLimitBucket.findUnique({ where: { key } });

  if (!existing || now.getTime() - existing.windowStart.getTime() > windowMs) {
    await prisma.rateLimitBucket.upsert({
      where: { key },
      create: { key, windowStart: now, count: 1 },
      update: { windowStart: now, count: 1 },
    });
    return { allowed: true };
  }

  if (existing.count >= limit) {
    return { allowed: false };
  }

  await prisma.rateLimitBucket.update({ where: { key }, data: { count: { increment: 1 } } });
  return { allowed: true };
}

export function getClientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : "unknown";
}

export function rateLimitResponse() {
  return Response.json(
    { error: "Trop de requêtes, réessayez dans quelques minutes." },
    { status: 429 }
  );
}
