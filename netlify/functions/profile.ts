// GET/POST /api/profile
import type { Handler } from "@netlify/functions";
import { sql, getOrCreateUser, isValidDeviceId, json } from "./_db";

export const handler: Handler = async (event) => {
  const q = event.queryStringParameters || {};
  const body = event.httpMethod === "POST" ? JSON.parse(event.body || "{}") : {};
  const device = q.device || body.device;
  if (!isValidDeviceId(device)) return json(400, { error: "device invalide" });
  const userId = await getOrCreateUser(device);

  if (event.httpMethod === "POST") {
    await sql`
      insert into style_profiles (user_id, sizes, budget_max_cents, filters, style_vector, updated_at)
      values (${userId}, ${JSON.stringify(body.sizes || {})}::jsonb,
              ${body.budgetMaxCents || null},
              ${JSON.stringify(body.filters || {})}::jsonb,
              ${JSON.stringify(body.styleVector || {})}::jsonb, now())
      on conflict (user_id) do update set
        sizes = excluded.sizes,
        budget_max_cents = excluded.budget_max_cents,
        filters = excluded.filters,
        style_vector = excluded.style_vector,
        updated_at = now()
    `;
    return json(200, { ok: true });
  }

  const rows = await sql`select * from style_profiles where user_id = ${userId}`;
  return json(200, { profile: rows[0] || null });
};
