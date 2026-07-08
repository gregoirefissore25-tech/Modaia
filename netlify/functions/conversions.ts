// GET /api/conversions?clickref=xxx&commission=1.23&value=45.00&network=awin
import type { Handler } from "@netlify/functions";
import { sql, json } from "./_db";

export const handler: Handler = async (event) => {
  const q = event.queryStringParameters || {};

  // Verification optionnelle : le subid/clickref (uuid) transite dans l'url de
  // redirection affiliee, donc potentiellement visible par l'utilisateur final, qui
  // pourrait rejouer cet appel pour forger une fausse conversion. Si POSTBACK_SECRET
  // est configure (variable d'env Netlify), on exige aussi ce secret en query param
  // (a ajouter au template d'URL de postback configure cote Awin/Skimlinks). Tant que
  // la variable n'est pas definie, le comportement reste inchange (retro-compatible).
  const postbackSecret = process.env.POSTBACK_SECRET;
  if (postbackSecret && q.secret !== postbackSecret) return json(401, { error: "non autorise" });

  const clickref = q.clickref || q.xcust;
  if (!clickref) return json(400, { error: "clickref requis" });

  const clicks = await sql`select id from clicks where subid = ${clickref}`;
  if (clicks.length === 0) return json(404, { error: "clic inconnu" });

  await sql`
    insert into conversions (click_id, network, order_value_cents, commission_cents)
    values (${clicks[0].id}, ${q.network || "awin"},
            ${Math.round(parseFloat(q.value || "0") * 100)},
            ${Math.round(parseFloat(q.commission || "0") * 100)})
  `;
  return json(200, { ok: true });
};
