"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentForm } from "@/components/invoicing/document-form";
import { DocumentList } from "@/components/invoicing/document-list";
import { PageSpinner } from "@/components/ui/page-spinner";
import type { BillingDocument, DocumentType } from "@/types/models";

type Summary = { invoiced: number; paid: number; pending: number };

export default function InvoicingPage() {
  const [documents, setDocuments] = useState<BillingDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [type, setType] = useState<DocumentType>("QUOTE");
  const [reloadKey, setReloadKey] = useState(0);
  const [summary, setSummary] = useState<Summary>({ invoiced: 0, paid: 0, pending: 0 });

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/documents?type=${type}`)
      .then((res) => res.json())
      .then((data: { documents: BillingDocument[]; hasMore: boolean }) => {
        if (cancelled) return;
        setDocuments(data.documents ?? []);
        setHasMore(data.hasMore ?? false);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [type, reloadKey]);

  useEffect(() => {
    fetch("/api/documents/summary")
      .then((res) => res.json())
      .then((data: Summary) => setSummary(data));
  }, [reloadKey]);

  const load = () => setReloadKey((k) => k + 1);

  const loadMore = async () => {
    setLoadingMore(true);
    const res = await fetch(`/api/documents?type=${type}&offset=${documents.length}`);
    const data: { documents: BillingDocument[]; hasMore: boolean } = await res.json();
    setDocuments((prev) => [...prev, ...data.documents]);
    setHasMore(data.hasMore);
    setLoadingMore(false);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Devis & Factures</h1>
        <p className="text-sm text-muted-foreground">
          Créez vos devis et factures, suivez leur statut et exportez-les en PDF.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total facturé</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold">{summary.invoiced.toFixed(2)} €</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Payé</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold">{summary.paid.toFixed(2)} €</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">En attente</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold">{summary.pending.toFixed(2)} €</CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <Tabs value={type} onValueChange={(v) => setType(v as DocumentType)}>
          <TabsList>
            <TabsTrigger value="QUOTE">Devis</TabsTrigger>
            <TabsTrigger value="INVOICE">Factures</TabsTrigger>
          </TabsList>
        </Tabs>
        <DocumentForm type={type} onCreated={load} />
      </div>

      {loading ? (
        <PageSpinner />
      ) : (
        <>
          <DocumentList documents={documents} />
          {hasMore && (
            <Button variant="outline" size="sm" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? "Chargement..." : "Charger plus"}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
