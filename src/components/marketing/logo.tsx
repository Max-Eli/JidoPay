import Link from "next/link";

interface LogoProps {
  className?: string;
}

export function Logo({ className = "" }: LogoProps) {
  return (
    <Link
      href="/"
      className={`group inline-flex items-center gap-2 ${className}`}
      aria-label="JidoPay home"
    >
      <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background transition-transform group-hover:scale-[1.04]">
        <span className="font-display text-lg leading-none">J</span>
        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent ring-2 ring-background" />
      </span>
      <span className="font-display text-xl tracking-tight text-foreground">
        Jido<span className="text-accent">Pay</span>
      </span>
    </Link>
  );
}
