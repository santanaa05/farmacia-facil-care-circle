-- 1) Mais buscados: campo de procura nos produtos
alter table public.products add column if not exists popularity integer not null default 0;

update public.products p set popularity = v.popularity
from (values
  ('Dipirona Monoidratada 500mg 10 comprimidos', 980),
  ('Paracetamol 750mg 20 comprimidos', 870),
  ('Vitamina C 1g 30 comprimidos efervescentes', 760),
  ('Protetor Solar FPS 50 200ml', 690),
  ('Creme Dental 90g Kit 3', 640),
  ('Fralda Infantil G 52 unidades', 610),
  ('Ibuprofeno 400mg 10 cápsulas', 540),
  ('Ômega 3 1000mg 120 cápsulas', 470),
  ('Amoxicilina 500mg 21 cápsulas', 430),
  ('Losartana Potássica 50mg 30 comprimidos', 400),
  ('Shampoo Anticaspa 400ml', 350),
  ('Vitamina D3 2000UI 60 cápsulas', 320),
  ('Hidratante Facial 50ml', 280),
  ('Medidor de Pressão de Pulso', 240),
  ('Termômetro Digital', 210),
  ('Lenço Umedecido 96 unidades', 180)
) as v(name, popularity)
where p.name = v.name;

-- 2) Produtos salvos
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

grant select, insert, delete on public.favorites to authenticated;
grant all on public.favorites to service_role;

alter table public.favorites enable row level security;

create policy "favorites_select_own" on public.favorites
  for select to authenticated using (user_id = auth.uid());

create policy "favorites_insert_own" on public.favorites
  for insert to authenticated with check (user_id = auth.uid());

create policy "favorites_delete_own" on public.favorites
  for delete to authenticated using (user_id = auth.uid());

-- 3) Cupons de desconto
create table public.coupons (
  code text primary key,
  description text not null,
  percent integer not null check (percent between 1 and 90),
  min_total numeric(10,2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

grant select on public.coupons to anon, authenticated;
grant insert, update, delete on public.coupons to authenticated;
grant all on public.coupons to service_role;

alter table public.coupons enable row level security;

create policy "coupons_read_active" on public.coupons
  for select to anon, authenticated using (active = true);

create policy "coupons_admin_insert" on public.coupons
  for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));

create policy "coupons_admin_update" on public.coupons
  for update to authenticated using (public.has_role(auth.uid(), 'admin'));

create policy "coupons_admin_delete" on public.coupons
  for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

insert into public.coupons (code, description, percent, min_total) values
  ('BEMVINDO10', '10% de desconto em qualquer compra', 10, 0),
  ('SAUDE15', '15% off em compras acima de R$ 99', 15, 99),
  ('QUAREMA20', '20% off em compras acima de R$ 199', 20, 199)
on conflict (code) do nothing;

-- 4) Pedido passa a registrar o cupom e a função confere o cupom no servidor
alter table public.orders add column if not exists coupon_code text;

drop function if exists public.place_order(jsonb, text);

create or replace function public.place_order(_items jsonb, _address text, _coupon text default null)
returns uuid
language plpgsql
security definer
set search_path = 'public'
as $$
DECLARE _order uuid; _it jsonb; _p public.products; _c public.coupons; _total numeric := 0; _q int;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Faça login'; END IF;
  IF jsonb_array_length(_items) = 0 THEN RAISE EXCEPTION 'Carrinho vazio'; END IF;
  INSERT INTO public.orders (user_id, address) VALUES (auth.uid(), _address) RETURNING id INTO _order;
  FOR _it IN SELECT * FROM jsonb_array_elements(_items) LOOP
    _q := GREATEST(1, (_it->>'quantity')::int);
    SELECT * INTO _p FROM public.products WHERE id = (_it->>'product_id')::uuid;
    IF _p.id IS NULL THEN RAISE EXCEPTION 'Produto inválido'; END IF;
    IF _p.stock < _q THEN RAISE EXCEPTION 'Estoque insuficiente: %', _p.name; END IF;
    UPDATE public.products SET stock = stock - _q WHERE id = _p.id;
    INSERT INTO public.order_items (order_id, product_id, name, price, quantity) VALUES (_order, _p.id, _p.name, _p.price, _q);
    _total := _total + _p.price * _q;
  END LOOP;
  IF _coupon IS NOT NULL AND btrim(_coupon) <> '' THEN
    SELECT * INTO _c FROM public.coupons WHERE active AND upper(code) = upper(btrim(_coupon));
    IF _c.code IS NULL THEN RAISE EXCEPTION 'Cupom inválido ou expirado'; END IF;
    IF _total < _c.min_total THEN RAISE EXCEPTION 'Este cupom exige compra acima de R$ %', to_char(_c.min_total, 'FM999990.00'); END IF;
    _total := round(_total * (100 - _c.percent) / 100, 2);
    UPDATE public.orders SET coupon_code = _c.code WHERE id = _order;
  END IF;
  UPDATE public.orders SET total = _total WHERE id = _order;
  RETURN _order;
END $$;

grant execute on function public.place_order(jsonb, text, text) to authenticated;