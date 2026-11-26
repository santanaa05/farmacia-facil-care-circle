import { createClient } from "@supabase/supabase-js";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/lib/auth";
import { validateAdminLogin } from "@/lib/admin-login";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AdminLogin() {
  const { roles } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      // In-memory only: rejected credentials never log out the current attendant.
      const isolated = createClient<Database>(
        import.meta.env["VITE_SUPABASE_URL"],
        import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"],
        { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: "admin-login-verification" } },
      );
      const session = await validateAdminLogin({ email, password }, {
        signIn: async (credentials) => {
          const { data, error: loginError } = await isolated.auth.signInWithPassword(credentials);
          return { session: data.session, error: loginError };
        },
        getUser: async () => {
          const { data, error: userError } = await isolated.auth.getUser();
          return { userId: data.user?.id ?? null, error: userError };
        },
        hasAdminRole: async (userId) => {
          const { data, error: roleError } = await isolated.rpc("has_role", { _user_id: userId, _role: "admin" });
          return { allowed: data, error: roleError };
        },
      });
      await queryClient.cancelQueries();
      const { error: sessionError } = await supabase.auth.setSession(session);
      if (sessionError) throw new Error("Não foi possível abrir a sessão de administrador. Tente novamente.");
      queryClient.clear();
      setPassword("");
      await navigate({ to: "/admin" });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível entrar. Tente novamente.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mx-auto max-w-md py-4 sm:py-8" aria-labelledby="admin-login-title">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-primary"><ShieldCheck className="h-6 w-6" /></div>
      <p className="text-xs font-bold uppercase text-primary">Área restrita</p>
      <h2 id="admin-login-title" className="mt-2 text-2xl font-extrabold">Login do Admin</h2>
      {roles.includes("admin") ? (
        <div className="mt-6">
          <Button asChild className="w-full"><Link to="/admin">Abrir painel do Admin<ArrowRight className="h-4 w-4" /></Link></Button>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-5">
          <div className="space-y-2"><Label htmlFor="admin-email">E-mail do administrador</Label><Input id="admin-email" type="email" required maxLength={255} autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} disabled={busy} /></div>
          <div className="space-y-2">
            <Label htmlFor="admin-password">Senha</Label>
            <div className="relative">
              <Input id="admin-password" type={showPassword ? "text" : "password"} required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={busy} className="pr-12" />
              <Button type="button" size="icon" variant="ghost" className="absolute right-0 top-0 h-9 w-10" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} title={showPassword ? "Ocultar senha" : "Mostrar senha"} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
            </div>
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" size="lg" disabled={busy} className="w-full">{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}{busy ? "Verificando acesso..." : "Entrar como Admin"}</Button>
        </form>
      )}
    </section>
  );
}