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
import { ArrowLeft, Download, FileCheck2, Trash2, ShieldCheck, Loader2, Send } from "lucide-react";
import { PageSpinner } from "@/components/ui/page-spinner";
import { toast } from "sonner";
import { documentTotals, type BillingDocument, type DocumentStatus } from "@/types/models";

type FacturXValidation = {
  isValid: boolean;
  format: string;
  failures: { message: string; location?: string }[];
  warnings: { message: string; location?: string }[];
};

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
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<FacturXValidation | null>(null);
  const [sending, setSending] = useState(false);

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

  const downloadFacturX = async () => {
    const res = await fetch(`/api/documents/${params.id}/facturx`);
    if (!res.ok) {
      toast.error(await res.text());
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = `${document?.number ?? "facture"}-facturx.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const checkFacturXCompliance = async () => {
    setValidating(true);
    setValidation(null);
    try {
      const res = await fetch(`/api/documents/${params.id}/facturx/validate`);
      if (!res.ok) {
        toast.error(await res.text());
        return;
      }
      const report = (await res.json()) as FacturXValidation;
      setValidation(report);
      if (report.isValid) {
        toast.success(
          report.warnings.length > 0
            ? `Facture conforme (${report.warnings.length} avertissement mineur)`
            : "Facture conforme"
        );
      } else {
        toast.error(`${report.failures.length} problème(s) de conformité détecté(s)`);
      }
    } finally {
      setValidating(false);
    }
  };

  const sendViaSuperPdp = async () => {
    const confirmed = window.confirm(
      "Envoyer cette facture via l'API SUPER PDP ?\n\n" +
        "Attention : seuls des identifiants bac à sable (entreprise fictive de test) sont configurés pour l'instant. " +
        "Cet envoi valide le circuit technique mais n'atteint aucun vrai client — ce n'est pas un envoi réel."
    );
    if (!confirmed) return;

    setSending(true);
    try {
      const res = await fetch(`/api/documents/${params.id}/facturx/send`, { method: "POST" });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        if (res.status === 422 && body?.failures) {
          toast.error(`Facture non conforme : ${body.failures[0]?.message ?? body.error}`);
        } else {
          toast.error(body?.error || (await res.text().catch(() => "Erreur d'envoi")));
        }
        return;
      }
      setDocument((prev) =>
        prev
          ? {
              ...prev,
              superpdpInvoiceId: body.invoiceId,
              superpdpSentAt: body.sentAt,
              superpdpCompanyName: body.companyName,
            }
          : prev
      );
      toast.success(`Envoyée (bac à sable, en tant que ${body.companyName}) — #${body.invoiceId}`);
    } finally {
      setSending(false);
    }
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
        {document.type === "INVOICE" && (
          <Button variant="outline" size="sm" onClick={downloadFacturX}>
            <FileCheck2 className="h-4 w-4" />
            Facture électronique (Factur-X)
          </Button>
        )}
        {document.type === "INVOICE" && (
          <Button variant="outline" size="sm" onClick={checkFacturXCompliance} disabled={validating}>
            {validating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Vérifier la conformité
          </Button>
        )}
        {document.type === "INVOICE" && (
          <Button variant="outline" size="sm" onClick={sendViaSuperPdp} disabled={sending}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Envoyer via SUPER PDP (bac à sable)
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={remove}>
          <Trash2 className="h-4 w-4" />
          Supprimer
        </Button>
      </div>

      {document.superpdpInvoiceId && (
        <Card>
          <CardContent className="space-y-1 py-4 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Envoyée (bac à sable)</Badge>
              <span className="text-muted-foreground">
                SUPER PDP #{document.superpdpInvoiceId}
                {document.superpdpSentAt &&
                  ` · ${new Date(document.superpdpSentAt).toLocaleString("fr-FR")}`}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Envoyée en tant que « {document.superpdpCompanyName} » (entreprise de test) — pas un envoi réel à
              un vrai client.
            </p>
          </CardContent>
        </Card>
      )}

      {validation && (
        <Card>
          <CardContent className="space-y-2 py-4 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant={validation.isValid ? "default" : "destructive"}>
                {validation.isValid ? "Conforme" : "Non conforme"}
              </Badge>
              <span className="text-muted-foreground">
                Validé par SUPER PDP (format {validation.format})
              </span>
            </div>
            {validation.failures.length > 0 && (
              <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                {validation.failures.slice(0, 8).map((issue, i) => (
                  <li key={i}>
                    {issue.message}
                    {issue.location && <span className="text-xs"> ({issue.location})</span>}
                  </li>
                ))}
                {validation.failures.length > 8 && <li>… et {validation.failures.length - 8} autre(s)</li>}
              </ul>
            )}
            {validation.warnings.length > 0 && (
              <details className="text-muted-foreground">
                <summary className="cursor-pointer text-xs">
                  {validation.warnings.length} avertissement(s) mineur(s)
                </summary>
                <ul className="list-disc space-y-1 pl-5 pt-1">
                  {validation.warnings.slice(0, 8).map((issue, i) => (
                    <li key={i}>{issue.message}</li>
                  ))}
                </ul>
              </details>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Client</p>
              <p>{document.clientName}</p>
              {document.clientEmail && <p>{document.clientEmail}</p>}
              {document.clientAddress && <p>{document.clientAddress}</p>}
              {document.clientSiren && (
                <p className="text-xs text-muted-foreground">SIREN {document.clientSiren}</p>
              )}
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
