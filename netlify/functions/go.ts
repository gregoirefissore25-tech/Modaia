// GET /api/go?device=xxx&pid=123 : redirection affiliee trackee
import type { Handler } from "@netlify/functions";
import { sql, getOrCreateUser, isValidDeviceId } from "./_db";

export const handler: Handler = async (event) => {
  const q = event.queryStringParameters || {};
  const device = q.device;
  const pid = Number(q.pid);
  if (!isValidDeviceId(device) || !pid) return { statusCode: 400, body: "parametres invalides" };

  const userId = await getOrCreateUser(device);
  const rows = await sql`select product_url, affiliate_url from products where id = ${pid}`;
  if (rows.length === 0) return { statusCode: 404, body: "produit inconnu" };

  const subid = crypto.randomUUID();
  await sql`insert into clicks (user_id, product_id, subid) values (${userId}, ${pid}, ${subid})`;

  const raw = rows[0].affiliate_url as string | null;
  const target = raw
    ? raw + (raw.includes("?") ? "&" : "?") + "clickref=" + subid
    : "https://go.skimresources.com?id=" +
      (process.env.SKIMLINKS_PUBLISHER_ID || "") +
      "&xs=1&xcust=" + subid +
      "&url=" + encodeURIComponent(rows[0].product_url as string);

  return { statusCode: 302, headers: { location: target }, body: "" };
};
