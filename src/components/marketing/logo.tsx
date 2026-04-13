import Link from "next/link";
import Image from "next/image";

interface LogoProps {
  className?: string;
}

export function Logo({ className = "" }: LogoProps) {
  return (
    <Link
      href="/"
      aria-label="JidoPay home"
      className={`group inline-flex items-center gap-2.5 ${className}`}
    >
      <Image
        src="/favicon.png"
        alt=""
        width={32}
        height={32}
        priority
        className="h-8 w-8 transition-transform duration-500 ease-out group-hover:scale-[1.06]"
      />
      <span className="font-display text-[22px] leading-none tracking-[-0.01em] text-foreground">
        JidoPay
      </span>
    </Link>
  );
}
