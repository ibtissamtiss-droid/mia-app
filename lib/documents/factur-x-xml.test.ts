import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { validateXML } from "xmllint-wasm";
import { buildFacturXXml, type FacturXInvoice } from "./factur-x-xml";

const XSD_DIR = join(__dirname, "factur-x-schema");

function readXsd(fileName: string) {
  return { fileName, contents: readFileSync(join(XSD_DIR, fileName), "utf-8") };
}

async function validate(xml: string) {
  return validateXML({
    xml: { fileName: "invoice.xml", contents: xml },
    schema: readXsd("Factur-X_EN16931.xsd"),
    preload: [
      readXsd("Factur-X_1.09_EN16931_urn_un_unece_uncefact_data_standard_QualifiedDataType_100.xsd"),
      readXsd(
        "Factur-X_1.09_EN16931_urn_un_unece_uncefact_data_standard_ReusableAggregateBusinessInformationEntity_100.xsd"
      ),
      readXsd("Factur-X_1.09_EN16931_urn_un_unece_uncefact_data_standard_UnqualifiedDataType_100.xsd"),
    ],
  });
}

const baseInvoice: FacturXInvoice = {
  number: "FAC-2026-0001",
  issueDate: new Date(2026, 7, 12),
  dueDate: new Date(2026, 8, 11),
  taxRate: 21.1,
  vatApplicable: false,
  lines: [
    { description: "Prestation de conseil", quantity: 2, unitPrice: 500 },
    { description: "Création de logo", quantity: 1, unitPrice: 300 },
  ],
  seller: { name: "Atelier Ibtissam Design", address: "12 rue de la Paix, 75002 Paris", siren: "123456789" },
  buyer: { name: "Client Test SARL", address: "5 avenue des Champs, 69000 Lyon" },
};

describe("buildFacturXXml — EN16931 XSD validation", () => {
  it("produces schema-valid XML for a VAT-exempt invoice (franchise en base)", async () => {
    const xml = buildFacturXXml(baseInvoice);
    const result = await validate(xml);
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it("produces schema-valid XML for a VAT-applicable invoice", async () => {
    const xml = buildFacturXXml({ ...baseInvoice, vatApplicable: true, taxRate: 20 });
    const result = await validate(xml);
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it("produces schema-valid XML with minimal data (no address, no SIREN, no due date)", async () => {
    const xml = buildFacturXXml({
      ...baseInvoice,
      dueDate: null,
      seller: { name: "Test Entreprise", address: null, siren: null },
      buyer: { name: "Un Client", address: null },
      lines: [{ description: "Abonnement mensuel", quantity: 1, unitPrice: 99.99 }],
    });
    const result = await validate(xml);
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it("produces schema-valid XML with several line items and decimal quantities", async () => {
    const xml = buildFacturXXml({
      ...baseInvoice,
      vatApplicable: true,
      taxRate: 20,
      lines: [
        { description: "Heures de développement", quantity: 12.5, unitPrice: 65 },
        { description: "Hébergement", quantity: 1, unitPrice: 15.9 },
        { description: "Nom de domaine", quantity: 2, unitPrice: 12 },
      ],
    });
    const result = await validate(xml);
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });
}, 20000);

describe("buildFacturXXml — content", () => {
  it("uses category E and the franchise exemption code when VAT isn't applicable", () => {
    const xml = buildFacturXXml(baseInvoice);
    expect(xml).toContain("<ram:CategoryCode>E</ram:CategoryCode>");
    expect(xml).toContain("VATEX-FR-FRANCHISE");
    expect(xml).toContain("art. 293 B du CGI");
  });

  it("uses category S and the real rate when VAT is applicable", () => {
    const xml = buildFacturXXml({ ...baseInvoice, vatApplicable: true, taxRate: 20 });
    expect(xml).toContain("<ram:CategoryCode>S</ram:CategoryCode>");
    expect(xml).toContain("<ram:RateApplicablePercent>20.00</ram:RateApplicablePercent>");
    expect(xml).not.toContain("VATEX-FR-FRANCHISE");
  });

  it("computes totals correctly from line items", () => {
    const xml = buildFacturXXml({ ...baseInvoice, vatApplicable: true, taxRate: 20 });
    // subtotal = 2*500 + 1*300 = 1300, tax = 260, grand total = 1560
    expect(xml).toContain("<ram:TaxBasisTotalAmount>1300.00</ram:TaxBasisTotalAmount>");
    expect(xml).toContain('<ram:TaxTotalAmount currencyID="EUR">260.00</ram:TaxTotalAmount>');
    expect(xml).toContain("<ram:GrandTotalAmount>1560.00</ram:GrandTotalAmount>");
  });

  it("escapes XML special characters in text fields", () => {
    const xml = buildFacturXXml({
      ...baseInvoice,
      buyer: { name: 'Client "Le Meilleur" & Fils <SARL>', address: null },
    });
    expect(xml).toContain("&quot;Le Meilleur&quot;");
    expect(xml).toContain("&amp; Fils");
    expect(xml).toContain("&lt;SARL&gt;");
    expect(xml).not.toContain("<SARL>");
  });
});
