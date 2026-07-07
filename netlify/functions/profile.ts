// GET/POST /api/profile : profil de style (tailles, budget, filtres, style_vector onboarding)
import { sql, getOrCreateUser, json } from "./_db";

export default async (req: Request) => {
  const u = new URL(req.url);
  const device =
    u.searchParams.get("device") ||
    (req.method === "POST" ? (await req.clone().json()).device : null);
  if (!device) return json(400, { error: "device requis" });
  const userId = await getOrCreateUser(device);

  if (req.method === "POST") {
    const body = await req.json();
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
