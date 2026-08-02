import { MarketingFooter } from '@/components/marketing/footer';
import { MarketingNav } from '@/components/marketing/nav';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <MarketingNav />
      <div className="flex-1">{children}</div>
      <MarketingFooter />
    </div>
  );
}
