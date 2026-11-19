import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SavedCep = { cep: string; city: string; state: string };
const STORAGE_KEY = "farmaquarema-cep";

const formatCep = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
};

export function CepSelector() {
  const [saved, setSaved] = useState<SavedCep | null>(null);
  const [open, setOpen] = useState(false);
  const [cep, setCep] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setSaved(JSON.parse(stored) as SavedCep);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const openDialog = () => {
    setCep(saved?.cep ?? "");
    setError("");
    setOpen(true);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) {
      setError("Digite um CEP válido com 8 números.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`https://viacep.com.br/ws/${encodeURIComponent(digits)}/json/`);
      if (!response.ok) throw new Error("unavailable");
      const data = await response.json() as { erro?: boolean; localidade?: string; uf?: string };
      if (data.erro || !data.localidade || !data.uf) {
        setError("CEP não encontrado. Confira os números e tente novamente.");
        return;
      }
      const next = { cep: formatCep(digits), city: data.localidade, state: data.uf };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSaved(next);
      setOpen(false);
      toast.success("Endereço de entrega atualizado");
    } catch {
      setError("Não foi possível consultar o CEP agora. Tente novamente.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button type="button" onClick={openDialog} className="flex shrink-0 items-center gap-2 rounded-md px-1 py-1 text-left text-foreground transition hover:text-primary" aria-label={saved ? "Alterar CEP de entrega" : "Informar CEP de entrega"}>
        <MapPin className="h-5 w-5 shrink-0 text-primary" />
        <span className="flex max-w-48 flex-col text-sm font-semibold">
          <span className="truncate">{saved ? `${saved.city}/${saved.state}` : "Insira seu CEP"}</span>
          {saved && <span className="truncate text-[11px] font-normal text-muted-foreground">{saved.cep} · 1 a 3 dias úteis</span>}
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Onde você quer receber?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Informe seu CEP para ver a cidade e uma estimativa de entrega.</p>
          <form onSubmit={submit} className="mt-2 space-y-4">
            <div>
              <Label htmlFor="cep">CEP</Label>
              <Input id="cep" value={cep} onChange={(event) => setCep(formatCep(event.target.value))} placeholder="00000-000" inputMode="numeric" autoComplete="postal-code" maxLength={9} required />
              {error && <p className="mt-2 text-sm text-sale" role="alert">{error}</p>}
            </div>
            {saved && <p className="rounded-xl bg-secondary p-3 text-sm text-secondary-foreground">Prazo estimado para {saved.city}/{saved.state}: <strong>1 a 3 dias úteis</strong>.</p>}
            <Button type="submit" className="w-full" disabled={busy}>{busy ? "Consultando..." : "Usar este CEP"}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
