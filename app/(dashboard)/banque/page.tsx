"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageSpinner } from "@/components/ui/page-spinner";
import { toast } from "sonner";
import { Landmark, RefreshCw, Loader2 } from "lucide-react";

type BankAccount = {
  id: string;
  name: string;
  type: string;
  iban: string | null;
  balance: number;
  currencyCode: string;
};

type BankTransaction = {
  id: string;
  bankAccountId: string;
  description: string;
  amount: number;
  date: string;
  currencyCode: string;
};

type AccountsResponse = {
  lastSyncAt: string | null;
  accounts: BankAccount[];
  transactions: BankTransaction[];
};

function formatEuro(value: number) {
  return `${value.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

export default function BanquePage() {
  const [data, setData] = useState<AccountsResponse | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const load = () => {
    fetch("/api/bank/accounts")
      .then((res) => res.json())
      .then((body: AccountsResponse) => setData(body));
  };

  useEffect(() => {
    load();
  }, []);

  const connect = () => {
    setConnecting(true);
    fetch("/api/bank/connect", { method: "POST" })
      .then(async (res) => {
        if (!res.ok) {
          toast.error(await res.text());
          setConnecting(false);
          return;
        }
        const body = (await res.json()) as { url: string };
        window.location.href = body.url;
      })
      .catch(() => setConnecting(false));
  };

  const sync = () => {
    setSyncing(true);
    fetch("/api/bank/sync", { method: "POST" })
      .then(async (res) => {
        if (!res.ok) {
          toast.error(await res.text());
          return;
        }
        const body = (await res.json()) as { accounts: number; transactions: number };
        toast.success(`${body.accounts} compte(s), ${body.transactions} transaction(s) synchronisée(s)`);
        load();
      })
      .finally(() => setSyncing(false));
  };

  if (!data) {
    return <PageSpinner />;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Banque</h1>
        <p className="text-sm text-muted-foreground">
          Connectez votre compte pour suivre vos soldes et transactions directement dans MIA.
        </p>
      </div>

      {data.accounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <Landmark className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-medium">Aucune banque connectée</p>
              <p className="text-sm text-muted-foreground">
                Vous serez redirigée vers une page sécurisée (Bridge) pour vous connecter à votre banque.
              </p>
            </div>
            <Button onClick={connect} disabled={connecting}>
              {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Landmark className="h-4 w-4" />}
              Connecter ma banque
            </Button>
            {data.lastSyncAt && (
              <Button variant="ghost" size="sm" onClick={sync} disabled={syncing}>
                {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Réessayer la synchronisation
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {data.lastSyncAt
                ? `Dernière synchro : ${new Date(data.lastSyncAt).toLocaleString("fr-FR")}`
                : "Pas encore synchronisé"}
            </p>
            <Button variant="outline" size="sm" onClick={sync} disabled={syncing}>
              {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Synchroniser
            </Button>
          </div>

          <div className="space-y-3">
            {data.accounts.map((account) => (
              <Card key={account.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-base font-medium">
                    <span>{account.name}</span>
                    <span>{formatEuro(account.balance)}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 text-xs text-muted-foreground">
                  {account.iban || account.type}
                </CardContent>
              </Card>
            ))}
          </div>

          {data.transactions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">Transactions récentes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {data.transactions.map((tx) => (
                  <div key={tx.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {new Date(tx.date).toLocaleDateString("fr-FR")} — {tx.description}
                    </span>
                    <span className={tx.amount < 0 ? "text-muted-foreground" : "font-medium"}>
                      {formatEuro(tx.amount)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
