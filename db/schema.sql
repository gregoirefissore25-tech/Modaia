-- Modaia : schema Neon Postgres
create extension if not exists pgcrypto;

create table if not exists merchants (
  id serial primary key,
  name text not null,
  network text not null default 'skimlinks', -- skimlinks | awin | cj | direct
  domain text,
  commission_pct numeric(5,2),
  created_at timestamptz default now()
);
-- Unicite sur le nom : import.ts et feed-sync.ts font un find-or-create par nom
-- (on conflict (name) do nothing), sans cet index chaque appel creait un doublon.
create unique index if not exists idx_merchants_name on merchants (name);

create table if not exists products (
  id bigserial primary key,
  merchant_id int references merchants(id),
  external_id text not null,
  title text not null,
  brand text,
  gender text not null default 'women',        -- women | men | unisex
  category text not null,                       -- dress | top | shorts | skirt | pants | denim | shoes | swim | active | accessories
  price_cents int not null,
  currency text not null default 'EUR',
  image_url text not null,
  product_url text not null,                    -- URL marchand brute
  affiliate_url text,                           -- URL trackee (Skimlinks/Awin), sinon generee au clic
  tags jsonb default '[]'::jsonb,               -- tags de style pour le scoring (F2)
  in_stock boolean default true,
  updated_at timestamptz default now(),
  unique (merchant_id, external_id)
);
create index if not exists idx_products_feed on products (gender, category, in_stock, price_cents);
create index if not exists idx_products_tags on products using gin (tags);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  device_id text unique not null,               -- V1 sans compte : identite par device, auth reelle en V2 (F4)
  created_at timestamptz default now()
);

create table if not exists style_profiles (
  user_id uuid primary key references users(id) on delete cascade,
  sizes jsonb default '{}'::jsonb,              -- {"top":"M","bottom":"38","shoes":"39"}
  budget_max_cents int,
  filters jsonb default '{}'::jsonb,            -- {"gender":"women","categories":["dress","top"]}
  style_vector jsonb default '{}'::jsonb,       -- scores par tag appris des swipes onboarding + comportement
  updated_at timestamptz default now()
);

create table if not exists swipes (
  id bigserial primary key,
  user_id uuid references users(id) on delete cascade,
  product_id bigint references products(id) on delete cascade,
  action text not null check (action in ('like','pass','save')),
  created_at timestamptz default now(),
  unique (user_id, product_id)
);

-- Tracking affilie : chaque clic sortant est logge avec un subid = uuid du clic,
-- rapproche ensuite des rapports de commission du reseau (postback ou CSV).
create table if not exists clicks (
  id bigserial primary key,
  user_id uuid references users(id),
  product_id bigint references products(id),
  subid text not null,
  created_at timestamptz default now()
);

create table if not exists conversions (
  id bigserial primary key,
  click_id bigint references clicks(id),
  network text,
  order_value_cents int,
  commission_cents int,
  reported_at timestamptz default now()
);

-- R2 : rate limiting par IP sur les endpoints publics (voir _db.ts checkRateLimit).
-- Fenetre fixe : window_start/count remis a zero des que la fenetre est expiree.
create table if not exists rate_limits (
  key text primary key,                         -- "<endpoint>:<ip>"
  window_start timestamptz not null default now(),
  count int not null default 0
);
