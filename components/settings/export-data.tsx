"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";

const EXPORTS = [
  { type: "tasks", label: "Tâches" },
  { type: "notes", label: "Notes" },
  { type: "documents", label: "Devis & Factures" },
];

export function ExportData() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Exporter mes données</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {EXPORTS.map((e) => (
          <a key={e.type} href={`/api/export/${e.type}`} download>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4" />
              {e.label} (CSV)
            </Button>
          </a>
        ))}
      </CardContent>
    </Card>
  );
}
