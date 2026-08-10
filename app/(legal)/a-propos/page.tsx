export const metadata = { title: "À propos — MIA" };

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">À propos de MIA</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Votre assistant personnel de productivité.
        </p>
      </div>

      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          MIA est une application pensée pour aider les professionnels à organiser leur travail
          au quotidien : gestion de tâches, calendrier, prise de notes, assistant IA
          conversationnel, et suivi de devis &amp; factures — le tout réuni dans un seul outil.
        </p>

        <div>
          <h2 className="mb-1 text-base font-medium text-foreground">Ce que propose MIA</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Gestion de tâches avec vue kanban glisser-déposer</li>
            <li>Calendrier (vues mois et semaine), synchronisable avec Google Calendar</li>
            <li>Prise de notes avec résumés générés par IA</li>
            <li>Assistant conversationnel pour organiser votre travail</li>
            <li>Devis et factures avec export PDF</li>
            <li>Rappels quotidiens par email pour les échéances importantes</li>
          </ul>
        </div>

        <div>
          <h2 className="mb-1 text-base font-medium text-foreground">Le projet</h2>
          <p>
            MIA est un projet indépendant en développement actif. De nouvelles fonctionnalités
            sont ajoutées régulièrement, et votre retour est le bienvenu pour orienter la suite.
          </p>
        </div>
      </div>
    </div>
  );
}
