import { auth } from "@/auth";
import { createCheckoutSession } from "@/lib/stripe";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return new Response("Non authentifié", { status: 401 });

  try {
    const origin = new URL(req.url).origin;
    const url = await createCheckoutSession(session.user.id, session.user.email, origin);
    return Response.json({ url });
  } catch (err) {
    return new Response(err instanceof Error ? err.message : "Erreur de paiement", { status: 502 });
  }
}
