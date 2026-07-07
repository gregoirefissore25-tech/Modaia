// GET /api/go?device=xxx&pid=123
// Redirection affiliee : log du clic avec subid unique, puis 302 vers le marchand.
// Le subid est rapproche des rapports de commission du reseau (postback Awin / CSV Skimlinks).
import { sql, getOrCreateUser } from "./_db";

export default async (req: Request) => {
  const u = new URL(req.url);
  const device = u.searchParams.get("device");
  const pid = Number(u.searchParams.get("pid"));
  if (!device || !pid) return new Response("parametres invalides", { status: 400 });

  const userId = await getOrCreateUser(device);
  const rows = await sql`
    select product_url, affiliate_url from products where id = ${pid}
  `;
  if (rows.length === 0) return new Response("produit inconnu", { status: 404 });

  const subid = crypto.randomUUID();
  await sql`
    insert into clicks (user_id, product_id, subid)
    values (${userId}, ${pid}, ${subid})
  `;

  const raw = rows[0].affiliate_url as string | null;
  const target = raw
    ? raw + (raw.includes("?") ? "&" : "?") + "clickref=" + subid
    : "https://go.skimresources.com?id=" +
      (process.env.SKIMLINKS_PUBLISHER_ID || "") +
      "&xs=1&xcust=" + subid +
      "&url=" + encodeURIComponent(rows[0].product_url as string);

  return new Response(null, { status: 302, headers: { location: target } });
};
