/**
 * Client for the SUPER PDP (Plateforme Agréée) public invoice validator.
 * https://superpdp.tech/documentation/2 — /v1.beta/validation_reports is
 * unauthenticated (declared `security: []` in their OpenAPI spec), so no
 * OAuth token is needed for validation, only for actually sending invoices.
 */

const ENDPOINT = process.env.SUPERPDP_ENDPOINT || "https://api.superpdp.tech";

export type FacturXValidationIssue = { message: string; location?: string };
export type FacturXValidationResult = {
  // Computed from `failures` only. SUPER PDP's own `is_valid` flag turns
  // false on any warning too (e.g. stylistic Peppol rules), which would
  // make a genuinely compliant invoice look broken.
  isValid: boolean;
  format: string;
  failures: FacturXValidationIssue[];
  warnings: FacturXValidationIssue[];
};

type ValidationReportResponse = {
  data: Array<{
    format: string;
    subreports: Array<{
      failures: Array<{ message: string; location?: string }>;
      messages: Array<{ message: string; location?: string }>;
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
  const failures = report.subreports.flatMap((subreport) =>
    subreport.failures.map((f) => ({ message: f.message, location: f.location }))
  );
  const warnings = report.subreports.flatMap((subreport) =>
    subreport.messages.map((m) => ({ message: m.message, location: m.location }))
  );

  return { isValid: failures.length === 0, format: report.format, failures, warnings };
}

// --- Authenticated calls (client_credentials) — used to actually submit an
// invoice, as opposed to the public validator above. The app currently only
// has a sandbox "Confidentielle" application, tied to a fictional test
// company (not the user's real business) — see submitInvoice's docstring.

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.value;
  }
  const clientId = process.env.SUPERPDP_CLIENT_ID;
  const clientSecret = process.env.SUPERPDP_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("SUPERPDP_CLIENT_ID / SUPERPDP_CLIENT_SECRET manquants");
  }

  const res = await fetch(`${ENDPOINT}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }).toString(),
  });
  if (!res.ok) {
    throw new Error(`Échec de l'authentification SUPER PDP (HTTP ${res.status})`);
  }
  const body = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 };
  return cachedToken.value;
}

export async function getSuperPdpCompanyName(): Promise<string> {
  const token = await getAccessToken();
  const res = await fetch(`${ENDPOINT}/v1.beta/companies/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`Échec de récupération de l'entreprise SUPER PDP (HTTP ${res.status})`);
  }
  const body = (await res.json()) as { formal_name: string; env: string };
  return body.formal_name;
}

export type SubmitInvoiceResult = { invoiceId: string; companyName: string };

/**
 * Submits a Factur-X PDF to SUPER PDP for transmission.
 *
 * IMPORTANT: with only a sandbox application on a fictional test company
 * (see .env), SUPER PDP authenticates this call as that fictional company —
 * not as the user's real business, even though the invoice XML correctly
 * names her real business as the seller. This proves the integration works,
 * it does not put a real invoice in front of a real client. Real sending
 * needs a production application tied to her actual SIREN.
 */
export async function submitInvoice(pdfBytes: Uint8Array): Promise<SubmitInvoiceResult> {
  const token = await getAccessToken();
  const companyName = await getSuperPdpCompanyName();

  const res = await fetch(`${ENDPOINT}/v1.beta/invoices`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/pdf",
    },
    body: new Uint8Array(pdfBytes),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Échec de l'envoi SUPER PDP (HTTP ${res.status})${text ? `: ${text}` : ""}`);
  }
  const body = (await res.json()) as { id: number | string };
  return { invoiceId: String(body.id), companyName };
}
