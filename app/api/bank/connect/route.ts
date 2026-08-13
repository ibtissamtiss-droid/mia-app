import { auth } from "@/auth";
import { getOrCreateBridgeUser, createConnectSession } from "@/lib/bridge";
import { isPaidUser } from "@/lib/plan";

export async function POST() {
  const session = await auth();
  if (!session?.user?.email) return new Response("Non authentifié", { status: 401 });
  if (!(await isPaidUser(session.user.id))) {
    return new Response("La synchronisation bancaire fait partie de la formule Pro", { status: 402 });
  }

  try {
    const bridgeUserUuid = await getOrCreateBridgeUser(session.user.id);
    const connectSession = await createConnectSession(bridgeUserUuid, session.user.email);
    return Response.json({ url: connectSession.url });
  } catch (err) {
    return new Response(err instanceof Error ? err.message : "Erreur de connexion à Bridge", { status: 502 });
  }
}
