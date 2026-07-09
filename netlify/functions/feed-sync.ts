// F1 - Ingestion flux Awin. Scheduled @daily.
import type { Handler } from "@netlify/functions";
import { gunzipSync } from "node:zlib";
import { sql } from "./_db";
import { parseCsv, mapCategory, extractTags } from "./_csv";

// Insertion par lots (jsonb_to_recordset) : un feed de plusieurs milliers de lignes
// en aller-retours un par un depassait le timeout de la function (502 constate en
// prod sur ~4000 lignes Vilebrequin). Un lot de 200 = un seul aller-retour DB.
const BATCH_SIZE = 200;

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

// Un flux liste souvent une ligne par taille (meme photo, meme couleur, seul le
// "Taille S/M/L" change en fin de titre) : sans ca, swiper donne l'impression de
// voir le meme article en boucle. On ne garde que la 1re variante par modele.
const SIZE_SUFFIX_RE = /\s*-\s*(taille|size)\s*[:\-]?\s*\S+\s*$/i;
const baseProductKey = (merchantId: number, title: string): string =>
  `${merchantId}::${title.replace(SIZE_SUFFIX_RE, "").trim().toLowerCase()}`;

interface ProductRow {
  merchant_id: number;
  external_id: string;
  title: string;
  brand: string | null;
  gender: string;
  category: string;
  price_cents: number;
  currency: string;
  image_url: string;
  product_url: string;
  affiliate_url: string;
  tags: string[];
}

export async function ingest(csvText: string): Promise<number> {
  const records = parseCsv(csvText);
  const seenMerchants = new Map<string, number>();
  const seenProducts = new Set<string>();
  const batch: ProductRow[] = [];
  let count = 0;

  const flush = async () => {
    if (batch.length === 0) return;
    await sql`
      insert into products (merchant_id, external_id, title, brand, gender, category,
                            price_cents, currency, image_url, product_url, affiliate_url, tags, in_stock, updated_at)
      select merchant_id, external_id, title, brand, gender, category,
             price_cents, currency, image_url, product_url, affiliate_url, tags, true, now()
      from jsonb_to_recordset(${JSON.stringify(batch)}::jsonb) as x(
        merchant_id int, external_id text, title text, brand text, gender text, category text,
        price_cents int, currency text, image_url text, product_url text, affiliate_url text, tags jsonb
      )
      on conflict (merchant_id, external_id) do update set
        title = excluded.title, price_cents = excluded.price_cents,
        image_url = excluded.image_url, affiliate_url = excluded.affiliate_url,
        tags = excluded.tags, in_stock = true, updated_at = now()
    `;
    count += batch.length;
    batch.length = 0;
  };

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

    const productKey = baseProductKey(merchantId as number, r.product_name || "");
    if (seenProducts.has(productKey)) continue; // variante taille/couleur deja vue
    seenProducts.add(productKey);

    batch.push({
      merchant_id: merchantId as number,
      external_id: r.aw_product_id,
      title: r.product_name,
      brand: r.brand_name || null,
      gender,
      category,
      price_cents: priceCents,
      currency: r.currency || "EUR",
      image_url: r.merchant_image_url,
      product_url: r.merchant_deep_link || r.aw_deep_link,
      affiliate_url: r.aw_deep_link,
      tags: extractTags(r.product_name || "")
    });
    if (batch.length >= BATCH_SIZE) await flush();
  }
  await flush();

  await sql`update products set in_stock = false where updated_at < now() - interval '2 days' and merchant_id in (select id from merchants where network = 'awin')`;
  return count;
}

async function purge() {
  await sql`delete from conversions where click_id in (select id from clicks where created_at < now() - interval '13 months')`;
  await sql`delete from clicks where created_at < now() - interval '13 months'`;
}
