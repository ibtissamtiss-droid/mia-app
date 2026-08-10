import { PublicFooter } from "@/components/layout/public-footer";
import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4">
        <Logo className="h-10 w-10" />
        {children}
      </div>
      <PublicFooter />
    </div>
  );
}
