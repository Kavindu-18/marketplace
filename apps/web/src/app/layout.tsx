import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';

export const metadata: Metadata = {
  title: {
    default: 'Marketplace — Find Trusted Services in Sri Lanka',
    template: '%s | Marketplace SL',
  },
  description:
    'Location-based services marketplace for Sri Lanka. Find verified providers near you — free to search, no account required.',
  keywords: ['services', 'Sri Lanka', 'marketplace', 'local', 'providers', 'verified'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white antialiased">
        <Providers>
          <Navbar />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
