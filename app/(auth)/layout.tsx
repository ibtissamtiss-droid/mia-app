import { PublicFooter } from "@/components/layout/public-footer";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <div className="flex flex-1 items-center justify-center px-4">{children}</div>
      <PublicFooter />
    </div>
  );
}
