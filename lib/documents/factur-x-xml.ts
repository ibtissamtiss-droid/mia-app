/**
 * Hand-built EN 16931 Cross Industry Invoice (CII) XML for Factur-X.
 *
 * Element order below follows the official Factur-X 1.09 EN16931 XSD
 * (ReusableAggregateBusinessInformationEntity) exactly — XSD sequences are
 * strict, so this isn't just "readable order", it's required for the file
 * to validate.
 */

export type FacturXParty = {
  name: string;
  address: string | null;
  siren?: string | null;
};

export type FacturXLine = {
  description: string;
  quantity: number;
  unitPrice: number;
};

export type FacturXInvoice = {
  number: string;
  issueDate: Date;
  dueDate: Date | null;
  taxRate: number;
  vatApplicable: boolean;
  lines: FacturXLine[];
  seller: FacturXParty;
  buyer: FacturXParty;
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatDate102(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function fmt(value: number): string {
  return value.toFixed(2);
}

function partyXml(party: FacturXParty, tag: "SellerTradeParty" | "BuyerTradeParty"): string {
  const legalOrg = party.siren
    ? `<ram:SpecifiedLegalOrganization><ram:ID schemeID="0002">${escapeXml(party.siren)}</ram:ID></ram:SpecifiedLegalOrganization>`
    : "";
  const address = party.address
    ? `<ram:PostalTradeAddress><ram:LineOne>${escapeXml(party.address)}</ram:LineOne><ram:CountryID>FR</ram:CountryID></ram:PostalTradeAddress>`
    : "";
  // BR-FR-12/13 (BT-34/BT-49): the French e-invoicing reform requires each
  // party's electronic address (used to route the invoice) — for France
  // this is the Peppol scheme "0225" with the SIREN. We only know our own
  // seller's SIREN, not the buyer's, so this is seller-only for now.
  const uri =
    tag === "SellerTradeParty" && party.siren
      ? `<ram:URIUniversalCommunication><ram:URIID schemeID="0225">${escapeXml(party.siren)}</ram:URIID></ram:URIUniversalCommunication>`
      : "";
  // BR-E-02 (EN16931): a VAT-exempt line requires the seller's VAT id and/or
  // tax registration id. Franchise-en-base sellers have no VAT number, so we
  // report the SIREN as the tax registration id (scheme "FC") instead.
  const taxRegistration =
    tag === "SellerTradeParty" && party.siren
      ? `<ram:SpecifiedTaxRegistration><ram:ID schemeID="FC">${escapeXml(party.siren)}</ram:ID></ram:SpecifiedTaxRegistration>`
      : "";
  return (
    `<ram:${tag}>` +
    `<ram:Name>${escapeXml(party.name)}</ram:Name>` +
    legalOrg +
    address +
    uri +
    taxRegistration +
    `</ram:${tag}>`
  );
}

export function buildFacturXXml(invoice: FacturXInvoice): string {
  const rate = invoice.vatApplicable ? invoice.taxRate : 0;
  const categoryCode = invoice.vatApplicable ? "S" : "E";
  const exemption = invoice.vatApplicable
    ? ""
    : `<ram:ExemptionReason>Exonération de TVA, art. 293 B du CGI</ram:ExemptionReason>`;
  const exemptionCode = invoice.vatApplicable ? "" : `<ram:ExemptionReasonCode>VATEX-FR-FRANCHISE</ram:ExemptionReasonCode>`;

  const lineAmounts = invoice.lines.map((line) => round2(line.quantity * line.unitPrice));
  const subtotal = round2(lineAmounts.reduce((sum, v) => sum + v, 0));
  const taxAmount = invoice.vatApplicable ? round2(subtotal * (rate / 100)) : 0;
  const grandTotal = round2(subtotal + taxAmount);

  const lineItemsXml = invoice.lines
    .map((line, index) => {
      const lineTotal = lineAmounts[index];
      return (
        `<ram:IncludedSupplyChainTradeLineItem>` +
        `<ram:AssociatedDocumentLineDocument><ram:LineID>${index + 1}</ram:LineID></ram:AssociatedDocumentLineDocument>` +
        `<ram:SpecifiedTradeProduct><ram:Name>${escapeXml(line.description)}</ram:Name></ram:SpecifiedTradeProduct>` +
        `<ram:SpecifiedLineTradeAgreement><ram:NetPriceProductTradePrice><ram:ChargeAmount>${fmt(line.unitPrice)}</ram:ChargeAmount></ram:NetPriceProductTradePrice></ram:SpecifiedLineTradeAgreement>` +
        `<ram:SpecifiedLineTradeDelivery><ram:BilledQuantity unitCode="C62">${line.quantity}</ram:BilledQuantity></ram:SpecifiedLineTradeDelivery>` +
        `<ram:SpecifiedLineTradeSettlement>` +
        `<ram:ApplicableTradeTax>` +
        `<ram:TypeCode>VAT</ram:TypeCode>` +
        exemption +
        `<ram:CategoryCode>${categoryCode}</ram:CategoryCode>` +
        exemptionCode +
        `<ram:RateApplicablePercent>${fmt(rate)}</ram:RateApplicablePercent>` +
        `</ram:ApplicableTradeTax>` +
        `<ram:SpecifiedTradeSettlementLineMonetarySummation><ram:LineTotalAmount>${fmt(lineTotal)}</ram:LineTotalAmount></ram:SpecifiedTradeSettlementLineMonetarySummation>` +
        `</ram:SpecifiedLineTradeSettlement>` +
        `</ram:IncludedSupplyChainTradeLineItem>`
      );
    })
    .join("");

  // BR-FR-05 (BT-22): French invoices must state the late-payment penalty
  // rate, the flat recovery-cost indemnity, and the early-payment discount
  // (or its absence) — the same mentions already shown on the visible PDF.
  const legalNotesXml =
    `<ram:IncludedNote><ram:Content>Une pénalité de retard est exigible : taux applicable 3 fois le taux d'intérêt légal.</ram:Content><ram:SubjectCode>PMD</ram:SubjectCode></ram:IncludedNote>` +
    `<ram:IncludedNote><ram:Content>Indemnité forfaitaire pour frais de recouvrement de 40 € (art. L441-10 et D441-5 du Code de commerce).</ram:Content><ram:SubjectCode>PMT</ram:SubjectCode></ram:IncludedNote>` +
    `<ram:IncludedNote><ram:Content>Pas d'escompte pour paiement anticipé.</ram:Content><ram:SubjectCode>AAB</ram:SubjectCode></ram:IncludedNote>`;

  const paymentTermsXml = invoice.dueDate
    ? `<ram:SpecifiedTradePaymentTerms><ram:DueDateDateTime><udt:DateTimeString format="102">${formatDate102(invoice.dueDate)}</udt:DateTimeString></ram:DueDateDateTime></ram:SpecifiedTradePaymentTerms>`
    : "";

  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<rsm:CrossIndustryInvoice ` +
    `xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100" ` +
    `xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100" ` +
    `xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100" ` +
    `xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100">` +
    `<rsm:ExchangedDocumentContext>` +
    `<ram:GuidelineSpecifiedDocumentContextParameter><ram:ID>urn:cen.eu:en16931:2017</ram:ID></ram:GuidelineSpecifiedDocumentContextParameter>` +
    `</rsm:ExchangedDocumentContext>` +
    `<rsm:ExchangedDocument>` +
    `<ram:ID>${escapeXml(invoice.number)}</ram:ID>` +
    `<ram:TypeCode>380</ram:TypeCode>` +
    `<ram:IssueDateTime><udt:DateTimeString format="102">${formatDate102(invoice.issueDate)}</udt:DateTimeString></ram:IssueDateTime>` +
    legalNotesXml +
    `</rsm:ExchangedDocument>` +
    `<rsm:SupplyChainTradeTransaction>` +
    lineItemsXml +
    `<ram:ApplicableHeaderTradeAgreement>` +
    partyXml(invoice.seller, "SellerTradeParty") +
    partyXml(invoice.buyer, "BuyerTradeParty") +
    `</ram:ApplicableHeaderTradeAgreement>` +
    `<ram:ApplicableHeaderTradeDelivery/>` +
    `<ram:ApplicableHeaderTradeSettlement>` +
    `<ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>` +
    `<ram:ApplicableTradeTax>` +
    `<ram:CalculatedAmount>${fmt(taxAmount)}</ram:CalculatedAmount>` +
    `<ram:TypeCode>VAT</ram:TypeCode>` +
    exemption +
    `<ram:BasisAmount>${fmt(subtotal)}</ram:BasisAmount>` +
    `<ram:CategoryCode>${categoryCode}</ram:CategoryCode>` +
    exemptionCode +
    `<ram:RateApplicablePercent>${fmt(rate)}</ram:RateApplicablePercent>` +
    `</ram:ApplicableTradeTax>` +
    paymentTermsXml +
    `<ram:SpecifiedTradeSettlementHeaderMonetarySummation>` +
    `<ram:LineTotalAmount>${fmt(subtotal)}</ram:LineTotalAmount>` +
    `<ram:TaxBasisTotalAmount>${fmt(subtotal)}</ram:TaxBasisTotalAmount>` +
    `<ram:TaxTotalAmount currencyID="EUR">${fmt(taxAmount)}</ram:TaxTotalAmount>` +
    `<ram:GrandTotalAmount>${fmt(grandTotal)}</ram:GrandTotalAmount>` +
    `<ram:DuePayableAmount>${fmt(grandTotal)}</ram:DuePayableAmount>` +
    `</ram:SpecifiedTradeSettlementHeaderMonetarySummation>` +
    `</ram:ApplicableHeaderTradeSettlement>` +
    `</rsm:SupplyChainTradeTransaction>` +
    `</rsm:CrossIndustryInvoice>`
  );
}
