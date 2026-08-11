import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { generateRawToken, hashToken } from "@/lib/tokens";
import { resend, EMAIL_FROM } from "@/lib/email/resend";
import { buildResetPasswordHtml } from "@/lib/email/reset-password";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const { allowed } = await checkRateLimit(
    `forgot-password:${getClientIp(req)}`,
    5,
    60 * 60 * 1000
  );
  if (!allowed) return rateLimitResponse();

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

  if (user) {
    const rawToken = generateRawToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    const appUrl = new URL(req.url).origin;
    const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;

    await resend.emails.send({
      from: EMAIL_FROM,
      to: user.email,
      subject: "Réinitialisez votre mot de passe MIA",
      html: buildResetPasswordHtml({ resetUrl }),
    });
  }

  // Always return the same response, whether or not the email exists,
  // so the endpoint can't be used to enumerate registered accounts.
  return NextResponse.json({ ok: true });
}
