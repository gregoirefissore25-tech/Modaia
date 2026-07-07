// GET /api/conversions?clickref=xxx&commission=1.23&value=45.00&network=awin
import type { Handler } from "@netlify/functions";
import { sql, json } from "./_db";

export const handler: Handler = async (event) => {
  const q = event.queryStringParameters || {};
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
