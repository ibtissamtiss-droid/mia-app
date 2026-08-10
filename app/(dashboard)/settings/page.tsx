import { Suspense } from "react";
import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleIntegrationCard } from "@/components/settings/google-integration-card";

export default async function SettingsPage() {
  const session = await auth();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Paramètres</h1>
        <p className="text-sm text-muted-foreground">Informations de votre compte.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Nom : </span>
            {session?.user?.name ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Email : </span>
            {session?.user?.email}
          </p>
        </CardContent>
      </Card>
      <Suspense fallback={null}>
        <GoogleIntegrationCard />
      </Suspense>
    </div>
  );
}
