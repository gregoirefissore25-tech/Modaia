insert into merchants (name, network, domain, commission_pct) values
  ('Amazon', 'direct', 'amazon.fr', 3.00),
  ('ASOS', 'awin', 'asos.com', 6.00),
  ('Zalando', 'awin', 'zalando.fr', 7.00)
on conflict do nothing;

insert into products (merchant_id, external_id, title, brand, gender, category, price_cents, image_url, product_url, tags) values
  (1, 'demo-001', 'Platform Slip-on Espadrille Sandals', 'EQAUDES', 'women', 'shoes', 4998, 'https://picsum.photos/seed/m1/600/800', 'https://amazon.fr/dp/demo-001', '["casual"]'),
  (1, 'demo-002', 'Womens Reed Wedge Sandals', 'DREAM PAIRS', 'women', 'shoes', 3199, 'https://picsum.photos/seed/m2/600/800', 'https://amazon.fr/dp/demo-002', '["chic"]'),
  (1, 'demo-003', 'Linen Pants Summer Casual', 'Tanming', 'women', 'pants', 2999, 'https://picsum.photos/seed/m3/600/800', 'https://amazon.fr/dp/demo-003', '["casual"]'),
  (2, 'demo-004', 'Summer Midi Knee Casual Dress', 'Simier Fariry', 'women', 'dress', 4999, 'https://picsum.photos/seed/m4/600/800', 'https://asos.com/p/demo-004', '["boheme"]'),
  (2, 'demo-005', 'Oversized Cotton Tee', 'Collusion', 'women', 'top', 1599, 'https://picsum.photos/seed/m5/600/800', 'https://asos.com/p/demo-005', '["street"]'),
  (3, 'demo-006', 'High-waist Denim Shorts', 'Levi''s', 'women', 'shorts', 3990, 'https://picsum.photos/seed/m6/600/800', 'https://zalando.fr/p/demo-006', '["casual"]'),
  (3, 'demo-007', 'Pleated Midi Skirt', 'Vila', 'women', 'skirt', 3499, 'https://picsum.photos/seed/m7/600/800', 'https://zalando.fr/p/demo-007', '["chic"]'),
  (1, 'demo-008', 'Floral Wrap Dress', 'Amazon Essentials', 'women', 'dress', 2790, 'https://picsum.photos/seed/m8/600/800', 'https://amazon.fr/dp/demo-008', '["boheme"]')
on conflict do nothing;
