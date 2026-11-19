create policy "coupons_admin_select_all" on public.coupons
  for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));