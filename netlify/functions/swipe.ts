// POST /api/swipe  { device, productId, action: like|pass|save }
import { sql, getOrCreateUser, json } from "./_db";

export default async (req: Request) => {
  if (req.method !== "POST") return json(405, { error: "POST uniquement" });
  const { device, productId, action } = await req.json();
  if (!device || !productId || !["like", "pass", "save"].includes(action))
    return json(400, { error: "parametres invalides" });

  const userId = await getOrCreateUser(device);
  await sql`
    insert into swipes (user_id, product_id, action)
    values (${userId}, ${productId}, ${action})
    on conflict (user_id, product_id) do update set action = ${action}
  `;
  return json(200, { ok: true });
};
