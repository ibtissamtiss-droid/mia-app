import { Document as PdfDocument, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { documentTotals, type BillingDocument } from "@/types/models";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#111111" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  title: { fontSize: 20, fontWeight: 700 },
  subtitle: { fontSize: 10, color: "#666666", marginTop: 4 },
  section: { marginBottom: 16 },
  label: { fontSize: 9, color: "#666666", marginBottom: 2, textTransform: "uppercase" },
  row: { flexDirection: "row", justifyContent: "space-between" },
  table: { marginTop: 8, borderTop: "1 solid #e5e5e5" },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1 solid #e5e5e5",
    paddingVertical: 6,
  },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottom: "1 solid #111111",
    fontWeight: 700,
  },
  colDescription: { flex: 3 },
  colQty: { flex: 1, textAlign: "right" },
  colPrice: { flex: 1, textAlign: "right" },
  colTotal: { flex: 1, textAlign: "right" },
  totals: { marginTop: 16, alignItems: "flex-end" },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", width: 200, marginBottom: 2 },
  totalsGrandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 200,
    marginTop: 4,
    paddingTop: 4,
    borderTop: "1 solid #111111",
    fontWeight: 700,
  },
  notes: { marginTop: 24, fontSize: 9, color: "#666666" },
});

const TYPE_LABEL = { QUOTE: "Devis", INVOICE: "Facture" };
const STATUS_LABEL = { DRAFT: "Brouillon", SENT: "Envoyé", PAID: "Payé", CANCELLED: "Annulé" };

function formatCurrency(value: number) {
  return `${value.toFixed(2)} €`;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fr-FR");
}

export function DocumentPdf({ document }: { document: BillingDocument }) {
  const { subtotal, tax, total } = documentTotals(document);

  return (
    <PdfDocument>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{TYPE_LABEL[document.type]}</Text>
            <Text style={styles.subtitle}>{document.number}</Text>
          </View>
          <View>
            <Text style={styles.label}>Statut</Text>
            <Text>{STATUS_LABEL[document.status]}</Text>
          </View>
        </View>

        <View style={[styles.section, styles.row]}>
          <View>
            <Text style={styles.label}>Client</Text>
            <Text>{document.clientName}</Text>
            {document.clientEmail && <Text>{document.clientEmail}</Text>}
            {document.clientAddress && <Text>{document.clientAddress}</Text>}
          </View>
          <View>
            <Text style={styles.label}>Date d&apos;émission</Text>
            <Text>{formatDate(document.issueDate)}</Text>
            {document.dueDate && (
              <>
                <Text style={[styles.label, { marginTop: 8 }]}>Échéance</Text>
                <Text>{formatDate(document.dueDate)}</Text>
              </>
            )}
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDescription}>Description</Text>
            <Text style={styles.colQty}>Qté</Text>
            <Text style={styles.colPrice}>Prix unit.</Text>
            <Text style={styles.colTotal}>Total</Text>
          </View>
          {document.items.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={styles.colDescription}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>{formatCurrency(item.unitPrice)}</Text>
              <Text style={styles.colTotal}>{formatCurrency(item.quantity * item.unitPrice)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalsRow}>
            <Text>Sous-total</Text>
            <Text>{formatCurrency(subtotal)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text>TVA ({document.taxRate}%)</Text>
            <Text>{formatCurrency(tax)}</Text>
          </View>
          <View style={styles.totalsGrandRow}>
            <Text>Total</Text>
            <Text>{formatCurrency(total)}</Text>
          </View>
        </View>

        {document.notes && (
          <View style={styles.notes}>
            <Text style={styles.label}>Notes</Text>
            <Text>{document.notes}</Text>
          </View>
        )}
      </Page>
    </PdfDocument>
  );
}
