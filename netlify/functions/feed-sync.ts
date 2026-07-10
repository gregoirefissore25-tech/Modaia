// F1 - Ingestion flux Awin. Scheduled @daily.
import type { Handler } from "@netlify/functions";
import { gunzipSync } from "node:zlib";
import { sql } from "./_db";
import { parseCsv, mapCategory, extractTags, parsePriceWithCurrency } from "./_csv";

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

// Un flux liste souvent une ligne par taille (meme photo, meme couleur, seule la
// taille change en fin de titre) : sans ca, swiper donne l'impression de voir le
// meme article en boucle. Deux conventions rencontrees : "- Taille L" / "- Size M"
// (Vilebrequin) et "- Brown / XS" (Tiavllya, couleur puis taille apres un "/").
// On ne garde que la 1re variante par modele (la couleur, elle, reste distincte).
const SIZE_SUFFIX_RE =
  /\s*-\s*(taille|size)\s*[:\-]?\s*\S+\s*$|\s*\/\s*(xxs|xs|s|m|l|xl|xxl|xxxl|\dxl|\d{1,3})\s*$/i;
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

// Deux formats de flux coexistent chez les annonceurs Awin : le format natif Awin
// (colonnes aw_product_id/search_price/category_name/merchant_name...) et le format
// Google Shopping/Merchant Center (colonnes id/title/price/google_product_category/
// advertiser_name...) que plusieurs annonceurs utilisent aussi (ex. Tiavllya). On
// normalise les deux vers la meme forme avant le reste du traitement.
interface NormalizedRecord {
  externalId: string;
  title: string;
  merchantName: string;
  categoryText: string;
  priceCents: number;
  currency: string;
  imageUrl: string;
  productUrl: string;
  affiliateUrl: string;
  brand: string | null;
  genderHint: string; // "male" | "female" | ""
}

function normalizeRecord(r: Record<string, string>): NormalizedRecord | null {
  if (r.aw_product_id) {
    // Format Awin natif.
    const priceCents = Math.round(parseFloat(r.search_price || "0") * 100);
    return {
      externalId: r.aw_product_id,
      title: r.product_name || "",
      merchantName: r.merchant_name || "Marchand",
      categoryText: r.category_name || r.product_type || r.merchant_category || "",
      priceCents,
      currency: r.currency || "EUR",
      imageUrl: r.merchant_image_url || "",
      productUrl: r.merchant_deep_link || r.aw_deep_link || "",
      affiliateUrl: r.aw_deep_link || "",
      brand: r.brand_name || null,
      genderHint: (r["fashion:suitable_for"] || "").toLowerCase()
    };
  }
  if (r.id && r.title) {
    // Format Google Shopping/Merchant Center.
    const { amount, currency } = parsePriceWithCurrency(r.price || "");
    return {
      externalId: r.id,
      title: r.title,
      merchantName: r.advertiser_name || "Marchand",
      categoryText: r.google_product_category || r.product_type || "",
      priceCents: Math.round(amount * 100),
      currency: currency || "USD",
      imageUrl: r.image_link || "",
      productUrl: r.link || "",
      affiliateUrl: r.aw_deep_link || r.link || "",
      brand: r.brand || null,
      genderHint: (r.gender || "").toLowerCase()
    };
  }
  return null; // format non reconnu, ligne ignoree
}

export async function ingest(csvText: string): Promise<number> {
  // parseCsv est un generateur (une ligne a la fois) : evite de garder tout le
  // flux parse en memoire pour les gros feeds (Tiavllya ~22000 lignes).
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

  for (const raw of parseCsv(csvText)) {
    const rec = normalizeRecord(raw);
    if (!rec) continue; // format de ligne non reconnu

    // Le texte de categorie ne mentionne pas toujours le genre (ex. Tiavllya,
    // format Google, categories = "Suits > Tuxedo" sans indication) : on regarde
    // aussi le titre, qui lui le precise generalement ("Men's ...", "Femme ...").
    const genderText = `${rec.categoryText} ${rec.title}`;
    if (KIDS_RE.test(genderText)) continue; // pas de segment enfant sur Modaia
    const category = mapCategory(rec.categoryText);
    if (!category || !rec.externalId || !rec.imageUrl || rec.priceCents <= 0) continue;

    let merchantId = seenMerchants.get(rec.merchantName);
    if (!merchantId) {
      const rows = await sql`insert into merchants (name, network) values (${rec.merchantName}, 'awin') on conflict (name) do nothing returning id`;
      merchantId = rows[0]?.id ?? (await sql`select id from merchants where name = ${rec.merchantName}`)[0].id;
      seenMerchants.set(rec.merchantName, merchantId as number);
    }

    // Le genre explicite du marchand (quand fourni) est plus fiable que l'heuristique
    // sur categorie+titre.
    const gender =
      rec.genderHint === "male" ? "men" :
      rec.genderHint === "female" ? "women" :
      /\bhomme|\bmen\b|\bmale\b|\bmen's\b/i.test(genderText) ? "men" : "women";

    const productKey = baseProductKey(merchantId as number, rec.title);
    if (seenProducts.has(productKey)) continue; // variante taille/couleur deja vue
    seenProducts.add(productKey);

    batch.push({
      merchant_id: merchantId as number,
      external_id: rec.externalId,
      title: rec.title,
      brand: rec.brand,
      gender,
      category,
      price_cents: rec.priceCents,
      currency: rec.currency,
      image_url: rec.imageUrl,
      product_url: rec.productUrl || rec.affiliateUrl,
      affiliate_url: rec.affiliateUrl || rec.productUrl,
      tags: extractTags(rec.title)
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
