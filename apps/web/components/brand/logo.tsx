import Image from 'next/image';
import Link from 'next/link';

/** The real OrchardAds wordmark (orchard tree + ORCHARD ADS), from the brand SVG.
 *  Use `variant="light"` on dark surfaces. */
export function Logo({
  href = '/',
  variant = 'dark',
  className,
  width = 132,
}: {
  href?: string | null;
  variant?: 'dark' | 'light';
  className?: string;
  width?: number;
}) {
  const src = variant === 'light' ? '/assets/logo2.svg' : '/assets/logo.svg';
  const img = (
    <Image
      src={src}
      alt="OrchardAds"
      width={width}
      height={Math.round((width * 148) / 358)}
      className={className ?? 'h-8 w-auto'}
      priority
      unoptimized
    />
  );
  if (href === null) return img;
  return (
    <Link href={href} className="inline-flex items-center" aria-label="OrchardAds home">
      {img}
    </Link>
  );
}
