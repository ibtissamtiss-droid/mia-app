/**
 * Client for the Bridge (bridgeapi.io) banking aggregation API.
 * https://docs.bridgeapi.io — sandbox only for now (see .env).
 */

import { prisma } from "@/lib/db";

const ENDPOINT = process.env.BRIDGE_ENDPOINT || "https://api.bridgeapi.io";
const BRIDGE_VERSION = "2025-01-15";

function appHeaders() {
  const clientId = process.env.BRIDGE_CLIENT_ID;
  const clientSecret = process.env.BRIDGE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("BRIDGE_CLIENT_ID / BRIDGE_CLIENT_SECRET manquants");
  }
  return {
    "Bridge-Version": BRIDGE_VERSION,
    "Content-Type": "application/json",
    Accept: "application/json",
    "Client-Id": clientId,
    "Client-Secret": clientSecret,
  };
}

async function ensureOk(res: Response, action: string) {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Bridge — échec ${action} (HTTP ${res.status})${text ? `: ${text}` : ""}`);
  }
}

/**
 * Returns the Bridge user uuid for this MIA user, creating it on Bridge's
 * side on first use. Our own User.bridgeUserUuid is the source of truth for
 * idempotency — we never re-check with Bridge.
 */
export async function getOrCreateBridgeUser(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { bridgeUserUuid: true } });
  if (user?.bridgeUserUuid) return user.bridgeUserUuid;

  const res = await fetch(`${ENDPOINT}/v3/aggregation/users`, {
    method: "POST",
    headers: appHeaders(),
    body: JSON.stringify({ external_user_id: userId }),
  });
  await ensureOk(res, "création utilisateur");
  const body = (await res.json()) as { uuid: string };

  await prisma.user.update({ where: { id: userId }, data: { bridgeUserUuid: body.uuid } });
  return body.uuid;
}

async function getAccessToken(bridgeUserUuid: string): Promise<string> {
  const res = await fetch(`${ENDPOINT}/v3/aggregation/authorization/token`, {
    method: "POST",
    headers: appHeaders(),
    body: JSON.stringify({ user_uuid: bridgeUserUuid }),
  });
  await ensureOk(res, "authentification");
  const body = (await res.json()) as { access_token: string };
  return body.access_token;
}

export async function createConnectSession(
  bridgeUserUuid: string,
  userEmail: string
): Promise<{ id: string; url: string }> {
  const accessToken = await getAccessToken(bridgeUserUuid);
  const res = await fetch(`${ENDPOINT}/v3/aggregation/connect-sessions`, {
    method: "POST",
    headers: { ...appHeaders(), Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ user_email: userEmail, account_types: "all" }),
  });
  await ensureOk(res, "création de la session de connexion");
  return (await res.json()) as { id: string; url: string };
}

export type BridgeAccount = {
  id: number;
  item_id: number;
  name: string;
  type: string;
  balance: number;
  currency_code: string;
  iban: string | null;
};

export type BridgeTransaction = {
  id: number;
  account_id: number;
  clean_description: string;
  amount: number;
  date: string;
  currency_code: string;
};

async function fetchAllPages<T>(url: string, accessToken: string): Promise<T[]> {
  const results: T[] = [];
  let next: string | null = url;
  let pages = 0;
  while (next && pages < 20) {
    const res: Response = await fetch(next, {
      headers: { ...appHeaders(), Authorization: `Bearer ${accessToken}` },
    });
    await ensureOk(res, "récupération des données");
    const body = (await res.json()) as { resources: T[]; pagination?: { next_uri?: string } };
    results.push(...body.resources);
    next = body.pagination?.next_uri ? `${ENDPOINT}${body.pagination.next_uri}` : null;
    pages += 1;
  }
  return results;
}

export async function listAccounts(bridgeUserUuid: string): Promise<BridgeAccount[]> {
  const accessToken = await getAccessToken(bridgeUserUuid);
  return fetchAllPages<BridgeAccount>(`${ENDPOINT}/v3/aggregation/accounts?limit=100`, accessToken);
}

export async function listTransactions(bridgeUserUuid: string, since?: Date): Promise<BridgeTransaction[]> {
  const accessToken = await getAccessToken(bridgeUserUuid);
  const url = new URL(`${ENDPOINT}/v3/aggregation/transactions`);
  url.searchParams.set("limit", "500");
  if (since) url.searchParams.set("since", since.toISOString());
  return fetchAllPages<BridgeTransaction>(url.toString(), accessToken);
}
