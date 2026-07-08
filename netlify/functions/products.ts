// GET /api/products?device=xxx&gender=women&categories=dress,top&budget=5000
import type { Handler } from "@netlify/functions";
import { sql, getOrCreateUser, isValidDeviceId, json } from "./_db";

export const handler: Handler = async (event) => {
  const p = event.queryStringParameters || {};
  const device = p.device;
  if (!isValidDeviceId(device)) return json(400, { error: "device invalide" });

  const userId = await getOrCreateUser(device);
  const gender = p.gender || "women";
  const budget = Number(p.budget || 0);
  const cats = (p.categories || "").split(",").filter(Boolean);

  const prof = await sql`select style_vector from style_profiles where user_id = ${userId}`;
  const vector: Record<string, number> = prof[0]?.style_vector || {};

  const rows = await sql`
    with scored as (
      select p.id, p.title, p.brand, p.category, p.price_cents, p.currency,
             p.image_url, p.tags, m.name as merchant,
        coalesce((
          select sum((${JSON.stringify(vector)}::jsonb ->> t)::numeric)
          from jsonb_array_elements_text(p.tags) t
          where ${JSON.stringify(vector)}::jsonb ? t
        ), 0) as affinity,
        greatest(0, 14 - extract(day from now() - p.updated_at)) / 14.0 as freshness
      from products p
      join merchants m on m.id = p.merchant_id
      where p.in_stock
        and p.gender = ${gender}
        and (${cats.length === 0} or p.category = any(${cats}))
        and (${budget === 0} or p.price_cents <= ${budget})
        and not exists (
          select 1 from swipes s where s.user_id = ${userId} and s.product_id = p.id
        )
    )
    select id, title, brand, category, price_cents, currency, image_url, merchant
    from scored
    order by (affinity * 2 + freshness + random() * 0.5) desc
    limit 20
  `;
  return json(200, { userId, products: rows });
};
