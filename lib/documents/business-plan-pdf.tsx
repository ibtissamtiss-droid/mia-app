import { Document as PdfDocument, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { monthLabel, effectiveCotisationRate } from "@/lib/forecast";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#111111" },
  title: { fontSize: 20, fontWeight: 700 },
  subtitle: { fontSize: 10, color: "#666666", marginTop: 4, marginBottom: 24 },
  section: { marginBottom: 18 },
  heading: { fontSize: 13, fontWeight: 700, marginBottom: 6 },
  subheading: { fontSize: 11, fontWeight: 700, marginTop: 12, marginBottom: 4 },
  paragraph: { lineHeight: 1.5 },
  table: { marginTop: 8, borderTop: "1 solid #e5e5e5" },
  tableRow: { flexDirection: "row", borderBottom: "1 solid #e5e5e5", paddingVertical: 4 },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 4,
    borderBottom: "1 solid #111111",
    fontWeight: 700,
  },
  col: { flex: 1, textAlign: "right" },
  colMonth: { flex: 2 },
  colLabel: { flex: 2 },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 6,
    borderTop: "1 solid #111111",
    fontWeight: 700,
  },
  smallTotalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    paddingTop: 4,
    borderTop: "1 solid #111111",
    fontWeight: 700,
  },
});

type ForecastMonth = { month: string; revenue: number; expenses: number };
type LineItem = { label: string; amount: number };
type ProductRow = { name: string; unitPrice: number; unitCost: number; monthlyVolume: number };

type BusinessPlanPdfProps = {
  plan: {
    projectName: string;
    summary: string;
    presentation: string;
    offer: string;
    market: string;
    strategy: string;
  };
  forecast: {
    rate: number;
    months: ForecastMonth[];
    totals: { revenue: number; expenses: number; cotisations: number; net: number };
  };
  financials: {
    startupCosts: LineItem[];
    financingSources: LineItem[];
    monthlyCharges: LineItem[];
    productMargins: ProductRow[];
    rate: number;
    acreEligible: boolean;
  };
};

function formatCurrency(value: number) {
  return `${value.toFixed(2)} €`;
}

function LineItemsTable({ items }: { items: LineItem[] }) {
  const total = items.reduce((sum, i) => sum + i.amount, 0);
  if (items.length === 0) return <Text style={styles.paragraph}>Aucune ligne renseignée.</Text>;
  return (
    <View>
      <View style={styles.table}>
        {items.map((item, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={styles.colLabel}>{item.label}</Text>
            <Text style={styles.col}>{formatCurrency(item.amount)}</Text>
          </View>
        ))}
      </View>
      <View style={styles.smallTotalsRow}>
        <Text>Total</Text>
        <Text>{formatCurrency(total)}</Text>
      </View>
    </View>
  );
}

export function BusinessPlanPdf({ plan, forecast, financials }: BusinessPlanPdfProps) {
  const totalStartupCosts = financials.startupCosts.reduce((s, i) => s + i.amount, 0);
  const totalFinancing = financials.financingSources.reduce((s, i) => s + i.amount, 0);
  const totalMonthlyCharges = financials.monthlyCharges.reduce((s, i) => s + i.amount, 0);
  const monthlyRevenue = financials.productMargins.reduce((s, p) => s + p.unitPrice * p.monthlyVolume, 0);
  const monthlyMargin = financials.productMargins.reduce(
    (s, p) => s + (p.unitPrice - p.unitCost) * p.monthlyVolume,
    0
  );
  const financingGap = totalStartupCosts - totalFinancing;
  const effectiveRate = effectiveCotisationRate(financials.rate, financials.acreEligible);
  const monthlyCotisations = monthlyRevenue * (effectiveRate / 100);
  const monthlyResult = monthlyMargin - totalMonthlyCharges - monthlyCotisations;
  const breakevenMonths =
    financingGap > 0 && monthlyResult > 0 ? Math.ceil(financingGap / monthlyResult) : null;

  return (
    <PdfDocument>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{plan.projectName}</Text>
        <Text style={styles.subtitle}>Business plan</Text>

        <View style={styles.section}>
          <Text style={styles.heading}>Résumé</Text>
          <Text style={styles.paragraph}>{plan.summary}</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.heading}>Présentation du projet</Text>
          <Text style={styles.paragraph}>{plan.presentation}</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.heading}>L&apos;offre</Text>
          <Text style={styles.paragraph}>{plan.offer}</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.heading}>Marché cible et clientèle</Text>
          <Text style={styles.paragraph}>{plan.market}</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.heading}>Stratégie commerciale</Text>
          <Text style={styles.paragraph}>{plan.strategy}</Text>
        </View>

        <View style={styles.section} break>
          <Text style={styles.heading}>Chiffrage du projet</Text>

          <Text style={styles.subheading}>Besoins de démarrage</Text>
          <LineItemsTable items={financials.startupCosts} />

          <Text style={styles.subheading}>Plan de financement</Text>
          <LineItemsTable items={financials.financingSources} />
          <View style={styles.smallTotalsRow}>
            <Text>{financingGap > 0 ? "Reste à financer" : "Financement suffisant"}</Text>
            <Text>{formatCurrency(Math.abs(financingGap))}</Text>
          </View>

          <Text style={styles.subheading}>Charges mensuelles détaillées</Text>
          <LineItemsTable items={financials.monthlyCharges} />

          <Text style={styles.subheading}>Marge par produit / service</Text>
          {financials.productMargins.length === 0 ? (
            <Text style={styles.paragraph}>Aucun produit/service renseigné.</Text>
          ) : (
            <View>
              <View style={styles.tableHeader}>
                <Text style={styles.colLabel}>Produit / service</Text>
                <Text style={styles.col}>Prix</Text>
                <Text style={styles.col}>Coût</Text>
                <Text style={styles.col}>Volume/mois</Text>
                <Text style={styles.col}>Marge/mois</Text>
              </View>
              {financials.productMargins.map((p, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={styles.colLabel}>{p.name}</Text>
                  <Text style={styles.col}>{formatCurrency(p.unitPrice)}</Text>
                  <Text style={styles.col}>{formatCurrency(p.unitCost)}</Text>
                  <Text style={styles.col}>{p.monthlyVolume}</Text>
                  <Text style={styles.col}>{formatCurrency((p.unitPrice - p.unitCost) * p.monthlyVolume)}</Text>
                </View>
              ))}
              <View style={styles.smallTotalsRow}>
                <Text>Marge mensuelle totale</Text>
                <Text>{formatCurrency(monthlyMargin)}</Text>
              </View>
            </View>
          )}

          <Text style={styles.subheading}>Résultats</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={styles.colLabel}>CA mensuel estimé</Text>
              <Text style={styles.col}>{formatCurrency(monthlyRevenue)}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.colLabel}>Charges mensuelles</Text>
              <Text style={styles.col}>{formatCurrency(totalMonthlyCharges)}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.colLabel}>
                Cotisations estimées{financials.acreEligible ? " (ACRE)" : ""}
              </Text>
              <Text style={styles.col}>{formatCurrency(monthlyCotisations)}</Text>
            </View>
          </View>
          <View style={styles.smallTotalsRow}>
            <Text>Résultat mensuel net</Text>
            <Text>{formatCurrency(monthlyResult)}</Text>
          </View>
          <Text style={{ ...styles.paragraph, marginTop: 6 }}>
            {breakevenMonths !== null
              ? `Au rythme actuel, le financement de démarrage serait couvert en environ ${breakevenMonths} mois.`
              : financingGap <= 0
                ? "Le financement de démarrage est déjà couvert."
                : "Seuil de rentabilité non calculable en l'état des données saisies."}
          </Text>
        </View>

        <View style={styles.section} break>
          <Text style={styles.heading}>Prévisionnel financier (12 mois)</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.colMonth}>Mois</Text>
              <Text style={styles.col}>CA prévu</Text>
              <Text style={styles.col}>Dépenses</Text>
              <Text style={styles.col}>Cotisations</Text>
              <Text style={styles.col}>Net</Text>
            </View>
            {forecast.months.map((m) => {
              const cotisations = m.revenue * (forecast.rate / 100);
              const net = m.revenue - m.expenses - cotisations;
              return (
                <View key={m.month} style={styles.tableRow}>
                  <Text style={styles.colMonth}>{monthLabel(m.month)}</Text>
                  <Text style={styles.col}>{formatCurrency(m.revenue)}</Text>
                  <Text style={styles.col}>{formatCurrency(m.expenses)}</Text>
                  <Text style={styles.col}>{formatCurrency(cotisations)}</Text>
                  <Text style={styles.col}>{formatCurrency(net)}</Text>
                </View>
              );
            })}
          </View>
          <View style={styles.totalsRow}>
            <Text>Total sur 12 mois</Text>
            <Text>Net estimé: {formatCurrency(forecast.totals.net)}</Text>
          </View>
        </View>
      </Page>
    </PdfDocument>
  );
}
