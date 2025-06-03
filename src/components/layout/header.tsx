import { BookHeart } from 'lucide-react';
import Link from 'next/link';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <BookHeart className="h-7 w-7 text-primary" />
          <span className="font-headline text-xl font-semibold">Resource Hub</span>
        </Link>
        {/* Add any additional header items here, e.g., UserProfile button */}
      </div>
    </header>
  );
}
