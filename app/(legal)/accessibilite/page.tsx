export const metadata = { title: "Accessibilité — MIA" };

export default function AccessibilityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Accessibilité</h1>
        <p className="mt-1 text-sm text-muted-foreground">Notre engagement pour une app utilisable par tous.</p>
      </div>

      <div className="space-y-5 text-sm leading-relaxed text-muted-foreground">
        <p>
          Nous voulons que MIA soit utilisable par le plus grand nombre, quels que soient les
          besoins ou les outils d&apos;assistance utilisés.
        </p>

        <div>
          <h2 className="mb-1 text-base font-medium text-foreground">Ce que nous mettons en place</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Une base de composants d&apos;interface accessibles au clavier (menus, boîtes de dialogue, formulaires)</li>
            <li>Un mode sombre et un mode clair, pour s&apos;adapter à vos préférences visuelles</li>
            <li>Une interface responsive, utilisable aussi bien sur mobile que sur ordinateur</li>
            <li>Une structure HTML sémantique pour une meilleure compatibilité avec les lecteurs d&apos;écran</li>
          </ul>
        </div>

        <div>
          <h2 className="mb-1 text-base font-medium text-foreground">Un travail en cours</h2>
          <p>
            MIA n&apos;a pas encore fait l&apos;objet d&apos;un audit d&apos;accessibilité formel (type
            RGAA ou WCAG). L&apos;accessibilité est un effort continu : si vous rencontrez une
            difficulté pour utiliser l&apos;application, nous vous encourageons à nous en faire part
            afin que nous puissions l&apos;améliorer.
          </p>
        </div>
      </div>
    </div>
  );
}
