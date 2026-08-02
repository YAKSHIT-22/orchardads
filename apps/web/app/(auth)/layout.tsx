import { AuthShowcase } from '@/components/auth/auth-showcase';
import Link from 'next/link';
import { Toaster } from 'sonner';

/**
 * Split auth shell: form column on the left (each page supplies its own
 * heading + fields as `children`), branded showcase panel on the right
 * (hidden below md - the form must stand alone on small screens).
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-paper">
      <div className="flex w-full flex-col justify-center px-6 py-10 sm:px-10 md:w-1/2 lg:px-16">
        <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
          <Link href="/" className="flex items-center gap-2" aria-label="OrchardAds home">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-iris font-display text-sm text-white">
              O
            </span>
            <span className="font-display text-[17px] text-ink">OrchardAds</span>
          </Link>
          {children}
        </div>
      </div>
      <div className="hidden items-center justify-center bg-paper-sunk p-6 md:flex md:w-1/2 lg:p-10">
        <AuthShowcase />
      </div>
      <Toaster richColors position="top-center" />
    </div>
  );
}
