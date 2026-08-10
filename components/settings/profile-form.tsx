"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export function ProfileForm() {
  const { data: session, update } = useSession();
  const [name, setName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current && session?.user?.name) {
      setName(session.user.name);
      initialized.current = true;
    }
  }, [session?.user?.name]);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const saveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingName(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setSavingName(false);
    if (res.ok) {
      await update({ name });
      toast.success("Nom mis à jour");
    } else {
      toast.error("Échec de la mise à jour");
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPassword(true);
    const res = await fetch("/api/profile/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setSavingPassword(false);
    if (res.ok) {
      setCurrentPassword("");
      setNewPassword("");
      toast.success("Mot de passe mis à jour");
    } else {
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? "Échec de la mise à jour");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Profil</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={saveName} className="space-y-2">
          <Label htmlFor="name">Nom</Label>
          <div className="flex gap-2">
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            <Button type="submit" size="sm" disabled={savingName}>
              {savingName ? "..." : "Enregistrer"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Email : {session?.user?.email}</p>
        </form>

        <form onSubmit={savePassword} className="space-y-2 border-t pt-4">
          <Label htmlFor="currentPassword">Changer le mot de passe</Label>
          <Input
            id="currentPassword"
            type="password"
            placeholder="Mot de passe actuel"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Nouveau mot de passe"
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Button
            type="submit"
            size="sm"
            variant="outline"
            disabled={savingPassword || !currentPassword || !newPassword}
          >
            {savingPassword ? "..." : "Mettre à jour le mot de passe"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
