import { useState } from "react";
import { Lock, LogIn, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminChat } from "@/components/AdminChat";

export function RestrictedArea() {
  const { roles } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const isAdmin = roles.includes("admin");

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error("E-mail ou senha inválidos");
    else toast.success("Login feito. Se a conta for Admin, a área será liberada.");
  };

  if (!isAdmin) return (
    <div className="mx-auto max-w-sm rounded-2xl border bg-card p-6 shadow-card">
      <div className="flex items-center gap-2 font-bold"><Lock className="h-5 w-5 text-primary" />Área restrita</div>
      <p className="mt-1 text-sm text-muted-foreground">Entre com uma conta de administrador para liberar.</p>
      <form onSubmit={login} className="mt-4 space-y-3">
        <div><Label htmlFor="ra-email">E-mail</Label><Input id="ra-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
        <div><Label htmlFor="ra-pass">Senha</Label><Input id="ra-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
        <Button type="submit" className="w-full" disabled={busy}><LogIn className="h-4 w-4" />{busy ? "Entrando..." : "Entrar"}</Button>
      </form>
    </div>
  );

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-card">
      <div className="flex items-center gap-2 text-xl font-bold"><Sparkles className="h-5 w-5 text-primary" />Painel administrativo</div>
      <p className="mt-1 text-sm text-muted-foreground">Espaço para a IA generativa e futuras funções de administração. Use o assistente no canto inferior esquerdo.</p>
      <AdminChat />
    </div>
  );
}
