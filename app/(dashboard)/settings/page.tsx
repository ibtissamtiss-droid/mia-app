import { Suspense } from "react";
import { GoogleIntegrationCard } from "@/components/settings/google-integration-card";
import { ProfileForm } from "@/components/settings/profile-form";
import { CompanyInfoForm } from "@/components/settings/company-info-form";
import { ThemeToggle } from "@/components/settings/theme-toggle";
import { LanguageSelect } from "@/components/settings/language-select";
import { ExportData } from "@/components/settings/export-data";
import { DeleteAccount } from "@/components/settings/delete-account";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Paramètres</h1>
        <p className="text-sm text-muted-foreground">Informations de votre compte.</p>
      </div>
      <ProfileForm />
      <CompanyInfoForm />
      <ThemeToggle />
      <LanguageSelect />
      <ExportData />
      <Suspense fallback={null}>
        <GoogleIntegrationCard />
      </Suspense>
      <DeleteAccount />
    </div>
  );
}
