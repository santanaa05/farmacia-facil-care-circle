type Credentials = { email: string; password: string };
type Tokens = { access_token: string; refresh_token: string };

export type AdminLoginChecks = {
  signIn: (credentials: Credentials) => Promise<{ session: Tokens | null; error: unknown }>;
  getUser: () => Promise<{ userId: string | null; error: unknown }>;
  hasAdminRole: (userId: string) => Promise<{ allowed: boolean | null; error: unknown }>;
};

// Validate with an isolated session; never replace the attendant's session on denial.
export async function validateAdminLogin(credentials: Credentials, checks: AdminLoginChecks): Promise<Tokens> {
  const login = await checks.signIn({ email: credentials.email.trim(), password: credentials.password });
  if (login.error || !login.session) throw new Error("E-mail ou senha inválidos.");
  const identity = await checks.getUser();
  if (identity.error || !identity.userId) throw new Error("Não foi possível confirmar esta conta. Tente novamente.");
  const permission = await checks.hasAdminRole(identity.userId);
  if (permission.error) throw new Error("Não foi possível verificar o acesso de administrador. Tente novamente.");
  if (permission.allowed !== true) throw new Error("Esta conta não tem acesso de administrador.");
  return login.session;
}