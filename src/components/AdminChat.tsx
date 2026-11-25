import { useState } from "react";
import { Bot, MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { askAssistant } from "@/lib/assistant.functions";

type Msg = { from: "eu" | "ia"; text: string };

export function AdminChat() {
  const [open, setOpen] = useState(true);
  const [msgs, setMsgs] = useState<Msg[]>([{ from: "ia", text: "Olá! Sou o assistente da FarmaQuaresma. Como posso ajudar?" }]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const message = text.trim();
    if (!message || busy) return;
    setText("");
    setMsgs((m) => [...m, { from: "eu", text: message }]);
    setBusy(true);
    try {
      const r = await askAssistant({ data: { message, sessionId } });
      setMsgs((m) => [...m, { from: "ia", text: r.reply }]);
    } catch {
      setMsgs((m) => [...m, { from: "ia", text: "Erro ao enviar a mensagem." }]);
    } finally { setBusy(false); }
  };

  if (!open) return (
    <button onClick={() => setOpen(true)} aria-label="Abrir assistente" className="fixed bottom-5 left-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-card">
      <MessageCircle className="h-6 w-6" />
    </button>
  );

  return (
    <div className="fixed bottom-5 left-5 z-50 flex h-[28rem] w-[min(22rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border bg-card shadow-card">
      <div className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
        <span className="flex items-center gap-2 font-bold"><Bot className="h-5 w-5" />Assistente IA</span>
        <button onClick={() => setOpen(false)} aria-label="Fechar assistente"><X className="h-5 w-5" /></button>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3 text-sm">
        {msgs.map((m, i) => (
          <p key={i} className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-3 py-2 ${m.from === "eu" ? "ml-auto bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>{m.text}</p>
        ))}
        {busy && <p className="text-xs text-muted-foreground">Digitando...</p>}
      </div>
      <form onSubmit={send} className="flex gap-2 border-t p-2">
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Escreva sua mensagem" maxLength={2000} />
        <Button type="submit" size="icon" disabled={busy || !text.trim()} aria-label="Enviar"><Send className="h-4 w-4" /></Button>
      </form>
    </div>
  );
}
