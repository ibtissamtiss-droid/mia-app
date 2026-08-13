import { prisma } from "@/lib/db";

export async function getUserPlan(userId: string): Promise<"FREE" | "PAID"> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true } });
  return user?.plan ?? "FREE";
}

export async function isPaidUser(userId: string): Promise<boolean> {
  return (await getUserPlan(userId)) === "PAID";
}
