import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Package, Pencil, Plus, ShieldCheck, Ticket, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RoleGuard } from "@/components/RoleGuard";
import { WorkspaceHeader, workspaceTabTrigger, workspaceTabsList } from "@/components/Workspace";
import { brl } from "@/lib/cart";
import { CATEGORIES } from "@/lib/products";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Área administrativa — FarmaQuarema" },
      { name: "description", content: "Área restrita para gerenciar produtos, cupons e usuários da FarmaQuarema." },
      { property: "og:title", content: "Área administrativa — FarmaQuarema" },
      { property: "og:description", content: "Área restrita da FarmaQuarema." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <RoleGuard allow={["admin"]}><Admin /></RoleGuard>,
});

type AppRole = "cliente" | "atendente" | "admin";

const empty = { name: "", brand: "", description: "", price: 0, old_price: null as number | null, stock: 10, category: "Medicamentos", requires_prescription: false, image_url: "" };
const emptyCoupon = { code: "", description: "", percent: 10, min_total: 0, active: true };

function Admin() {
  const qc = useQueryClient();
  const [prod, setProd] = useState<typeof empty | null>(null);
  const [origId, setOrigId] = useState<string | null>(null);
  const [coupon, setCoupon] = useState<typeof emptyCoupon | null>(null);
  const [origCode, setOrigCode] = useState<string | null>(null);

  const { data: products = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: users = [] } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, full_name, phone");
      if (error) throw error;
      const { data: roles, error: rolesError } = await supabase.from("user_roles").select("user_id, role");
      if (rolesError) throw rolesError;
      const byUser = new Map<string, AppRole>();
      (roles ?? []).forEach((r) => byUser.set(r.user_id, r.role));
      return (data ?? []).map((p) => ({ ...p, role: byUser.get(p.id) }));
    },
  });

  const { data: coupons = [] } = useQuery({
    queryKey: ["coupons"],
    queryFn: async () => {
      const { data, error } = await supabase.from("coupons").select("*").order("code");
      if (error) throw error;
      return data;
    },
  });

  const save = async () => {
    if (!prod) return;
    const payload = { ...prod, old_price: prod.old_price && prod.old_price > prod.price ? prod.old_price : null };
    const { error } = origId
      ? await supabase.from("products").update(payload).eq("id", origId)
      : await supabase.from("products").insert(payload);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Produto salvo");
    setProd(null); setOrigId(null);
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    qc.invalidateQueries({ queryKey: ["products"] });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Produto removido");
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    qc.invalidateQueries({ queryKey: ["products"] });
  };

  const setRole = async (userId: string, role: AppRole) => {
    const { error } = await supabase.from("user_roles").delete().eq("user_id", userId);
    if (error) {
      toast.error(error.message);
      return;
    }
    const { error: insertError } = await supabase.from("user_roles").insert({ user_id: userId, role });
    if (insertError) {
      toast.error(insertError.message);
      return;
    }
    toast.success("Perfil atualizado");
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  };

  const saveCoupon = async () => {
    if (!coupon) return;
    const code = coupon.code.trim().toUpperCase();
    if (!code) {
      toast.error("Informe o código do cupom");
      return;
    }
    const payload = { ...coupon, code, description: coupon.description.trim() || `Cupom ${code}` };
    const { error } = origCode
      ? await supabase.from("coupons").update(payload).eq("code", origCode)
      : await supabase.from("coupons").insert(payload);
    if (error) {
      toast.error(error.code === "23505" ? "Já existe um cupom com esse código" : error.message);
      return;
    }
    toast.success("Cupom salvo");
    setCoupon(null); setOrigCode(null);
    qc.invalidateQueries({ queryKey: ["coupons"] });
  };

  const removeCoupon = async (code: string) => {
    const { error } = await supabase.from("coupons").delete().eq("code", code);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Cupom removido");
    qc.invalidateQueries({ queryKey: ["coupons"] });
  };

  const toggleCoupon = async (c: Tables<"coupons">) => {
    const { error } = await supabase.from("coupons").update({ active: !c.active }).eq("code", c.code);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast(c.active ? "Cupom desativado" : "Cupom ativado");
    qc.invalidateQueries({ queryKey: ["coupons"] });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <WorkspaceHeader icon={ShieldCheck} eyebrow="Área do administrador" title="Gestão da FarmaQuarema" description="Administre o catálogo, os perfis de acesso e os cupons da loja." />
      <Tabs defaultValue="produtos" className="mt-6">
        <TabsList className={`${workspaceTabsList} grid-cols-3`}>
          <TabsTrigger value="produtos" className={workspaceTabTrigger}><Package className="h-4 w-4" />Produtos</TabsTrigger>
          <TabsTrigger value="usuarios" className={workspaceTabTrigger}><Users className="h-4 w-4" />Usuários</TabsTrigger>
          <TabsTrigger value="cupons" className={workspaceTabTrigger}><Ticket className="h-4 w-4" />Cupons</TabsTrigger>
        </TabsList>

        <TabsContent value="produtos" className="mt-6">
          <Button onClick={() => { setProd({ ...empty }); setOrigId(null); }}><Plus className="h-4 w-4" />Novo produto</Button>
          <div className="mt-4 overflow-x-auto rounded-xl border bg-card">
            <Table>
              <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Categoria</TableHead><TableHead>Preço</TableHead><TableHead>Estoque</TableHead><TableHead /></TableRow></TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.category}</TableCell>
                    <TableCell>{brl(Number(p.price))}</TableCell>
                    <TableCell>{p.stock}</TableCell>
                    <TableCell className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => { setProd({ name: p.name, brand: p.brand ?? "", description: p.description ?? "", price: Number(p.price), old_price: p.old_price ? Number(p.old_price) : null, stock: p.stock, category: p.category, requires_prescription: p.requires_prescription, image_url: p.image_url ?? "" }); setOrigId(p.id); }}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="usuarios" className="mt-6">
          <div className="overflow-x-auto rounded-xl border bg-card">
            <Table>
              <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Perfil</TableHead></TableRow></TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>{u.full_name || u.id.slice(0, 8)}</TableCell>
                    <TableCell>
                      <Select value={u.role ?? ""} onValueChange={(v) => setRole(u.id, v as AppRole)}>
                        <SelectTrigger className="w-40"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cliente">Cliente</SelectItem>
                          <SelectItem value="atendente">Atendente</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="cupons" className="mt-6">
          <Button onClick={() => { setCoupon({ ...emptyCoupon }); setOrigCode(null); }}><Plus className="h-4 w-4" />Novo cupom</Button>
          <div className="mt-4 overflow-x-auto rounded-xl border bg-card">
            <Table>
              <TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Descrição</TableHead><TableHead>Desconto</TableHead><TableHead>Compra mínima</TableHead><TableHead>Ativo</TableHead><TableHead /></TableRow></TableHeader>
              <TableBody>
                {coupons.map((c) => (
                  <TableRow key={c.code}>
                    <TableCell className="font-mono font-bold">{c.code}</TableCell>
                    <TableCell className="max-w-64 truncate">{c.description}</TableCell>
                    <TableCell>{c.percent}%</TableCell>
                    <TableCell>{Number(c.min_total) > 0 ? brl(Number(c.min_total)) : "—"}</TableCell>
                    <TableCell><Switch checked={c.active} onCheckedChange={() => toggleCoupon(c)} /></TableCell>
                    <TableCell className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => { setCoupon({ code: c.code, description: c.description, percent: c.percent, min_total: Number(c.min_total), active: c.active }); setOrigCode(c.code); }}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => removeCoupon(c.code)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground"><Ticket className="h-3 w-3" />Cupons ativos aparecem na página de cupons e valem no checkout.</p>
        </TabsContent>
      </Tabs>

      {prod && (
        <Dialog open onOpenChange={() => setProd(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{origId ? "Editar produto" : "Novo produto"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Nome" value={prod.name} onChange={(e) => setProd({ ...prod, name: e.target.value })} />
              <Input placeholder="Marca" value={prod.brand} onChange={(e) => setProd({ ...prod, brand: e.target.value })} />
              <Textarea placeholder="Descrição" value={prod.description} onChange={(e) => setProd({ ...prod, description: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <Input type="number" placeholder="Preço" value={prod.price} onChange={(e) => setProd({ ...prod, price: Number(e.target.value) })} />
                <Input type="number" placeholder="Preço antigo (opcional)" value={prod.old_price ?? ""} onChange={(e) => setProd({ ...prod, old_price: e.target.value ? Number(e.target.value) : null })} />
                <Input type="number" placeholder="Estoque" value={prod.stock} onChange={(e) => setProd({ ...prod, stock: Number(e.target.value) })} />
                <Select value={prod.category} onValueChange={(v) => setProd({ ...prod, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Input placeholder="URL da imagem (opcional)" value={prod.image_url} onChange={(e) => setProd({ ...prod, image_url: e.target.value })} />
              <Label className="flex items-center gap-2"><Switch checked={prod.requires_prescription} onCheckedChange={(v) => setProd({ ...prod, requires_prescription: v })} />Exige receita</Label>
              <Button className="w-full" onClick={save}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {coupon && (
        <Dialog open onOpenChange={() => setCoupon(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>{origCode ? "Editar cupom" : "Novo cupom"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Código (ex.: BEMVINDO10)" value={coupon.code} onChange={(e) => setCoupon({ ...coupon, code: e.target.value })} className="font-mono uppercase" />
              <Input placeholder="Descrição" value={coupon.description} onChange={(e) => setCoupon({ ...coupon, description: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <Input type="number" placeholder="% de desconto" value={coupon.percent} onChange={(e) => setCoupon({ ...coupon, percent: Number(e.target.value) })} />
                <Input type="number" placeholder="Compra mínima (R$)" value={coupon.min_total} onChange={(e) => setCoupon({ ...coupon, min_total: Number(e.target.value) })} />
              </div>
              <Label className="flex items-center gap-2"><Switch checked={coupon.active} onCheckedChange={(v) => setCoupon({ ...coupon, active: v })} />Cupom ativo</Label>
              <Button className="w-full" onClick={saveCoupon}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
