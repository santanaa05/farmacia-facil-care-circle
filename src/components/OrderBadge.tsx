import { Badge } from "@/components/ui/badge";
export function OrderBadge({ status }: { status: string }) {
  const v = status === "entregue" ? "default" : status === "cancelado" ? "destructive" : "secondary";
  return <Badge variant={v} className="capitalize">{status}</Badge>;
}
