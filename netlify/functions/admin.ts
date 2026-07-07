// F3 - Stats admin : GET /api/admin?token=ADMIN_TOKEN
import { sql, json } from "./_db";

export default async (req: Request) => {
  const u = new URL(req.url);
  if (!process.env.ADMIN_TOKEN || u.searchParams.get("token") !== process.env.ADMIN_TOKEN)
    return json(401, { error: "non autorise" });

  const [totals] = await sql`
    select
      (select count(*)::int from users) as users,
      (select count(*)::int from products where in_stock) as products,
      (select count(*)::int from swipes) as swipes,
      (select count(*)::int from clicks) as clicks,
      (select count(*)::int from conversions) as conversions,
      (select coalesce(sum(commission_cents),0)::int from conversions) as commission_cents
  `;
  const byMerchant = await sql`
    select m.name, count(distinct c.id)::int as clicks,
           count(distinct cv.id)::int as conversions,
           coalesce(sum(cv.commission_cents),0)::int as commission_cents
    from merchants m
    left join products p on p.merchant_id = m.id
    left join clicks c on c.product_id = p.id
    left join conversions cv on cv.click_id = c.id
    group by m.name order by commission_cents desc
  `;
  return json(200, { totals, byMerchant });
};
