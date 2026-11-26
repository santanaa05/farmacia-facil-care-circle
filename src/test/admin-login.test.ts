import { describe, expect, it, vi } from "vitest";
import { validateAdminLogin, type AdminLoginChecks } from "@/lib/admin-login";

function checks(allowed: boolean): AdminLoginChecks {
  return {
    signIn: vi.fn().mockResolvedValue({ session: { access_token: "test-access", refresh_token: "test-refresh" }, error: null }),
    getUser: vi.fn().mockResolvedValue({ userId: "verified-user", error: null }),
    hasAdminRole: vi.fn().mockResolvedValue({ allowed, error: null }),
  };
}

describe("Admin login from the attendant panel", () => {
  it("allows only a verified administrator to replace the current session", async () => {
    const verification = checks(true);
    await expect(validateAdminLogin({ email: " admin@example.test ", password: "test-password" }, verification)).resolves.toEqual({ access_token: "test-access", refresh_token: "test-refresh" });
    expect(verification.hasAdminRole).toHaveBeenCalledWith("verified-user");
  });

  it("denies attendant credentials without returning a replacement session", async () => {
    await expect(validateAdminLogin({ email: "attendant@example.test", password: "test-password" }, checks(false))).rejects.toThrow("Esta conta não tem acesso de administrador.");
  });

  it("rejects incorrect credentials before checking permissions", async () => {
    const verification = checks(true);
    verification.signIn = vi.fn().mockResolvedValue({ session: null, error: new Error("invalid") });
    await expect(validateAdminLogin({ email: "admin@example.test", password: "wrong" }, verification)).rejects.toThrow("E-mail ou senha inválidos.");
    expect(verification.hasAdminRole).not.toHaveBeenCalled();
  });

  it("fails closed if the server cannot verify the role", async () => {
    const verification = checks(true);
    verification.hasAdminRole = vi.fn().mockResolvedValue({ allowed: null, error: new Error("offline") });
    await expect(validateAdminLogin({ email: "admin@example.test", password: "test-password" }, verification)).rejects.toThrow("Não foi possível verificar");
  });
});