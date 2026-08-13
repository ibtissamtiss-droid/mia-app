import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) return new Response("Non authentifié", { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, subscriptionStatus: true },
  });

  return Response.json({
    plan: user?.plan ?? "FREE",
    subscriptionStatus: user?.subscriptionStatus ?? null,
  });
}
