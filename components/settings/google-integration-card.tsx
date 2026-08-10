"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

export function GoogleIntegrationCard() {
  const searchParams = useSearchParams();
  const [connected, setConnected] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const load = () => {
    fetch("/api/google/status")
      .then((res) => res.json())
      .then((data) => {
        setConnected(data.connected ?? false);
        setEmail(data.email ?? null);
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (searchParams.get("google_connected")) {
      toast.success("Google Calendar connecté");
    }
    if (searchParams.get("google_error")) {
      toast.error("Échec de la connexion à Google Calendar");
    }
  }, [searchParams]);

  const disconnect = async () => {
    await fetch("/api/google/disconnect", { method: "POST" });
    load();
  };

  const sync = async () => {
    setSyncing(true);
    const res = await fetch("/api/google/sync", { method: "POST" });
    setSyncing(false);
    if (res.ok) {
      const data = await res.json();
      toast.success(`Synchronisé : ${data.imported} importé(s), ${data.exported} exporté(s)`);
    } else {
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? "Échec de la synchronisation");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Google Calendar</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {loading ? (
          <p className="text-muted-foreground">Chargement...</p>
        ) : connected ? (
          <>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Connecté</Badge>
              {email && <span className="text-muted-foreground">{email}</span>}
            </div>
            <p className="text-muted-foreground">
              Vos événements Google Calendar sont importés dans MIA, et les événements créés dans
              MIA sont poussés vers Google Calendar.
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={sync} disabled={syncing}>
                <RefreshCw className="h-4 w-4" />
                {syncing ? "Synchronisation..." : "Synchroniser maintenant"}
              </Button>
              <Button size="sm" variant="outline" onClick={disconnect}>
                Déconnecter
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-muted-foreground">
              Connectez votre compte Google pour synchroniser votre agenda avec MIA.
            </p>
            <a href="/api/google/connect">
              <Button size="sm">Connecter Google Calendar</Button>
            </a>
          </>
        )}
      </CardContent>
    </Card>
  );
}
