import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Headset, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — FarmaQuaresma" },
      { name: "description", content: "Entre ou crie sua conta na FarmaQuaresma." },
      { property: "og:title", content: "Entrar — FarmaQuaresma" },
      { property: "og:description", content: "Acesse sua conta FarmaQuaresma." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

type Access = "cliente" | "atendente";

function AuthPage() {
  const [access, setAccess] = useState<Access>("cliente");
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const { user } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (user) nav({ to: access === "atendente" ? "/atendente" : "/conta" });
  }, [user, nav, access]);

  const selectAccess = (next: Access) => {
    setAccess(next);
    setMode("in");
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) toast.error("E-mail ou senha inválidos");
    } else {
      if (access !== "cliente") {
        setBusy(false);
        return;
      }
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: window.location.origin, data: { full_name: name.trim() } },
      });
      if (error) toast.error(error.message);
      else toast.success("Conta criada! Confira seu e-mail para confirmar.");
    }
    setBusy(false);
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-2xl border bg-card p-6 shadow-card sm:p-8">
        <div role="tablist" aria-label="Tipo de acesso" className="grid grid-cols-2 gap-1 rounded-xl bg-secondary p-1">
          <button type="button" role="tab" aria-selected={access === "cliente"} onClick={() => selectAccess("cliente")} className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold transition ${access === "cliente" ? "bg-card text-primary shadow-card" : "text-muted-foreground"}`}>
            <UserRound className="h-4 w-4" />Cliente
          </button>
          <button type="button" role="tab" aria-selected={access === "atendente"} onClick={() => selectAccess("atendente")} className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold transition ${access === "atendente" ? "bg-card text-primary shadow-card" : "text-muted-foreground"}`}>
            <Headset className="h-4 w-4" />Atendente
          </button>
        </div>

        <div className="mt-7">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{access === "cliente" ? "Área do cliente" : "Portal da equipe"}</p>
          <h1 className="mt-1 text-2xl font-extrabold">{mode === "in" ? "Entrar na FarmaQuaresma" : "Criar conta de cliente"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {access === "cliente" ? "Acompanhe pedidos, salvos e ofertas na sua conta." : "Use o e-mail e a senha liberados pelo administrador da farmácia."}
          </p>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === "up" && access === "cliente" && (
            <div><Label htmlFor="name">Nome completo</Label><Input id="name" required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} /></div>
          )}
          <div><Label htmlFor="email">E-mail</Label><Input id="email" type="email" required maxLength={255} autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></div>
          <div><Label htmlFor="password">Senha</Label><Input id="password" type="password" required minLength={6} autoComplete={mode === "in" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} /></div>
          <Button className="w-full" size="lg" disabled={busy}>{busy ? "Aguarde..." : mode === "in" ? `Entrar como ${access}` : "Cadastrar"}</Button>
        </form>

        {access === "cliente" ? (
          <button type="button" className="mt-4 w-full text-sm font-semibold text-primary" onClick={() => setMode(mode === "in" ? "up" : "in")}>
            {mode === "in" ? "Não tem conta? Cadastre-se" : "Já tem conta? Entrar"}
          </button>
        ) : (
          <p className="mt-5 rounded-xl bg-secondary p-3 text-center text-xs leading-5 text-secondary-foreground">
            O cadastro de atendentes não é público. O administrador libera o acesso da equipe.
          </p>
        )}
      </div>
    </div>
  );
}
