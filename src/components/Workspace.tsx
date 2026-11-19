import type { LucideIcon } from "lucide-react";

export const workspaceTabsList = "grid h-auto w-full gap-1 rounded-2xl bg-secondary p-1.5";
export const workspaceTabTrigger = "flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-card";

export function WorkspaceHeader({ icon: Icon, eyebrow, title, description }: { icon: LucideIcon; eyebrow: string; title: string; description: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border bg-secondary p-5 md:p-6">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground md:h-14 md:w-14">
        <Icon className="h-6 w-6 md:h-7 md:w-7" />
      </span>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-extrabold md:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
