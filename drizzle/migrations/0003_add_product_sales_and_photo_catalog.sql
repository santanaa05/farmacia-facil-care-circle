ALTER TABLE public.products ADD COLUMN sales_count integer NOT NULL DEFAULT 0;

UPDATE public.products SET sales_count = FLOOR(popularity * 0.65);

CREATE OR REPLACE FUNCTION public.place_order(_items jsonb, _address text, _coupon text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    UPDATE public.products SET stock = stock - _q, sales_count = sales_count + _q WHERE id = _p.id;
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
END $function$;

INSERT INTO public.products (name, brand, category, description, price, old_price, stock, requires_prescription, image_url, popularity, sales_count) VALUES
('Sérum Facial Vitamina C 30ml', 'Quarema Derma', 'Dermocosméticos', 'Sérum facial com textura leve para a rotina diária de cuidados com a pele.', 59.90, 84.90, 34, false, '/__l5e/assets-v1/bf5b8788-094a-4c95-b7ea-d1c04686e246/serum-vitamina-c.jpg', 1180, 1050),
('Água Micelar 200ml', 'Quarema Derma', 'Dermocosméticos', 'Solução de limpeza facial para remover impurezas e maquiagem com suavidade.', 32.90, 46.90, 48, false, '/__l5e/assets-v1/efd4e602-91ab-4450-8069-bb722cc5111c/agua-micelar.jpg', 1140, 990),
('Multivitamínico A-Z 60 cápsulas', 'Quarema Essencial', 'Vitaminas', 'Suplemento vitamínico em cápsulas para complementar uma alimentação equilibrada.', 45.90, 64.90, 42, false, '/__l5e/assets-v1/56f440b9-fbf3-4473-a0d2-26cc42b3c915/multivitaminico.jpg', 1100, 1190),
('Colágeno Hidrolisado 300g', 'Quarema Essencial', 'Vitaminas', 'Colágeno hidrolisado em pó, fácil de incluir na sua rotina.', 69.90, 99.90, 27, false, '/__l5e/assets-v1/7519b5cc-b9ca-4f51-ba66-2fa3b4ac4eac/colageno.jpg', 1020, 940),
('Sabonete Facial Suave 150ml', 'Quarema Derma', 'Dermocosméticos', 'Gel de limpeza facial para uso diário, com enxágue fácil e sensação refrescante.', 24.90, 34.90, 56, false, '/__l5e/assets-v1/d83479b4-ec6a-4360-ad3a-e4c4edbc93cb/sabonete-facial.jpg', 920, 810),
('Condicionador Hidratante 300ml', 'Quarema Essencial', 'Higiene', 'Condicionador para desembaraçar os fios e complementar a hidratação diária.', 22.90, 31.90, 39, false, '/__l5e/assets-v1/35f643a8-f6b9-45df-9d48-cb952d908194/condicionador.jpg', 880, 760),
('Fralda Conforto M 36 unidades', 'Quarema Baby', 'Infantil', 'Fraldas descartáveis tamanho M com ajuste confortável para o dia a dia do bebê.', 54.90, 74.90, 31, false, '/__l5e/assets-v1/34322ccd-021f-459d-8614-283428ff29b1/fralda-conforto.jpg', 1060, 1260),
('Lenços Umedecidos 48 unidades', 'Quarema Baby', 'Infantil', 'Lenços umedecidos macios para a higiene delicada do bebê.', 12.90, 17.90, 72, false, '/__l5e/assets-v1/49fc37f7-333a-4e74-9ef3-cf35b6bd7bd4/lenco-umedecido.jpg', 960, 1130),
('Soro Fisiológico 0,9% 500ml', 'Quarema Saúde', 'Saúde', 'Solução fisiológica estéril em embalagem de 500ml. Siga sempre a orientação profissional.', 8.99, 11.99, 85, false, '/__l5e/assets-v1/d388b845-e93b-4367-9f50-77e9ed161d38/soro-fisiologico.jpg', 840, 890),
('Álcool 70% 1 litro', 'Quarema Essencial', 'Higiene', 'Álcool etílico 70% para higienização de superfícies, em embalagem de 1 litro.', 14.90, 19.90, 64, false, '/__l5e/assets-v1/b3f6561e-4ff6-4f62-ac35-3b8d9f9a3947/alcool-70.jpg', 800, 870),
('Máscaras Cirúrgicas 50 unidades', 'Quarema Saúde', 'Saúde', 'Máscaras cirúrgicas descartáveis triplas em caixa com 50 unidades.', 19.90, 27.90, 46, false, '/__l5e/assets-v1/7a600961-890f-4086-92a5-b1f0b503933d/mascara-cirurgica.jpg', 760, 720),
('Balança Digital de Vidro', 'Quarema Saúde', 'Saúde', 'Balança digital com plataforma de vidro e visor de fácil leitura.', 129.90, 179.90, 18, false, '/__l5e/assets-v1/2cca5370-0c3e-4fb6-858e-e3797b3376b1/balanca-digital.jpg', 700, 540);