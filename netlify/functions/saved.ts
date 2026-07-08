// GET /api/saved?device=xxx
import type { Handler } from "@netlify/functions";
import { sql, getOrCreateUser, isValidDeviceId, checkRateLimit, json } from "./_db";

const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_S = 300;

export const handler: Handler = async (event) => {
  const device = (event.queryStringParameters || {}).device;
  if (!isValidDeviceId(device)) return json(400, { error: "device invalide" });
  if (!(await checkRateLimit("saved", event, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_S)))
    return json(429, { error: "trop de requetes, reessaie dans quelques minutes" });

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
