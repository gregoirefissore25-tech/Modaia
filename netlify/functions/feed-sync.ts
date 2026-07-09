// F1 - Ingestion flux Awin. Scheduled @daily.
import type { Handler } from "@netlify/functions";
import { gunzipSync } from "node:zlib";
import { sql } from "./_db";
import { parseCsv, mapCategory, extractTags } from "./_csv";

export const handler: Handler = async () => {
  const urls = (process.env.AWIN_FEED_URLS || "").split(",").map((u) => u.trim()).filter(Boolean);
  if (urls.length === 0) { await purge(); return { statusCode: 200, body: "no feeds configured" }; }

  let total = 0;
  for (const url of urls) {
    const res = await fetch(url);
    if (!res.ok) { console.error(`feed-sync: ${url} -> HTTP ${res.status}`); continue; }
    const buf = new Uint8Array(await res.arrayBuffer());
    const isGz = buf[0] === 0x1f && buf[1] === 0x8b;
    const text = isGz ? gunzipSync(buf).toString("utf-8") : new TextDecoder().decode(buf);
    total += await ingest(text);
  }
  await purge();
  return { statusCode: 200, body: `ok: ${total}` };
};

// Certains marchands (ex. Vilebrequin) laissent category_name vide et rangent la
// vraie info dans product_type ("Homme > Maillots de bain > Classique"). On essaie
// plusieurs colonnes dans l'ordre plutot que de perdre tout le flux.
const KIDS_RE = /\benfant|gar[çc]on|\bfille\b|b[ée]b[ée]|\bkids?\b|\bjunior\b/i;

export async function ingest(csvText: string): Promise<number> {
  const records = parseCsv(csvText);
  let count = 0;
  const seenMerchants = new Map<string, number>();
  for (const r of records) {
    const categoryText = r.category_name || r.product_type || r.merchant_category || "";
    if (KIDS_RE.test(categoryText)) continue; // pas de segment enfant sur Modaia
    const category = mapCategory(categoryText);
    const priceCents = Math.round(parseFloat(r.search_price || "0") * 100);
    if (!category || !r.aw_product_id || !r.merchant_image_url || priceCents <= 0) continue;
    const mName = r.merchant_name || "Marchand";
    let merchantId = seenMerchants.get(mName);
    if (!merchantId) {
      const rows = await sql`insert into merchants (name, network) values (${mName}, 'awin') on conflict (name) do nothing returning id`;
      merchantId = rows[0]?.id ?? (await sql`select id from merchants where name = ${mName}`)[0].id;
      seenMerchants.set(mName, merchantId as number);
    }
    // "Fashion:suitable_for" (Male/Female/Unisex) est plus fiable que l'heuristique
    // sur le texte de categorie quand le marchand le fournit (colonne en minuscules,
    // parseCsv normalise les entetes).
    const suitableFor = (r["fashion:suitable_for"] || "").toLowerCase();
    const gender =
      suitableFor === "male" ? "men" :
      suitableFor === "female" ? "women" :
      /homme|men|male/i.test(categoryText) ? "men" : "women";
    await sql`
      insert into products (merchant_id, external_id, title, brand, gender, category,
                            price_cents, currency, image_url, product_url, affiliate_url, tags, in_stock, updated_at)
      values (${merchantId}, ${r.aw_product_id}, ${r.product_name}, ${r.brand_name || null},
              ${gender}, ${category}, ${priceCents}, ${r.currency || "EUR"},
              ${r.merchant_image_url}, ${r.merchant_deep_link || r.aw_deep_link},
              ${r.aw_deep_link}, ${JSON.stringify(extractTags(r.product_name || ""))}::jsonb, true, now())
      on conflict (merchant_id, external_id) do update set
        title = excluded.title, price_cents = excluded.price_cents,
        image_url = excluded.image_url, affiliate_url = excluded.affiliate_url,
        tags = excluded.tags, in_stock = true, updated_at = now()
    `;
    count++;
  }
  await sql`update products set in_stock = false where updated_at < now() - interval '2 days' and merchant_id in (select id from merchants where network = 'awin')`;
  return count;
}

async function purge() {
  await sql`delete from conversions where click_id in (select id from clicks where created_at < now() - interval '13 months')`;
  await sql`delete from clicks where created_at < now() - interval '13 months'`;
}
