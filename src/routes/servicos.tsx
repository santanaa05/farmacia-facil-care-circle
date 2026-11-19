import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, MapPin, ShieldCheck, ShoppingCart, Syringe, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/servicos")({
  head: () => ({
    meta: [
      { title: "Serviços e vacinas — FarmaQuarema" },
      { name: "description", content: "Vacinas, aferição de pressão, entrega rápida e retirada na loja na FarmaQuarema." },
      { property: "og:title", content: "Serviços e vacinas — FarmaQuarema" },
      { property: "og:description", content: "Serviços de saúde, entrega e retirada na FarmaQuarema." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Servicos,
});

const services = [
  { icon: Syringe, title: "Vacinas", text: "Gripe, febre amarela, hepatite e HPV. Consulte a carteira de vacinação com nosso farmacêutico." },
  { icon: ShieldCheck, title: "Aferição de pressão", text: "Medição gratuita na loja, sem agendamento, de segunda a sábado." },
  { icon: Clock, title: "Teste de glicemia", text: "Resultado na hora e orientação sobre os próximos passos." },
  { icon: Truck, title: "Entrega em até 2 horas", text: "Frete grátis acima de R$ 99 para a sua região." },
  { icon: MapPin, title: "Retire na loja em 1 hora", text: "Escolha a unidade na finalização do pedido e busque quando estiver pronto." },
  { icon: ShoppingCart, title: "Compra com receita", text: "Envie a receita no checkout; medicamentos controlados só saem com receita válida." },
];

function Servicos() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-extrabold md:text-3xl">Serviços e vacinas</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        Atendimento de farmácia para cuidar da sua saúde no dia a dia. Disponibilidade pode variar por unidade.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {services.map((s) => (
          <div key={s.title} className="rounded-xl border bg-card p-5 shadow-card">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink">
              <s.icon className="h-5 w-5 text-spark" strokeWidth={1.8} />
            </span>
            <p className="mt-3 font-bold">{s.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl bg-hero p-6 text-primary-foreground md:p-8">
        <p className="text-lg font-extrabold">Precisa de ajuda para escolher?</p>
        <p className="mt-1 max-w-xl text-sm opacity-90">Nossos atendentes ajudam com doses, interações e produtos semelhantes mais baratos.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild variant="secondary"><Link to="/produtos">Ver produtos</Link></Button>
          <Button asChild variant="outline" className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
            <Link to="/conta">Acompanhar meus pedidos</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
