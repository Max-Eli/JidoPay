import { ThemeToggle } from "@/components/theme-toggle";

interface TopbarProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function Topbar({ title, description, actions }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-8 py-5">
        <div>
          <h1 className="font-display text-2xl leading-none">{title}</h1>
          {description && (
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {actions}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
