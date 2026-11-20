'use client';

// The app frame: top menu + page area.
// Public landing pages (/p/...) get no menu, so partners only see the page itself.

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Shell({ children }) {
  const pathname = usePathname();

  if (pathname?.startsWith('/p/')) {
    return <div className="public-shell">{children}</div>;
  }

  return (
    <>
      <header className="topbar">
        <Link href="/" className="logo">Partner Outreach</Link>
        <nav>
          <Link href="/">Dashboard</Link>
          <Link href="/landing">Landing pages</Link>
          <Link href="/add">+ Add partner</Link>
        </nav>
      </header>
      <main className="container">{children}</main>
    </>
  );
}