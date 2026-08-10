import { Document as PdfDocument, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { monthLabel } from "@/lib/forecast";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#111111" },
  title: { fontSize: 20, fontWeight: 700 },
  subtitle: { fontSize: 10, color: "#666666", marginTop: 4, marginBottom: 24 },
  section: { marginBottom: 18 },
  heading: { fontSize: 13, fontWeight: 700, marginBottom: 6 },
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
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 6,
    borderTop: "1 solid #111111",
    fontWeight: 700,
  },
});

type ForecastMonth = { month: string; revenue: number; expenses: number };

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
};

function formatCurrency(value: number) {
  return `${value.toFixed(2)} €`;
}

export function BusinessPlanPdf({ plan, forecast }: BusinessPlanPdfProps) {
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
