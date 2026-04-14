import Link from "next/link";
import { Plus } from "lucide-react";

export function WalletCreditButton() {
  return (
    <Link
      href="/wallet/credit"
      className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-xs font-medium text-background transition-all hover:scale-[1.02] hover:bg-foreground/90"
    >
      <Plus className="h-3.5 w-3.5" />
      Credit wallet
    </Link>
  );
}
