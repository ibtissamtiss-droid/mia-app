import Link from "next/link";

const LINKS = [
  { href: "/a-propos", label: "À propos" },
  { href: "/confiance-securite", label: "Confiance et sécurité" },
  { href: "/accessibilite", label: "Accessibilité" },
];

export function PublicFooter() {
  return (
    <footer className="border-t px-4 py-6">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-2 text-xs text-muted-foreground sm:flex-row sm:justify-between">
        <span>© {new Date().getFullYear()} MIA</span>
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-foreground hover:underline">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
