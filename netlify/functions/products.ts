// GET /api/products?device=xxx&gender=women&categories=dress,top&budget=5000
import type { Handler } from "@netlify/functions";
import { sql, getOrCreateUser, isValidDeviceId, checkRateLimit, json } from "./_db";

const RATE_LIMIT_MAX = 60;
const RATE_LIMIT_WINDOW_S = 300;

// Au-dela de ce prix, une piece est deprioritisee par defaut (x0.1 sur le score,
// pas exclue : garde une part de decouverte/aspirationnel) sauf signal d'un budget
// eleve : soit choisi explicitement a l'onboarding, soit revele par au moins 2
// coups de coeur (like/save) deja au-dessus du seuil.
const PRICE_SOFT_CAP_CENTS = 8000;
const HIGH_BUDGET_CENTS = 15000;
const HIGH_SPENDER_LIKES_THRESHOLD = 2;

export const handler: Handler = async (event) => {
  const p = event.queryStringParameters || {};
  const device = p.device;
  if (!isValidDeviceId(device)) return json(400, { error: "device invalide" });
  if (!(await checkRateLimit("products", event, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_S)))
    return json(429, { error: "trop de requetes, reessaie dans quelques minutes" });

  const userId = await getOrCreateUser(device);
  const gender = p.gender || "women";
  const budget = Number(p.budget || 0);
  const cats = (p.categories || "").split(",").filter(Boolean);

  const prof = await sql`select style_vector, budget_max_cents from style_profiles where user_id = ${userId}`;
  const vector: Record<string, number> = prof[0]?.style_vector || {};
  const declaredBudget = Number(prof[0]?.budget_max_cents || 0);

  const rows = await sql`
    with high_spender as (
      select ${declaredBudget} >= ${HIGH_BUDGET_CENTS} or (
        select count(*) from swipes s
        join products pp on pp.id = s.product_id
        where s.user_id = ${userId} and s.action in ('like', 'save')
          and pp.price_cents > ${PRICE_SOFT_CAP_CENTS}
      ) >= ${HIGH_SPENDER_LIKES_THRESHOLD} as value
    ),
    scored as (
      select p.id, p.title, p.brand, p.category, p.price_cents, p.currency,
             p.image_url, p.tags, m.name as merchant,
        coalesce((
          select sum((${JSON.stringify(vector)}::jsonb ->> t)::numeric)
          from jsonb_array_elements_text(p.tags) t
          where ${JSON.stringify(vector)}::jsonb ? t
        ), 0) as affinity,
        greatest(0, 14 - extract(day from now() - p.updated_at)) / 14.0 as freshness,
        case
          when p.price_cents > ${PRICE_SOFT_CAP_CENTS} and not (select value from high_spender)
          then 0.1 else 1.0
        end as price_factor
      from products p
      join merchants m on m.id = p.merchant_id
      where p.in_stock
        and p.gender = ${gender}
        and (${cats.length === 0} or p.category = any(${cats}))
        and (${budget === 0} or p.price_cents <= ${budget})
        and not exists (
          select 1 from swipes s where s.user_id = ${userId} and s.product_id = p.id
        )
    )
    select id, title, brand, category, price_cents, currency, image_url, merchant
    from scored
    order by (affinity * 2 + freshness + random() * 0.5) * price_factor desc
    limit 20
  `;
  return json(200, { userId, products: rows });
};
