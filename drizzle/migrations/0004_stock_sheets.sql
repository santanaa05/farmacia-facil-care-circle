CREATE TABLE public.pharmacy_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number integer NOT NULL UNIQUE,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'ativa',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pharmacy_units TO authenticated;
GRANT ALL ON public.pharmacy_units TO service_role;
ALTER TABLE public.pharmacy_units ENABLE ROW LEVEL SECURITY;
CREATE POLICY units_staff_select ON public.pharmacy_units FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY units_admin_write ON public.pharmacy_units FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.unit_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES public.pharmacy_units(id) ON DELETE CASCADE,
  product_code text NOT NULL,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Medicamentos',
  manufacturer text,
  supplier text,
  quantity integer NOT NULL DEFAULT 0,
  min_quantity integer NOT NULL DEFAULT 0,
  max_quantity integer,
  daily_sales numeric NOT NULL DEFAULT 0,
  unit_cost numeric NOT NULL DEFAULT 0,
  lead_time_days integer NOT NULL DEFAULT 0,
  expiry_date date,
  last_movement_at timestamptz,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (unit_id, product_code)
);
CREATE INDEX unit_stock_unit_idx ON public.unit_stock(unit_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.unit_stock TO authenticated;
GRANT ALL ON public.unit_stock TO service_role;
ALTER TABLE public.unit_stock ENABLE ROW LEVEL SECURITY;
CREATE POLICY stock_staff_select ON public.unit_stock FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY stock_staff_insert ON public.unit_stock FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY stock_staff_update ON public.unit_stock FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY stock_staff_delete ON public.unit_stock FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

CREATE TABLE public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_id uuid NOT NULL REFERENCES public.unit_stock(id) ON DELETE CASCADE,
  unit_id uuid NOT NULL REFERENCES public.pharmacy_units(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('entrada','saida','venda','perda')),
  quantity integer NOT NULL CHECK (quantity > 0),
  note text,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX stock_movements_stock_idx ON public.stock_movements(stock_id, created_at);
GRANT SELECT, INSERT ON public.stock_movements TO authenticated;
GRANT ALL ON public.stock_movements TO service_role;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY mov_staff_select ON public.stock_movements FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY mov_staff_insert ON public.stock_movements FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.apply_stock_movement() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.unit_stock;
BEGIN
  SELECT * INTO s FROM public.unit_stock WHERE id = NEW.stock_id FOR UPDATE;
  IF s.id IS NULL THEN RAISE EXCEPTION 'Produto não encontrado'; END IF;
  NEW.unit_id := s.unit_id;
  IF NEW.kind <> 'entrada' AND s.quantity < NEW.quantity THEN
    RAISE EXCEPTION 'Estoque insuficiente (disponível: %)', s.quantity;
  END IF;
  UPDATE public.unit_stock
     SET quantity = quantity + CASE WHEN NEW.kind = 'entrada' THEN NEW.quantity ELSE -NEW.quantity END,
         last_movement_at = NEW.created_at
   WHERE id = s.id;
  RETURN NEW;
END $$;
CREATE TRIGGER stock_movements_apply BEFORE INSERT ON public.stock_movements
FOR EACH ROW EXECUTE FUNCTION public.apply_stock_movement();

CREATE OR REPLACE FUNCTION public.stock_snapshot(_unit_number integer DEFAULT NULL) RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'farmacia_numero', u.number, 'farmacia_nome', u.name,
    'produto_id', s.product_code, 'produto_nome', s.name, 'categoria', s.category,
    'estoque_atual', s.quantity, 'estoque_minimo', s.min_quantity, 'estoque_maximo', s.max_quantity,
    'media_vendas_dia', s.daily_sales, 'prazo_reposicao_dias', s.lead_time_days,
    'validade', s.expiry_date, 'ultima_movimentacao', s.last_movement_at, 'ficticio', s.is_demo,
    'movimentacoes', (SELECT coalesce(jsonb_agg(jsonb_build_object('tipo', m.kind, 'quantidade', m.quantity, 'data', m.created_at) ORDER BY m.created_at), '[]'::jsonb)
                      FROM public.stock_movements m WHERE m.stock_id = s.id)
  )), '[]'::jsonb)
  FROM public.unit_stock s JOIN public.pharmacy_units u ON u.id = s.unit_id
  WHERE _unit_number IS NULL OR u.number = _unit_number
$$;
GRANT EXECUTE ON FUNCTION public.stock_snapshot(integer) TO authenticated;

INSERT INTO public.pharmacy_units (number, name)
SELECT n, 'Farmácia ' || lpad(n::text, 2, '0') FROM generate_series(1,12) n;

INSERT INTO public.unit_stock (unit_id, product_code, name, category, manufacturer, supplier, quantity, min_quantity, max_quantity, daily_sales, unit_cost, lead_time_days, expiry_date, last_movement_at, is_demo)
SELECT u.id, 'P' || lpad(p.rn::text, 3, '0'), p.name, p.category, coalesce(p.brand, 'Genérico'), 'Distribuidora Demo',
  ((u.number * 37 + p.rn * 13) % 120)::int, 20, 150,
  round((((u.number + p.rn) % 7) + 1)::numeric, 1), round((p.price * 0.55)::numeric, 2), (3 + (p.rn % 5))::int,
  CASE WHEN p.rn % 4 = 0 THEN current_date + ((u.number * 11 + p.rn * 7) % 120)::int ELSE NULL END,
  now() - make_interval(days => ((u.number + p.rn * 3) % 40)::int), true
FROM public.pharmacy_units u
CROSS JOIN (SELECT name, category, brand, price, row_number() OVER (ORDER BY name) rn FROM public.products) p;