import { auth } from "@/auth";
import { createBillingPortalSession } from "@/lib/stripe";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return new Response("Non authentifié", { status: 401 });

  try {
    const origin = new URL(req.url).origin;
    const url = await createBillingPortalSession(session.user.id, origin);
    return Response.json({ url });
  } catch (err) {
    return new Response(err instanceof Error ? err.message : "Erreur", { status: 502 });
  }
}
