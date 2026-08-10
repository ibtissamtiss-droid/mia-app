export function buildResetPasswordHtml({ resetUrl }: { resetUrl: string }) {
  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
    <p style="margin:0 0 4px;font-size:20px;font-weight:700;">Réinitialiser votre mot de passe</p>
    <p style="margin:0 0 20px;font-size:14px;color:#666;">
      Vous avez demandé à réinitialiser votre mot de passe MIA. Ce lien est valable 1 heure.
    </p>
    <p style="margin:0 0 24px;">
      <a href="${resetUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-size:14px;">Choisir un nouveau mot de passe</a>
    </p>
    <p style="margin:0;font-size:12px;color:#999;">
      Si vous n&apos;êtes pas à l&apos;origine de cette demande, vous pouvez ignorer cet email —
      votre mot de passe ne sera pas modifié.
    </p>
  </div>`;
}
