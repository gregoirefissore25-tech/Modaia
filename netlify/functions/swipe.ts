// POST /api/swipe  { device, productId, action: like|pass|save }
import type { Handler } from "@netlify/functions";
import { sql, getOrCreateUser, isValidDeviceId, checkRateLimit, json } from "./_db";

const RATE_LIMIT_MAX = 180;
const RATE_LIMIT_WINDOW_S = 300;

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "POST uniquement" });
  const { device, productId, action } = JSON.parse(event.body || "{}");
  if (!isValidDeviceId(device) || !productId || !["like", "pass", "save"].includes(action))
    return json(400, { error: "parametres invalides" });
  if (!(await checkRateLimit("swipe", event, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_S)))
    return json(429, { error: "trop de requetes, reessaie dans quelques minutes" });

  const userId = await getOrCreateUser(device);
  await sql`
    insert into swipes (user_id, product_id, action)
    values (${userId}, ${productId}, ${action})
    on conflict (user_id, product_id) do update set action = ${action}
  `;

  // "J'aime" alimente le style_vector en direct (signal de style pris en compte dans
  // le feed, sans sauver au Lookbook, contrairement a "Garder" qui sauve via swipes.action).
  // Lecture puis ecriture (pas atomique) : suffisant a l'echelle V1, un utilisateur ne
  // swipe qu'une carte a la fois depuis un seul appareil.
  if (action === "like") {
    const rows = await sql`select tags from products where id = ${productId}`;
    const tags: string[] = rows[0]?.tags || [];
    if (tags.length > 0) {
      const prof = await sql`select style_vector from style_profiles where user_id = ${userId}`;
      const vector: Record<string, number> = { ...(prof[0]?.style_vector || {}) };
      for (const tag of tags) vector[tag] = (vector[tag] || 0) + 1;
      await sql`
        insert into style_profiles (user_id, style_vector, updated_at)
        values (${userId}, ${JSON.stringify(vector)}::jsonb, now())
        on conflict (user_id) do update set style_vector = excluded.style_vector, updated_at = now()
      `;
    }
  }

  return json(200, { ok: true });
};
