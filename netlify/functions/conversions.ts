// F3 - Postback serveur Awin -> /api/conversions?clickref=xxx&commission=1.23&value=45.00&network=awin
// A declarer dans Awin > Account > Tracking (server-to-server). Idem Skimlinks (param xcust).
import { sql, json } from "./_db";

export default async (req: Request) => {
  const u = new URL(req.url);
  const clickref = u.searchParams.get("clickref") || u.searchParams.get("xcust");
  if (!clickref) return json(400, { error: "clickref requis" });

  const clicks = await sql`select id from clicks where subid = ${clickref}`;
  if (clicks.length === 0) return json(404, { error: "clic inconnu" });

  await sql`
    insert into conversions (click_id, network, order_value_cents, commission_cents)
    values (${clicks[0].id}, ${u.searchParams.get("network") || "awin"},
            ${Math.round(parseFloat(u.searchParams.get("value") || "0") * 100)},
            ${Math.round(parseFloat(u.searchParams.get("commission") || "0") * 100)})
  `;
  return json(200, { ok: true });
};
