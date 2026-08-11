"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { formatEuro } from "./line-items-card";

export type ProductRow = {
  name: string;
  unitPrice: number;
  unitCost: number;
  monthlyVolume: number;
};

export function ProductMarginsCard({
  items,
  onChange,
  onCommit,
}: {
  items: ProductRow[];
  onChange: (items: ProductRow[]) => void;
  onCommit: (items: ProductRow[]) => void;
}) {
  const totalMonthlyMargin = items.reduce(
    (sum, it) => sum + (it.unitPrice - it.unitCost) * it.monthlyVolume,
    0
  );

  const update = (index: number, patch: Partial<ProductRow>) => {
    onChange(items.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  };

  const remove = (index: number) => {
    const next = items.filter((_, i) => i !== index);
    onChange(next);
    onCommit(next);
  };

  const add = () => {
    onChange([...items, { name: "", unitPrice: 0, unitCost: 0, monthlyVolume: 0 }]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Marge par produit / service</CardTitle>
        <p className="text-sm text-muted-foreground">
          Estimez la marge dégagée par chaque offre, selon le volume vendu par mois.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item, index) => {
          const unitMargin = item.unitPrice - item.unitCost;
          const monthlyMargin = unitMargin * item.monthlyVolume;
          return (
            <div key={index} className="space-y-2 rounded-md border p-3">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Nom du produit / service"
                  value={item.name}
                  onChange={(e) => update(index, { name: e.target.value })}
                  onBlur={() => onCommit(items)}
                  className="flex-1"
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Prix de vente</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={item.unitPrice || ""}
                    onChange={(e) => update(index, { unitPrice: parseFloat(e.target.value) || 0 })}
                    onBlur={() => onCommit(items)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Coût unitaire</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={item.unitCost || ""}
                    onChange={(e) => update(index, { unitCost: parseFloat(e.target.value) || 0 })}
                    onBlur={() => onCommit(items)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Ventes / mois</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={item.monthlyVolume || ""}
                    onChange={(e) => update(index, { monthlyVolume: parseFloat(e.target.value) || 0 })}
                    onBlur={() => onCommit(items)}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Marge unitaire: {formatEuro(unitMargin)} — Marge mensuelle: {formatEuro(monthlyMargin)}
              </p>
            </div>
          );
        })}
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus className="h-4 w-4" />
          Ajouter un produit / service
        </Button>
        <div className="flex justify-between border-t pt-2 text-sm font-medium">
          <span>Marge mensuelle totale</span>
          <span>{formatEuro(totalMonthlyMargin)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
