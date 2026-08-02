import { AuthShowcase } from '@/components/auth/auth-showcase';
import { Logo } from '@/components/brand/logo';
import { Toaster } from 'sonner';

/**
 * Split auth shell: form column on the left (each page supplies its own
 * heading + fields as `children`), branded showcase panel on the right
 * (hidden below md - the form must stand alone on small screens).
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-paper">
      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 md:w-1/2 lg:px-20 xl:px-24">
        <div className="mx-auto flex w-full max-w-md flex-col gap-10">
          <Logo width={172} className="h-10 w-auto" />
          {children}
        </div>
      </div>
      <div className="hidden items-center justify-center bg-paper-sunk p-10 md:flex md:w-1/2 lg:p-16">
        <div className="w-full max-w-md">
          <AuthShowcase />
        </div>
      </div>
      <Toaster richColors position="top-center" />
    </div>
  );
}
