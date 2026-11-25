import { useLocation } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ChatBox } from "@/components/ChatBox";
import { useAuth, isStaff } from "@/lib/auth";
import { askCustomerAssistant } from "@/lib/assistant.functions";

export function CustomerChat() {
  const { pathname } = useLocation();
  const { roles } = useAuth();
  const send = useServerFn(askCustomerAssistant);
  if (pathname.startsWith("/admin") || pathname.startsWith("/atendente") || isStaff(roles)) return null;
  return <ChatBox floating title="Fale com a FarmaQuaresma" greeting="Olá! Posso ajudar a encontrar produtos, tirar dúvidas sobre pedidos e entregas." send={send} />;
}
