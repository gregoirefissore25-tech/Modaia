// F0 - Amorcage manuel via SiteStripe. POST /api/import { token, product:{...} }
import type { Handler } from "@netlify/functions";
import { sql, json } from "./_db";

const ASIN_RE = /\/([A-Z0-9]{10})(?:[/?]|$)/;

function parseSource(source: string): { productUrl: string; imageUrl: string | null } {
  const s = (source || "").trim();
  if (/<a\s/i.test(s)) {
    const href = s.match(/href=["']([^"']+)["']/i)?.[1] || "";
    let img = s.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] || null;
    if (img) img = img.replace(/_SL\d+_/i, "_SL500_").replace(/_AC_[A-Z]{2}\d+_/i, "_AC_SL500_");
    return { productUrl: href.replace(/&amp;/g, "&"), imageUrl: img };
  }
  return { productUrl: s, imageUrl: null };
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "POST uniquement" });
  const body = JSON.parse(event.body || "{}");
  if (!process.env.ADMIN_TOKEN || body.token !== process.env.ADMIN_TOKEN)
    return json(401, { error: "token invalide" });

  const p = body.product;
  if (!p) return json(400, { error: "product manquant" });

  const { productUrl, imageUrl } = parseSource(p.source);
  const image = (p.imageUrl && p.imageUrl.trim()) || imageUrl;
  const priceCents = Math.round(parseFloat(String(p.priceEur).replace(",", ".")) * 100);
  if (!productUrl || !image || !p.title || !p.category || !priceCents)
    return json(400, { error: "champ manquant (lien, image, titre, prix ou categorie)" });

  const asin = productUrl.match(ASIN_RE)?.[1] || crypto.randomUUID().slice(0, 10);

  const mrows = await sql`
    insert into merchants (name, network, domain, commission_pct)
    values ('Amazon', 'direct', 'amazon.fr', 3.00)
    on conflict do nothing returning id
  `;
  const merchantId = mrows[0]?.id ?? (await sql`select id from merchants where name='Amazon'`)[0].id;

  await sql`
    insert into products (merchant_id, external_id, title, brand, gender, category,
                          price_cents, currency, image_url, product_url, affiliate_url, tags, in_stock, updated_at)
    values (${merchantId}, ${asin}, ${p.title}, ${p.brand || null},
            ${p.gender || "women"}, ${p.category}, ${priceCents}, 'EUR',
            ${image}, ${productUrl}, ${productUrl}, '[]'::jsonb, true, now())
    on conflict (merchant_id, external_id) do update set
      title=excluded.title, price_cents=excluded.price_cents, image_url=excluded.image_url,
      product_url=excluded.product_url, affiliate_url=excluded.affiliate_url,
      brand=excluded.brand, category=excluded.category, gender=excluded.gender,
      in_stock=true, updated_at=now()
  `;
  return json(200, { ok: true, asin, title: p.title });
};
