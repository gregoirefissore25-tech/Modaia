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
  return json(200, { ok: true });
};
