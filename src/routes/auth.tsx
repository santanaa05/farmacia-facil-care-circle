import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — FarmaQuarema" },
      { name: "description", content: "Entre ou crie sua conta na FarmaQuarema." },
      { property: "og:title", content: "Entrar — FarmaQuarema" },
      { property: "og:description", content: "Acesse sua conta FarmaQuarema." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const { user } = useAuth();
  const nav = useNavigate();
  useEffect(() => { if (user) nav({ to: "/conta" }); }, [user, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error("E-mail ou senha inválidos");
    } else {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin, data: { full_name: name } } });
      if (error) toast.error(error.message);
      else toast.success("Conta criada! Confira seu e-mail para confirmar.");
    }
    setBusy(false);
  };

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <div className="rounded-2xl border bg-card p-8 shadow-card">
        <h1 className="text-2xl font-extrabold">{mode === "in" ? "Entrar" : "Criar conta"}</h1>
        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === "up" && <div><Label>Nome completo</Label><Input required value={name} onChange={(e) => setName(e.target.value)} /></div>}
          <div><Label>E-mail</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><Label>Senha</Label><Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <Button className="w-full" size="lg" disabled={busy}>{mode === "in" ? "Entrar" : "Cadastrar"}</Button>
        </form>
        <button className="mt-4 w-full text-sm text-primary" onClick={() => setMode(mode === "in" ? "up" : "in")}>
          {mode === "in" ? "Não tem conta? Cadastre-se" : "Já tem conta? Entrar"}
        </button>
      </div>
    </div>
  );
}
