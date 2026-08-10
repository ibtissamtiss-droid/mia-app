"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { documentTotals, type BillingDocument, type DocumentStatus } from "@/types/models";

const STATUS_LABEL: Record<DocumentStatus, string> = {
  DRAFT: "Brouillon",
  SENT: "Envoyé",
  PAID: "Payé",
  CANCELLED: "Annulé",
};

const STATUS_VARIANT: Record<DocumentStatus, "secondary" | "default" | "destructive" | "outline"> = {
  DRAFT: "outline",
  SENT: "default",
  PAID: "secondary",
  CANCELLED: "destructive",
};

export function DocumentList({ documents }: { documents: BillingDocument[] }) {
  if (documents.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucun document pour le moment.</p>;
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => {
        const { total } = documentTotals(doc);
        return (
          <Link key={doc.id} href={`/invoicing/${doc.id}`}>
            <Card className="transition-colors hover:bg-muted/40">
              <CardContent className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-medium">{doc.number}</p>
                  <p className="text-xs text-muted-foreground">{doc.clientName}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{total.toFixed(2)} €</span>
                  <Badge variant={STATUS_VARIANT[doc.status]}>{STATUS_LABEL[doc.status]}</Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
