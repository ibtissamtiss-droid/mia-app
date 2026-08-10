"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/profile", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      await signOut({ callbackUrl: "/login" });
      return;
    }

    setLoading(false);
    const data = await res.json().catch(() => null);
    toast.error(data?.error ?? "Échec de la suppression");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Confidentialité</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          La suppression de votre compte efface définitivement toutes vos données (tâches,
          notes, événements, devis, factures, conversations). Cette action est irréversible.
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
                Supprimer mon compte
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Supprimer définitivement votre compte ?</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleDelete} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Cette action est irréversible. Confirmez avec votre mot de passe pour continuer.
              </p>
              <div className="space-y-2">
                <Label htmlFor="delete-password">Mot de passe</Label>
                <Input
                  id="delete-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                variant="destructive"
                className="w-full"
                disabled={loading || !password}
              >
                {loading ? "Suppression..." : "Supprimer définitivement mon compte"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
