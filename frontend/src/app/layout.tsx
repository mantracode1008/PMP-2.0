import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'PMP - Project Management Portal',
  description: 'Enterprise Project Management Portal - Production SaaS Foundation',
};

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#ffffff',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light" style={{ colorScheme: 'light' }}>
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen" style={{ colorScheme: 'light' }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
