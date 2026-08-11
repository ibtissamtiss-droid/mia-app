"use client";

import { useEffect, useState } from "react";
import { ProspectForm } from "@/components/prospects/prospect-form";
import { ProspectBoard } from "@/components/prospects/prospect-board";
import { ProspectingIdeas } from "@/components/prospects/prospecting-ideas";
import { PageSpinner } from "@/components/ui/page-spinner";
import type { Prospect } from "@/types/models";

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/prospects")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setProspects(data.prospects ?? []);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const load = () => setReloadKey((k) => k + 1);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Recherche de clients</h1>
          <p className="text-sm text-muted-foreground">
            Suivez vos prospects et laissez l&apos;IA vous aider à les approcher.
          </p>
        </div>
        <ProspectForm onCreated={load} />
      </div>

      <ProspectingIdeas />

      {loading ? (
        <PageSpinner />
      ) : (
        <ProspectBoard prospects={prospects} onChanged={load} />
      )}
    </div>
  );
}
