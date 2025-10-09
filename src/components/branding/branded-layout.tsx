import { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface BrandedLayoutProps {
  children: ReactNode;
  companyName: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  contactInfo?: {
    email?: string | null;
    phone?: string | null;
    website?: string | null;
  };
}

export function BrandedLayout({
  children,
  companyName,
  logoUrl,
  primaryColor,
  secondaryColor,
  contactInfo,
}: BrandedLayoutProps) {
  // Default colors if not provided
  const brandPrimary = primaryColor || '#2563eb'; // blue-600
  const brandSecondary = secondaryColor || '#1e40af'; // blue-700

  return (
    <div
      className="min-h-screen flex flex-col"
      style={
        {
          '--brand-primary': brandPrimary,
          '--brand-secondary': brandSecondary,
        } as React.CSSProperties
      }
    >
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo / Company Name */}
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={`${companyName} logo`}
                  width={120}
                  height={60}
                  className="object-contain max-h-16"
                  priority
                />
              ) : (
                <h1
                  className="text-2xl font-bold"
                  style={{ color: brandPrimary }}
                >
                  {companyName}
                </h1>
              )}
            </div>

            {/* Contact Info */}
            {contactInfo && (
              <nav className="hidden md:flex items-center gap-6">
                {contactInfo.phone && (
                  <a
                    href={`tel:${contactInfo.phone}`}
                    className="text-sm hover:opacity-80 transition-opacity"
                    style={{ color: brandPrimary }}
                  >
                    {contactInfo.phone}
                  </a>
                )}
                {contactInfo.email && (
                  <a
                    href={`mailto:${contactInfo.email}`}
                    className="text-sm hover:opacity-80 transition-opacity"
                    style={{ color: brandPrimary }}
                  >
                    {contactInfo.email}
                  </a>
                )}
                {contactInfo.website && (
                  <a
                    href={contactInfo.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm hover:opacity-80 transition-opacity"
                    style={{ color: brandPrimary }}
                  >
                    Strona główna →
                  </a>
                )}
              </nav>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white mt-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Company Info */}
            <div>
              <h3
                className="font-semibold mb-3"
                style={{ color: brandPrimary }}
              >
                {companyName}
              </h3>
              <p className="text-sm text-muted-foreground">
                Oferta mieszkań z automatycznymi aktualizacjami cen
              </p>
            </div>

            {/* Contact */}
            {contactInfo && (
              <div>
                <h3
                  className="font-semibold mb-3"
                  style={{ color: brandPrimary }}
                >
                  Kontakt
                </h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  {contactInfo.email && (
                    <p>
                      <a
                        href={`mailto:${contactInfo.email}`}
                        className="hover:opacity-80 transition-opacity"
                        style={{ color: brandPrimary }}
                      >
                        {contactInfo.email}
                      </a>
                    </p>
                  )}
                  {contactInfo.phone && (
                    <p>
                      <a
                        href={`tel:${contactInfo.phone}`}
                        className="hover:opacity-80 transition-opacity"
                        style={{ color: brandPrimary }}
                      >
                        {contactInfo.phone}
                      </a>
                    </p>
                  )}
                  {contactInfo.website && (
                    <p>
                      <a
                        href={contactInfo.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:opacity-80 transition-opacity"
                        style={{ color: brandPrimary }}
                      >
                        {contactInfo.website}
                      </a>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Powered by */}
            <div>
              <h3
                className="font-semibold mb-3"
                style={{ color: brandPrimary }}
              >
                Powered by
              </h3>
              <p className="text-sm text-muted-foreground">
                <Link
                  href="/"
                  className="hover:opacity-80 transition-opacity"
                  style={{ color: brandPrimary }}
                >
                  OtoRaport.pl
                </Link>
                {' '}
                - Automatyzacja raportowania cen mieszkań dla developerów
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} {companyName}. Wszystkie ceny są aktualne na dzień {new Date().toLocaleDateString('pl-PL')}.</p>
          </div>
        </div>
      </footer>

      {/* CSS Variables for branded elements */}
      <style jsx global>{`
        .text-primary {
          color: var(--brand-primary) !important;
        }
        .bg-primary {
          background-color: var(--brand-primary) !important;
        }
        .border-primary {
          border-color: var(--brand-primary) !important;
        }
        button.bg-primary:hover {
          background-color: var(--brand-secondary) !important;
        }
        a.text-primary:hover {
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
}
