import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useAuth, type Role } from "@/lib/auth";

export function RoleGuard({ allow, children }: { allow?: Role[]; children: ReactNode }) {
  const { user, roles, loading } = useAuth();
  if (loading) return <p className="p-10 text-center">Carregando...</p>;
  if (!user) return (
    <div className="p-16 text-center"><p className="text-lg font-semibold">Faça login para continuar</p><Button asChild className="mt-4"><Link to="/auth">Entrar</Link></Button></div>
  );
  if (allow && !allow.some((r) => roles.includes(r))) return <p className="p-16 text-center text-lg font-semibold">Você não tem permissão para acessar esta página.</p>;
  return <>{children}</>;
}
