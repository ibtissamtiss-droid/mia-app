import { auth } from "@/auth";
import { getOrCreateBridgeUser, createConnectSession } from "@/lib/bridge";

export async function POST() {
  const session = await auth();
  if (!session?.user?.email) return new Response("Non authentifié", { status: 401 });

  try {
    const bridgeUserUuid = await getOrCreateBridgeUser(session.user.id);
    const connectSession = await createConnectSession(bridgeUserUuid, session.user.email);
    return Response.json({ url: connectSession.url });
  } catch (err) {
    return new Response(err instanceof Error ? err.message : "Erreur de connexion à Bridge", { status: 502 });
  }
}
