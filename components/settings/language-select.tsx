"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LANGUAGES = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English (bientôt disponible)", disabled: true },
];

export function LanguageSelect() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Langue</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Select defaultValue="fr">
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue>{(value: string) => LANGUAGES.find((l) => l.value === value)?.label}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((lang) => (
              <SelectItem key={lang.value} value={lang.value} disabled={lang.disabled}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          D&apos;autres langues seront ajoutées prochainement.
        </p>
      </CardContent>
    </Card>
  );
}
