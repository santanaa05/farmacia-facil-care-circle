import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronRight, Heart, Medal, Syringe, Ticket, Zap } from "lucide-react";
import { useFavorites } from "@/lib/favorites";

const WINDOW_MS = 2 * 60 * 60 * 1000;
const pad = (n: number) => String(n).padStart(2, "0");

export function useOfferCountdown() {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setLeft(WINDOW_MS - (Date.now() % WINDOW_MS));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);
  if (left === null) return null;
  const s = Math.floor(left / 1000);
  return `${pad(Math.floor(s / 3600))}h ${pad(Math.floor(s / 60) % 60)}m ${pad(s % 60)}s`;
}

const chip = "flex w-[104px] shrink-0 flex-col items-center gap-2 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
const tile = "relative flex h-16 w-full items-center justify-center rounded-xl bg-ink text-ink-foreground transition hover:bg-ink/90";
const label = "min-h-8 text-center text-xs font-semibold leading-tight text-foreground";

export function QuickAccessBar() {
  const left = useOfferCountdown();
  const { count } = useFavorites();

  return (
    <div className="border-b bg-card">
      <div className="mx-auto flex max-w-7xl items-stretch gap-4 overflow-x-auto px-4 py-3">
        <Link
          to="/produtos"
          search={{ sort: "desconto", off: true }}
          className="group relative flex min-w-[300px] shrink-0 flex-col justify-center overflow-hidden rounded-xl bg-ink px-4 py-3 text-left text-ink-foreground transition hover:bg-ink/90"
        >
          <span className="absolute inset-x-0 top-0 h-1 bg-spark" />
          <span className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-spark" strokeWidth={2} />
            <span className="text-sm font-extrabold">Oferta Relâmpago</span>
          </span>
          <span className="mt-1.5 flex items-center gap-3 text-xs">
            <span className="opacity-80">Aproveite agora!</span>
            <span className="font-mono text-sm font-bold tabular-nums text-spark">{left ?? "--h --m --s"}</span>
          </span>
          <ChevronRight className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60 transition group-hover:translate-x-0.5" />
        </Link>

        <Link to="/produtos" search={{ sort: "buscados" }} className={chip}>
          <span className={tile}><Medal className="h-7 w-7 text-spark" strokeWidth={1.6} /></span>
          <span className={label}>Mais procurados</span>
        </Link>

        <Link to="/salvos" className={chip}>
          <span className={tile}>
            <Heart className="h-7 w-7 text-spark" strokeWidth={1.6} />
            {count > 0 && <span className="absolute -right-1.5 -top-1.5 min-w-5 rounded-full bg-spark px-1 text-center text-xs font-bold leading-5 text-spark-foreground">{count}</span>}
          </span>
          <span className={label}>Produtos salvos</span>
        </Link>

        <Link to="/cupons" className={chip}>
          <span className={tile}><Ticket className="h-7 w-7 text-spark" strokeWidth={1.6} /></span>
          <span className={label}>Cupons</span>
        </Link>

        <Link to="/servicos" className={chip}>
          <span className={tile}><Syringe className="h-7 w-7 text-spark" strokeWidth={1.6} /></span>
          <span className={label}>Serviços e Vacinas</span>
        </Link>
      </div>
    </div>
  );
}
