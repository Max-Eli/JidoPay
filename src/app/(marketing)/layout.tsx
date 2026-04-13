import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";
import { ScrollProgress } from "@/components/motion/scroll-progress";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollProgress />
      <MarketingNav />
      <main className="flex-1 pt-20">{children}</main>
      <MarketingFooter />
    </div>
  );
}
