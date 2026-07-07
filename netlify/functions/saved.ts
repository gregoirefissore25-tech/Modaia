// GET /api/saved?device=xxx
// Lookbook groupe par marchand : la reponse V1 au panier multi-marques.
// Un bouton checkout par marchand, chaque lien passe par /api/go pour le tracking.
import { sql, getOrCreateUser, json } from "./_db";

export default async (req: Request) => {
  const u = new URL(req.url);
  const device = u.searchParams.get("device");
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
