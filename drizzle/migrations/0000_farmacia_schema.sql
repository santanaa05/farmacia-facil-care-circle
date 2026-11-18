CREATE TYPE public.app_role AS ENUM ('cliente','atendente','admin');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT, INSERT, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('atendente','admin'))
$$;

CREATE POLICY "profiles select" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "profiles update own" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "roles select" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "roles admin insert" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "roles admin delete" ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'), NEW.email);
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'cliente');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  brand text,
  category text NOT NULL DEFAULT 'Medicamentos',
  description text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  old_price numeric(10,2),
  stock integer NOT NULL DEFAULT 0,
  requires_prescription boolean NOT NULL DEFAULT false,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products public read" ON public.products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "products admin insert" ON public.products FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "products admin update" ON public.products FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "products admin delete" ON public.products FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'recebido',
  total numeric(10,2) NOT NULL DEFAULT 0,
  address text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders select" ON public.orders FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "orders staff update" ON public.orders FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid,
  name text NOT NULL,
  price numeric(10,2) NOT NULL,
  quantity integer NOT NULL
);
GRANT SELECT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "items select" ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.is_staff(auth.uid()))));

CREATE OR REPLACE FUNCTION public.place_order(_items jsonb, _address text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _order uuid; _it jsonb; _p public.products; _total numeric := 0; _q int;
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
  UPDATE public.orders SET total = _total WHERE id = _order;
  RETURN _order;
END $$;
GRANT EXECUTE ON FUNCTION public.place_order(jsonb, text) TO authenticated;

INSERT INTO public.products (name, brand, category, description, price, old_price, stock, requires_prescription) VALUES
('Dipirona Monoidratada 500mg 10 comprimidos','Medley','Medicamentos','Analgésico e antitérmico.',6.99,9.49,120,false),
('Paracetamol 750mg 20 comprimidos','EMS','Medicamentos','Alívio de dores e febre.',12.90,15.90,80,false),
('Ibuprofeno 400mg 10 cápsulas','Advil','Medicamentos','Anti-inflamatório.',19.90,NULL,60,false),
('Losartana Potássica 50mg 30 comprimidos','Eurofarma','Medicamentos','Tratamento da hipertensão.',14.50,22.00,50,true),
('Amoxicilina 500mg 21 cápsulas','Neo Química','Medicamentos','Antibiótico. Venda sob prescrição.',29.90,NULL,40,true),
('Vitamina C 1g 30 comprimidos efervescentes','Redoxon','Vitaminas','Reforço da imunidade.',39.90,49.90,70,false),
('Vitamina D3 2000UI 60 cápsulas','Addera','Vitaminas','Saúde óssea.',54.90,64.90,45,false),
('Ômega 3 1000mg 120 cápsulas','Vitafor','Vitaminas','Saúde cardiovascular.',79.90,NULL,30,false),
('Protetor Solar FPS 50 200ml','La Roche-Posay','Dermocosméticos','Proteção alta UVA/UVB.',89.90,109.90,35,false),
('Hidratante Facial 50ml','Cetaphil','Dermocosméticos','Pele seca e sensível.',64.90,NULL,40,false),
('Shampoo Anticaspa 400ml','Head & Shoulders','Higiene','Controle da caspa.',27.90,32.90,90,false),
('Creme Dental 90g Kit 3','Colgate','Higiene','Proteção anticáries.',14.99,19.99,150,false),
('Fralda Infantil G 52 unidades','Pampers','Infantil','Confort Sec.',79.90,94.90,40,false),
('Lenço Umedecido 96 unidades','Huggies','Infantil','Sem álcool.',16.90,NULL,100,false),
('Termômetro Digital','G-Tech','Saúde','Medição rápida em 60s.',24.90,34.90,25,false),
('Medidor de Pressão de Pulso','Omron','Saúde','Automático e preciso.',189.90,229.90,15,false);