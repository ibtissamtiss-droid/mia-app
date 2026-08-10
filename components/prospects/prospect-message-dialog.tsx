"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, MessageCircle, Sparkles } from "lucide-react";
import type { Prospect } from "@/types/models";

export function ProspectMessageDialog({
  prospect,
  onChanged,
}: {
  prospect: Prospect;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(prospect.outreachMessage || "");
  const [generating, setGenerating] = useState(false);

  const generate = async () => {
    setGenerating(true);
    const res = await fetch(`/api/prospects/${prospect.id}/message`, { method: "POST" });
    setGenerating(false);
    if (res.ok) {
      const data: { prospect: Prospect } = await res.json();
      setMessage(data.prospect.outreachMessage || "");
      onChanged();
    } else {
      toast.error("Échec de la génération du message");
    }
  };

  const saveEdit = async (value: string) => {
    if (value === (prospect.outreachMessage || "")) return;
    await fetch(`/api/prospects/${prospect.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outreachMessage: value }),
    });
    onChanged();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) setMessage(prospect.outreachMessage || "");
      }}
    >
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="w-full">
            <MessageCircle className="h-3.5 w-3.5" />
            Message
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Message pour {prospect.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            rows={8}
            placeholder="Cliquez sur « Générer » pour obtenir un message de prospection personnalisé."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onBlur={(e) => saveEdit(e.target.value)}
          />
          <Button type="button" onClick={generate} disabled={generating} className="w-full">
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {prospect.outreachMessage ? "Régénérer" : "Générer un message"}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
