import { Baby, Droplets, HeartPulse, Leaf, Pill, Sparkles, type LucideIcon } from "lucide-react";

export type CategoryDetails = {
  name: string;
  description: string;
  icon: LucideIcon;
  tone: string;
};

export const CATEGORY_DETAILS: CategoryDetails[] = [
  { name: "Medicamentos", description: "Medicamentos e receitas", icon: Pill, tone: "bg-secondary text-primary" },
  { name: "Vitaminas", description: "Vitaminas e suplementos", icon: Leaf, tone: "bg-accent/25 text-accent-foreground" },
  { name: "Dermocosméticos", description: "Cuidados com a pele", icon: Sparkles, tone: "bg-sale/10 text-sale" },
  { name: "Higiene", description: "Cuidados diários", icon: Droplets, tone: "bg-chart-4/10 text-chart-4" },
  { name: "Infantil", description: "Cuidados com o bebê", icon: Baby, tone: "bg-spark/10 text-spark" },
  { name: "Saúde", description: "Aparelhos e proteção", icon: HeartPulse, tone: "bg-chart-5/10 text-chart-5" },
];

export const categoryDetails = (name: string) => CATEGORY_DETAILS.find((category) => category.name === name);
