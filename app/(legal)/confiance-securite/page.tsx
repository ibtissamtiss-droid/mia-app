export const metadata = { title: "Confiance et sécurité — MIA" };

export default function TrustSecurityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Confiance et sécurité</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Comment MIA protège vos données.
        </p>
      </div>

      <div className="space-y-5 text-sm leading-relaxed text-muted-foreground">
        <div>
          <h2 className="mb-1 text-base font-medium text-foreground">Mots de passe</h2>
          <p>
            Votre mot de passe n&apos;est jamais stocké en clair. Il est haché avec l&apos;algorithme
            bcrypt avant d&apos;être enregistré, ce qui signifie que personne — y compris nous — ne
            peut le consulter.
          </p>
        </div>

        <div>
          <h2 className="mb-1 text-base font-medium text-foreground">Données et connexions</h2>
          <p>
            Vos données sont stockées dans une base PostgreSQL hébergée chez Neon, et toutes les
            connexions entre votre navigateur et nos serveurs sont chiffrées (HTTPS/TLS).
          </p>
        </div>

        <div>
          <h2 className="mb-1 text-base font-medium text-foreground">Services tiers utilisés</h2>
          <p>MIA s&apos;appuie sur un nombre limité de prestataires, chacun pour une fonction précise :</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <span className="text-foreground">Anthropic</span> — pour l&apos;assistant IA et les
              résumés de notes ; le contenu envoyé sert uniquement à générer la réponse demandée.
            </li>
            <li>
              <span className="text-foreground">Google</span> — pour la synchronisation avec Google
              Calendar, uniquement si vous connectez volontairement votre compte. Vous pouvez le
              déconnecter à tout moment depuis les Paramètres.
            </li>
            <li>
              <span className="text-foreground">Resend</span> — pour l&apos;envoi des rappels
              quotidiens par email.
            </li>
            <li>
              <span className="text-foreground">Vercel</span> — pour l&apos;hébergement de
              l&apos;application.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-1 text-base font-medium text-foreground">Contrôle de vos données</h2>
          <p>
            Vous pouvez exporter vos tâches, notes, devis et factures au format CSV à tout moment
            depuis les Paramètres, et déconnecter les intégrations quand vous le souhaitez.
          </p>
        </div>

        <div>
          <h2 className="mb-1 text-base font-medium text-foreground">Transparence</h2>
          <p>
            MIA est un projet indépendant en développement actif, pas (encore) certifié selon des
            normes formelles (type SOC 2 ou ISO 27001). Nous appliquons les bonnes pratiques
            standard du secteur, mais nous recommandons, comme pour tout service jeune, de ne pas
            y stocker d&apos;informations extrêmement sensibles.
          </p>
        </div>
      </div>
    </div>
  );
}
