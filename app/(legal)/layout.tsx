import Link from "next/link";
import { PublicFooter } from "@/components/layout/public-footer";
import { Logo } from "@/components/logo";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <header className="border-b bg-background px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <Logo className="h-6 w-6" />
            MIA
          </Link>
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground hover:underline">
            Retour à la connexion
          </Link>
        </div>
      </header>
      <main className="flex-1 px-4 py-10">
        <div className="mx-auto max-w-2xl rounded-xl border bg-background p-8">{children}</div>
      </main>
      <PublicFooter />
    </div>
  );
}
