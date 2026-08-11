"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Download, Trash2 } from "lucide-react";
import { PageSpinner } from "@/components/ui/page-spinner";
import { documentTotals, type BillingDocument, type DocumentStatus } from "@/types/models";

const STATUS_LABEL: Record<DocumentStatus, string> = {
  DRAFT: "Brouillon",
  SENT: "Envoyé",
  PAID: "Payé",
  CANCELLED: "Annulé",
};

const TYPE_LABEL = { QUOTE: "Devis", INVOICE: "Facture" };

export default function DocumentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [document, setDocument] = useState<BillingDocument | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/documents/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setDocument(data.document ?? null);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const updateStatus = async (status: DocumentStatus) => {
    const res = await fetch(`/api/documents/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    setDocument(data.document);
  };

  const remove = async () => {
    await fetch(`/api/documents/${params.id}`, { method: "DELETE" });
    router.push("/invoicing");
  };

  if (loading) {
    return <PageSpinner />;
  }

  if (!document) {
    return <p className="mx-auto max-w-2xl text-sm text-muted-foreground">Document introuvable.</p>;
  }

  const { subtotal, tax, total } = documentTotals(document);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.push("/invoicing")}>
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {TYPE_LABEL[document.type]} {document.number}
          </h1>
          <p className="text-sm text-muted-foreground">{document.clientName}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={document.status} onValueChange={(v) => updateStatus(v as DocumentStatus)}>
            <SelectTrigger className="w-36">
              <SelectValue>
                {(value: DocumentStatus) => STATUS_LABEL[value]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_LABEL).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge>{STATUS_LABEL[document.status]}</Badge>
        </div>
      </div>

      <div className="flex gap-2">
        <a href={`/api/documents/${document.id}/pdf`} download>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" />
            Télécharger le PDF
          </Button>
        </a>
        <Button variant="ghost" size="sm" onClick={remove}>
          <Trash2 className="h-4 w-4" />
          Supprimer
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Client</p>
              <p>{document.clientName}</p>
              {document.clientEmail && <p>{document.clientEmail}</p>}
              {document.clientAddress && <p>{document.clientAddress}</p>}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Date d&apos;émission</p>
              <p>{new Date(document.issueDate).toLocaleDateString("fr-FR")}</p>
              {document.dueDate && (
                <>
                  <p className="mt-2 text-xs text-muted-foreground">Échéance</p>
                  <p>{new Date(document.dueDate).toLocaleDateString("fr-FR")}</p>
                </>
              )}
            </div>
          </div>

          <div className="space-y-1 border-t pt-3">
            {document.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>
                  {item.description}{" "}
                  <span className="text-muted-foreground">
                    ({item.quantity} × {item.unitPrice.toFixed(2)} €)
                  </span>
                </span>
                <span>{(item.quantity * item.unitPrice).toFixed(2)} €</span>
              </div>
            ))}
          </div>

          <div className="space-y-1 border-t pt-3 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Sous-total</span>
              <span>{subtotal.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>TVA ({document.taxRate}%)</span>
              <span>{tax.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span>{total.toFixed(2)} €</span>
            </div>
          </div>

          {document.notes && (
            <div className="border-t pt-3 text-sm">
              <p className="text-xs text-muted-foreground">Notes</p>
              <p>{document.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
