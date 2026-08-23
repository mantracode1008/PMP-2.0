import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'PMP - Project Management Portal',
  description: 'Enterprise Project Management Portal - Production SaaS Foundation',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
