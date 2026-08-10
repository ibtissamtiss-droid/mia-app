export const metadata = { title: "Politique de confidentialité — MIA" };

export default function PrivacyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Politique de confidentialité</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quelles données MIA collecte, et pourquoi.
        </p>
      </div>

      <div className="space-y-5 text-sm leading-relaxed text-muted-foreground">
        <div>
          <h2 className="mb-1 text-base font-medium text-foreground">Données collectées</h2>
          <p>Nous collectons uniquement ce qui est nécessaire au fonctionnement de MIA :</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Votre nom et votre adresse email, pour créer et sécuriser votre compte</li>
            <li>
              Le contenu que vous créez dans l&apos;application : tâches, événements, notes, devis
              et factures, messages échangés avec l&apos;assistant IA
            </li>
            <li>
              Si vous connectez Google Calendar : les événements nécessaires à la synchronisation,
              uniquement après votre autorisation explicite
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-1 text-base font-medium text-foreground">Pourquoi nous les utilisons</h2>
          <p>
            Ces données servent uniquement à faire fonctionner MIA pour vous : afficher vos
            tâches, générer les réponses de l&apos;assistant, produire vos documents, envoyer vos
            rappels par email. Elles ne sont ni vendues, ni utilisées à des fins publicitaires.
          </p>
        </div>

        <div>
          <h2 className="mb-1 text-base font-medium text-foreground">Qui y a accès</h2>
          <p>
            Vos données ne sont partagées qu&apos;avec les prestataires strictement nécessaires au
            fonctionnement du service (hébergement, base de données, envoi d&apos;email, IA), listés
            en détail sur la page{" "}
            <a href="/confiance-securite" className="underline underline-offset-2">
              Confiance et sécurité
            </a>
            . Aucun de ces prestataires n&apos;est autorisé à réutiliser vos données pour son propre
            compte.
          </p>
        </div>

        <div>
          <h2 className="mb-1 text-base font-medium text-foreground">Vos droits</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Consulter et exporter vos données (CSV) à tout moment depuis les Paramètres</li>
            <li>Modifier votre nom et votre mot de passe depuis les Paramètres</li>
            <li>Déconnecter Google Calendar à tout moment</li>
            <li>Supprimer définitivement votre compte et toutes vos données depuis les Paramètres</li>
          </ul>
        </div>

        <div>
          <h2 className="mb-1 text-base font-medium text-foreground">Conservation</h2>
          <p>
            Vos données sont conservées tant que votre compte existe. La suppression de votre
            compte entraîne la suppression définitive et immédiate de l&apos;ensemble de vos
            données associées.
          </p>
        </div>
      </div>
    </div>
  );
}
