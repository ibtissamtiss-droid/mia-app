"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";

export type LineItem = { label: string; amount: number };

export function formatEuro(value: number) {
  return `${value.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

export function LineItemsCard({
  title,
  description,
  labelPlaceholder,
  items,
  onChange,
  onCommit,
  totalLabel,
}: {
  title: string;
  description?: string;
  labelPlaceholder: string;
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
  onCommit: (items: LineItem[]) => void;
  totalLabel: string;
}) {
  const total = items.reduce((sum, it) => sum + (it.amount || 0), 0);

  const update = (index: number, patch: Partial<LineItem>) => {
    onChange(items.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  };

  const remove = (index: number) => {
    const next = items.filter((_, i) => i !== index);
    onChange(next);
    onCommit(next);
  };

  const add = () => {
    onChange([...items, { label: "", amount: 0 }]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              placeholder={labelPlaceholder}
              value={item.label}
              onChange={(e) => update(index, { label: e.target.value })}
              onBlur={() => onCommit(items)}
              className="flex-1"
            />
            <Input
              type="number"
              min="0"
              step="10"
              value={item.amount || ""}
              onChange={(e) => update(index, { amount: parseFloat(e.target.value) || 0 })}
              onBlur={() => onCommit(items)}
              className="w-28"
            />
            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus className="h-4 w-4" />
          Ajouter une ligne
        </Button>
        <div className="flex justify-between border-t pt-2 text-sm font-medium">
          <span>{totalLabel}</span>
          <span>{formatEuro(total)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
