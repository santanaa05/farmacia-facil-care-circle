import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { RoleGuard } from "@/components/RoleGuard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { brl } from "@/lib/cart";
import { CATEGORIES, productsQuery } from "@/lib/products";
import { useAuth, type Role } from "@/lib/auth";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Administração — FarmaQuarema" },
      { name: "description", content: "Gerencie produtos, usuários e vendas." },
      { property: "og:title", content: "Administração — FarmaQuarema" },
      { property: "og:description", content: "Produtos, usuários e vendas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <RoleGuard allow={["admin"]}><Admin /></RoleGuard>,
});

type P = Tables<"products">;
const empty: Partial<P> = { name: "", brand: "", category: "Medicamentos", description: "", price: 0, old_price: null, stock: 0, requires_prescription: false, image_url: "" };

function Admin() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: products = [] } = useQuery(productsQuery());
  const { data: orders = [] } = useQuery({ queryKey: ["all-orders-admin"], queryFn: async () => (await supabase.from("orders").select("*")).data ?? [] });
  const { data: users = [] } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [{ data: profiles }, { data: roles }] = await Promise.all([supabase.from("profiles").select("*"), supabase.from("user_roles").select("*")]);
      return (profiles ?? []).map((p) => ({ ...p, role: (roles ?? []).find((r) => r.user_id === p.id)?.role ?? "cliente" }));
    },
  });
  const [edit, setEdit] = useState<Partial<P> | null>(null);

  const save = async () => {
    if (!edit?.name) { toast.error("Informe o nome"); return; }
    const payload = { ...edit, price: Number(edit.price), old_price: edit.old_price ? Number(edit.old_price) : null, stock: Number(edit.stock), image_url: edit.image_url || null } as P;
    const { error } = edit.id ? await supabase.from("products").update(payload).eq("id", edit.id) : await supabase.from("products").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("Produto salvo"); setEdit(null); qc.invalidateQueries({ queryKey: ["products"] });
  };
  const remove = async (id: string) => {
    if (!confirm("Excluir este produto?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["products"] });
  };
  const setRole = async (uid: string, role: Role) => {
    if (uid === user?.id) { toast.error("Você não pode alterar o seu próprio perfil"); return; }
    const del = await supabase.from("user_roles").delete().eq("user_id", uid);
    if (del.error) { toast.error(del.error.message); return; }
    const { error } = await supabase.from("user_roles").insert({ user_id: uid, role });
    if (error) { toast.error(error.message); return; }
    toast.success("Perfil atualizado"); qc.invalidateQueries({ queryKey: ["admin-users"] });
  };

  const revenue = orders.filter((o) => o.status !== "cancelado").reduce((s, o) => s + Number(o.total), 0);
  const stats = [["Faturamento", brl(revenue)], ["Pedidos", orders.length], ["Produtos", products.length], ["Usuários", users.length]];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-extrabold">Administração</h1>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map(([l, v]) => <div key={l as string} className="rounded-xl bg-hero p-5 text-primary-foreground"><p className="text-xs opacity-80">{l}</p><p className="text-2xl font-extrabold">{v}</p></div>)}
      </div>
      <Tabs defaultValue="produtos" className="mt-8">
        <TabsList><TabsTrigger value="produtos">Produtos</TabsTrigger><TabsTrigger value="usuarios">Usuários e perfis</TabsTrigger></TabsList>
        <TabsContent value="produtos">
          <div className="mb-3 flex justify-end"><Button onClick={() => setEdit({ ...empty })}><Plus className="h-4 w-4" />Novo produto</Button></div>
          <div className="rounded-xl border bg-card">
            <Table>
              <TableHeader><TableRow><TableHead>Produto</TableHead><TableHead>Categoria</TableHead><TableHead>Preço</TableHead><TableHead>Estoque</TableHead><TableHead /></TableRow></TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell><TableCell>{p.category}</TableCell>
                    <TableCell>{brl(Number(p.price))}</TableCell><TableCell>{p.stock}</TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => setEdit(p)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        <TabsContent value="usuarios">
          <div className="rounded-xl border bg-card">
            <Table>
              <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>E-mail</TableHead><TableHead>Perfil</TableHead></TableRow></TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>{u.full_name ?? "—"}</TableCell><TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Select value={u.role} onValueChange={(v) => setRole(u.id, v as Role)} disabled={u.id === user?.id}>
                        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="cliente">Cliente</SelectItem><SelectItem value="atendente">Atendente</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{edit?.id ? "Editar produto" : "Novo produto"}</DialogTitle></DialogHeader>
          {edit && (
            <div className="grid gap-3">
              <div><Label>Nome</Label><Input value={edit.name ?? ""} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Marca</Label><Input value={edit.brand ?? ""} onChange={(e) => setEdit({ ...edit, brand: e.target.value })} /></div>
                <div><Label>Categoria</Label>
                  <Select value={edit.category ?? "Medicamentos"} onValueChange={(v) => setEdit({ ...edit, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Preço</Label><Input type="number" step="0.01" value={edit.price ?? 0} onChange={(e) => setEdit({ ...edit, price: Number(e.target.value) })} /></div>
                <div><Label>Preço antigo</Label><Input type="number" step="0.01" value={edit.old_price ?? ""} onChange={(e) => setEdit({ ...edit, old_price: e.target.value ? Number(e.target.value) : null })} /></div>
                <div><Label>Estoque</Label><Input type="number" value={edit.stock ?? 0} onChange={(e) => setEdit({ ...edit, stock: Number(e.target.value) })} /></div>
              </div>
              <div><Label>Link da imagem (opcional)</Label><Input value={edit.image_url ?? ""} onChange={(e) => setEdit({ ...edit, image_url: e.target.value })} /></div>
              <div><Label>Descrição</Label><Textarea value={edit.description ?? ""} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></div>
              <label className="flex items-center gap-2 text-sm"><Switch checked={!!edit.requires_prescription} onCheckedChange={(v) => setEdit({ ...edit, requires_prescription: v })} />Exige receita</label>
              <Button onClick={save}>Salvar</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
