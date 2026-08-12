"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import type { DocumentType } from "@/types/models";

type ItemDraft = { description: string; quantity: string; unitPrice: string };

const EMPTY_ITEM: ItemDraft = { description: "", quantity: "1", unitPrice: "0" };

export function DocumentForm({
  type,
  onCreated,
}: {
  type: DocumentType;
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientSiren, setClientSiren] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [taxRate, setTaxRate] = useState("0");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ItemDraft[]>([{ ...EMPTY_ITEM }]);
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setClientName("");
    setClientEmail("");
    setClientAddress("");
    setClientSiren("");
    setDueDate("");
    setTaxRate("0");
    setNotes("");
    setItems([{ ...EMPTY_ITEM }]);
  };

  const updateItem = (index: number, patch: Partial<ItemDraft>) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce(
    (sum, it) => sum + (parseFloat(it.quantity) || 0) * (parseFloat(it.unitPrice) || 0),
    0
  );
  const tax = subtotal * ((parseFloat(taxRate) || 0) / 100);
  const total = subtotal + tax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        clientName,
        clientEmail: clientEmail || undefined,
        clientAddress: clientAddress || undefined,
        clientSiren: clientSiren || undefined,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        taxRate: parseFloat(taxRate) || 0,
        notes: notes || undefined,
        items: items
          .filter((it) => it.description.trim())
          .map((it) => ({
            description: it.description,
            quantity: parseFloat(it.quantity) || 1,
            unitPrice: parseFloat(it.unitPrice) || 0,
          })),
      }),
    });
    setLoading(false);
    setOpen(false);
    reset();
    onCreated();
  };

  const label = type === "QUOTE" ? "devis" : "facture";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Nouveau {label}
          </Button>
        }
      />
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="capitalize">Nouveau {label}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Client</Label>
              <Input
                id="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientEmail">Email client</Label>
              <Input
                id="clientEmail"
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientAddress">Adresse client</Label>
            <Input
              id="clientAddress"
              value={clientAddress}
              onChange={(e) => setClientAddress(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientSiren">SIREN client (optionnel)</Label>
            <Input
              id="clientSiren"
              value={clientSiren}
              onChange={(e) => setClientSiren(e.target.value)}
              placeholder="123456789"
              maxLength={9}
            />
            <p className="text-xs text-muted-foreground">
              Requis pour l&apos;adresse de facturation électronique du client (Factur-X).
            </p>
          </div>

          <div className="space-y-2">
            <Label>Lignes</Label>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateItem(index, { description: e.target.value })}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Qté"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, { quantity: e.target.value })}
                    className="w-16"
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Prix"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(index, { unitPrice: e.target.value })}
                    className="w-24"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setItems((prev) => [...prev, { ...EMPTY_ITEM }])}
            >
              <Plus className="h-4 w-4" />
              Ajouter une ligne
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Échéance</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxRate">TVA (%)</Label>
              <Input
                id="taxRate"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="space-y-1 rounded-md bg-muted p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sous-total</span>
              <span>{subtotal.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">TVA</span>
              <span>{tax.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span>{total.toFixed(2)} €</span>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading || !clientName}>
            {loading ? "Création..." : `Créer le ${label}`}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
