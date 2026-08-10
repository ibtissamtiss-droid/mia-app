export const metadata = { title: "Paramètres de cookies — MIA" };

const COOKIES = [
  {
    name: "authjs.session-token",
    purpose: "Garde votre session ouverte après connexion",
    duration: "30 jours ou jusqu'à déconnexion",
  },
  {
    name: "authjs.csrf-token",
    purpose: "Protège les formulaires contre les attaques de type CSRF",
    duration: "Session du navigateur",
  },
  {
    name: "google_oauth_state",
    purpose: "Sécurise la connexion temporaire à Google Calendar",
    duration: "10 minutes, supprimé après la connexion",
  },
];

export default function CookiesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Paramètres de cookies</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Les cookies utilisés par MIA, et pourquoi.
        </p>
      </div>

      <div className="space-y-5 text-sm leading-relaxed text-muted-foreground">
        <p>
          MIA n&apos;utilise <span className="text-foreground">aucun cookie publicitaire, de
          suivi ou d&apos;analyse d&apos;audience</span>. Les seuls cookies déposés sont strictement
          nécessaires au fonctionnement de l&apos;application (connexion, sécurité) — ils ne
          peuvent donc pas être désactivés sans empêcher MIA de fonctionner.
        </p>

        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 text-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Cookie</th>
                <th className="px-3 py-2 font-medium">À quoi il sert</th>
                <th className="px-3 py-2 font-medium">Durée</th>
              </tr>
            </thead>
            <tbody>
              {COOKIES.map((c) => (
                <tr key={c.name} className="border-t">
                  <td className="px-3 py-2 font-mono text-[0.7rem] text-foreground">{c.name}</td>
                  <td className="px-3 py-2">{c.purpose}</td>
                  <td className="px-3 py-2">{c.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
          <div>
            <p className="text-foreground">Cookies essentiels</p>
            <p className="text-xs">Toujours actifs — nécessaires au fonctionnement de MIA</p>
          </div>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
            Activé
          </span>
        </div>

        <p>
          Le thème clair/sombre est mémorisé via le stockage local de votre navigateur, pas via un
          cookie.
        </p>
      </div>
    </div>
  );
}
