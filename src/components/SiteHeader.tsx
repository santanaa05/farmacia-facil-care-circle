import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search, ShoppingCart, User, Headset, Shield, Cross, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { QuickAccessBar } from "@/components/QuickAccessBar";
import { CepSelector } from "@/components/CepSelector";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { CATEGORY_DETAILS } from "@/lib/categories";

export function SiteHeader() {
  const { user, roles, signOut } = useAuth();
  const { count } = useCart();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const currentCategory = useLocation({ select: (location) => (location.search as { cat?: string }).cat });
  return (
    <header className="shadow-card">
      <div className="bg-primary-deep py-1.5 text-center text-xs text-primary-foreground">
        Frete grátis acima de R$ 99 · Retire na loja em 1 hora
      </div>
      <div className="sticky top-0 z-40">
        <div className="bg-primary text-primary-foreground">
          <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
            <Link to="/" className="flex shrink-0 items-center gap-2 text-xl font-extrabold">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground"><Cross className="h-5 w-5" /></span>
              FarmaQuarema
            </Link>
            <form className="relative flex-1" onSubmit={(e) => { e.preventDefault(); nav({ to: "/produtos", search: { q: q || undefined } }); }}>
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Busque por remédio, marca ou sintoma"
                className="h-11 rounded-full border-0 bg-card pl-4 pr-10 text-foreground" />
              <Search className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
            </form>
            <nav className="flex items-center gap-1 text-sm">
              {roles.includes("atendente") || roles.includes("admin") ? (
                <Link to="/atendente" className="hidden items-center gap-1 rounded-md px-2 py-1 hover:bg-primary-deep md:flex"><Headset className="h-4 w-4" />Atendimento</Link>
              ) : null}
              {roles.includes("admin") && (
                <Link to="/admin" className="hidden items-center gap-1 rounded-md px-2 py-1 hover:bg-primary-deep md:flex"><Shield className="h-4 w-4" />Admin</Link>
              )}
              {user ? (
                <>
                  <Link to="/conta" className="flex items-center gap-1 rounded-md px-2 py-1 hover:bg-primary-deep"><User className="h-4 w-4" /><span className="hidden sm:inline">Minha conta</span></Link>
                  <Button size="sm" variant="ghost" className="hidden hover:bg-primary-deep hover:text-primary-foreground sm:inline-flex" onClick={signOut}>Sair</Button>
                </>
              ) : (
                <Link to="/auth" className="flex items-center gap-1 rounded-md px-2 py-1 hover:bg-primary-deep"><User className="h-4 w-4" />Entrar</Link>
              )}
              <Link to="/carrinho" className="relative flex items-center rounded-md px-2 py-1 hover:bg-primary-deep">
                <ShoppingCart className="h-6 w-6" />
                {count > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-accent px-1.5 text-xs font-bold text-accent-foreground">{count}</span>}
              </Link>
            </nav>
          </div>
        </div>
        <div className="border-b bg-card">
          <div className="mx-auto flex max-w-7xl items-center gap-5 overflow-x-auto px-4 py-2.5 text-sm font-medium">
            <div className="shrink-0 border-r pr-4"><CepSelector /></div>
            <Link to="/produtos" className="flex shrink-0 items-center gap-2 whitespace-nowrap font-semibold text-foreground hover:text-primary"><Menu className="h-4 w-4" />Todas as categorias</Link>
            {CATEGORY_DETAILS.map((category) => {
              const active = currentCategory === category.name;
              return (
                <Link
                  key={category.name}
                  to="/produtos"
                  search={{ cat: category.name }}
                  className={`shrink-0 whitespace-nowrap border-b-2 py-1 transition ${active ? "border-primary font-bold text-primary" : "border-transparent text-muted-foreground hover:text-primary"}`}
                >
                  {category.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
      <QuickAccessBar />
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 bg-primary-deep text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 text-sm md:grid-cols-3">
        <div><p className="text-lg font-extrabold">FarmaQuarema</p><p className="mt-2 opacity-80">Cuidando da sua saúde todos os dias.</p></div>
        <div><p className="font-semibold">Atendimento</p><p className="mt-2 opacity-80">Seg a sáb, 8h às 22h</p></div>
        <div><p className="font-semibold">Farmacêutico responsável</p><p className="mt-2 opacity-80">Venda de medicamentos controlados somente com receita.</p></div>
      </div>
    </footer>
  );
}
