type DigestTask = { title: string; dueDate: Date | null };
type DigestEvent = { title: string; startTime: Date };

export function buildReminderDigestHtml({
  userName,
  overdueTasks,
  dueTodayTasks,
  todayEvents,
  appUrl,
}: {
  userName: string | null;
  overdueTasks: DigestTask[];
  dueTodayTasks: DigestTask[];
  todayEvents: DigestEvent[];
  appUrl: string;
}) {
  const section = (title: string, items: string[]) =>
    items.length === 0
      ? ""
      : `
        <tr><td style="padding-top:20px;">
          <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#666;text-transform:uppercase;letter-spacing:0.02em;">${title}</p>
          <ul style="margin:0;padding-left:18px;color:#111;font-size:14px;line-height:1.6;">
            ${items.map((i) => `<li>${i}</li>`).join("")}
          </ul>
        </td></tr>`;

  const overdueHtml = section(
    "En retard",
    overdueTasks.map((t) => t.title)
  );
  const dueTodayHtml = section(
    "À faire aujourd'hui",
    dueTodayTasks.map((t) => t.title)
  );
  const eventsHtml = section(
    "Événements aujourd'hui",
    todayEvents.map(
      (e) =>
        `${e.title} — ${e.startTime.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
    )
  );

  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
    <p style="margin:0 0 4px;font-size:20px;font-weight:700;">Bonjour${userName ? ` ${userName}` : ""},</p>
    <p style="margin:0 0 16px;font-size:14px;color:#666;">Voici votre récapitulatif du jour.</p>
    <table style="width:100%;border-collapse:collapse;">
      ${overdueHtml}
      ${dueTodayHtml}
      ${eventsHtml}
    </table>
    <p style="margin:24px 0 0;">
      <a href="${appUrl}/dashboard" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-size:14px;">Ouvrir MIA</a>
    </p>
  </div>`;
}
