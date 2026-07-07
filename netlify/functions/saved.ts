// GET /api/saved?device=xxx
import type { Handler } from "@netlify/functions";
import { sql, getOrCreateUser, json } from "./_db";

export const handler: Handler = async (event) => {
  const device = (event.queryStringParameters || {}).device;
  if (!device) return json(400, { error: "device requis" });

  const userId = await getOrCreateUser(device);
  const rows = await sql`
    select p.id, p.title, p.brand, p.category, p.price_cents, p.currency,
           p.image_url, m.id as merchant_id, m.name as merchant
    from swipes s
    join products p on p.id = s.product_id
    join merchants m on m.id = p.merchant_id
    where s.user_id = ${userId} and s.action in ('like','save')
    order by m.name, s.created_at desc
  `;
  return json(200, { items: rows });
};
