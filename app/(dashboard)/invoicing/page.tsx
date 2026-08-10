"use client";

import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentForm } from "@/components/invoicing/document-form";
import { DocumentList } from "@/components/invoicing/document-list";
import { documentTotals, type BillingDocument, type DocumentType } from "@/types/models";

export default function InvoicingPage() {
  const [documents, setDocuments] = useState<BillingDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<DocumentType>("QUOTE");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/documents")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setDocuments(data.documents ?? []);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const load = () => setReloadKey((k) => k + 1);

  const filtered = useMemo(() => documents.filter((d) => d.type === type), [documents, type]);

  const accounting = useMemo(() => {
    const invoices = documents.filter((d) => d.type === "INVOICE");
    const invoiced = invoices.reduce((sum, d) => sum + documentTotals(d).total, 0);
    const paid = invoices
      .filter((d) => d.status === "PAID")
      .reduce((sum, d) => sum + documentTotals(d).total, 0);
    const pending = invoices
      .filter((d) => d.status === "SENT")
      .reduce((sum, d) => sum + documentTotals(d).total, 0);
    return { invoiced, paid, pending };
  }, [documents]);

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
          <CardContent className="text-xl font-semibold">
            {accounting.invoiced.toFixed(2)} €
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Payé</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold">{accounting.paid.toFixed(2)} €</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">En attente</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold">
            {accounting.pending.toFixed(2)} €
          </CardContent>
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
        <p className="text-sm text-muted-foreground">Chargement...</p>
      ) : (
        <DocumentList documents={filtered} />
      )}
    </div>
  );
}
