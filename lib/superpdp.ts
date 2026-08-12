/**
 * Client for the SUPER PDP (Plateforme Agréée) public invoice validator.
 * https://superpdp.tech/documentation/2 — /v1.beta/validation_reports is
 * unauthenticated (declared `security: []` in their OpenAPI spec), so no
 * OAuth token is needed for validation, only for actually sending invoices.
 */

const ENDPOINT = process.env.SUPERPDP_ENDPOINT || "https://api.superpdp.tech";

export type FacturXValidationIssue = { message: string; location?: string };
export type FacturXValidationResult = {
  isValid: boolean;
  format: string;
  issues: FacturXValidationIssue[];
};

type ValidationReportResponse = {
  data: Array<{
    is_valid: boolean;
    format: string;
    subreports: Array<{
      failures: Array<{ message: string; location?: string }>;
    }>;
  }>;
};

export async function validateFacturX(pdfBytes: Uint8Array, fileName = "facture.pdf"): Promise<FacturXValidationResult> {
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" }), fileName);

  const res = await fetch(`${ENDPOINT}/v1.beta/validation_reports`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    throw new Error(`Échec de la validation SUPER PDP (HTTP ${res.status})`);
  }

  const body = (await res.json()) as ValidationReportResponse;
  const report = body.data[0];
  const issues = report.subreports.flatMap((subreport) =>
    subreport.failures.map((failure) => ({ message: failure.message, location: failure.location }))
  );

  return { isValid: report.is_valid, format: report.format, issues };
}
