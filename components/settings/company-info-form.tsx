"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

type CompanyInfo = {
  companyName: string;
  companyAddress: string;
  siren: string;
  vatApplicable: boolean;
};

export function CompanyInfoForm() {
  const [info, setInfo] = useState<CompanyInfo | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/profile/company")
      .then((res) => res.json())
      .then((data: CompanyInfo) => setInfo(data));
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!info) return;
    if (info.siren && !/^\d{9}$/.test(info.siren)) {
      toast.error("Le SIREN doit contenir 9 chiffres");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/profile/company", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(info),
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Informations légales mises à jour");
    } else {
      toast.error("Échec de la mise à jour");
    }
  };

  if (!info) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Informations légales (factures & devis)</CardTitle>
        <p className="text-sm text-muted-foreground">
          Ces informations apparaissent sur vos devis et factures pour respecter les mentions
          obligatoires.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Nom / raison sociale</Label>
            <Input
              id="companyName"
              value={info.companyName}
              onChange={(e) => setInfo({ ...info, companyName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyAddress">Adresse</Label>
            <Textarea
              id="companyAddress"
              rows={2}
              value={info.companyAddress}
              onChange={(e) => setInfo({ ...info, companyAddress: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="siren">SIREN</Label>
            <Input
              id="siren"
              placeholder="123456789"
              maxLength={9}
              value={info.siren}
              onChange={(e) => setInfo({ ...info, siren: e.target.value.replace(/\D/g, "") })}
            />
          </div>
          <label className="flex cursor-pointer items-start gap-3">
            <Checkbox
              checked={info.vatApplicable}
              onCheckedChange={(checked) => setInfo({ ...info, vatApplicable: checked === true })}
              className="mt-0.5"
            />
            <span className="text-sm">
              <span className="font-medium">Je suis assujetti(e) à la TVA</span>
              <span className="block text-xs text-muted-foreground">
                Décochez si vous êtes en franchise en base de TVA (cas le plus fréquent en
                auto-entreprise) — la mention « TVA non applicable, art. 293 B du CGI » sera
                ajoutée automatiquement.
              </span>
            </span>
          </label>
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? "..." : "Enregistrer"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
