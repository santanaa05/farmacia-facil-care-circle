import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const askAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ message: z.string().trim().min(1).max(2000), sessionId: z.string().max(100) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) return { ok: false as const, reply: "Acesso permitido apenas para administradores." };
    const url = process.env["ASSISTANT_WEBHOOK_URL"];
    if (!url) return { ok: false as const, reply: "O webhook ainda não foi configurado." };
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: data.message, sessionId: data.sessionId, userId: context.userId, source: "farmaquaresma-atendente" }),
      });
      if (!res.ok) return { ok: false as const, reply: `O webhook respondeu com erro (${res.status}).` };
      const text = await res.text();
      let reply = text;
      try {
        const json = JSON.parse(text) as unknown;
        const obj = (Array.isArray(json) ? json[0] : json) as Record<string, unknown> | undefined;
        const v = obj && (obj["reply"] ?? obj["output"] ?? obj["message"] ?? obj["text"]);
        if (typeof v === "string") reply = v;
      } catch { /* resposta em texto puro */ }
      return { ok: true as const, reply: reply || "(sem resposta)" };
    } catch {
      return { ok: false as const, reply: "Não foi possível falar com o webhook agora." };
    }
  });
