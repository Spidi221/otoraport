import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClientSessionProvider } from "@/components/providers/session-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "OTORAPORT - Automatyzacja Raportowania Cen Mieszkań | Ustawa o Ochronie Nabywcy",
    template: "%s | OTORAPORT - Compliance dla Deweloperów"
  },
  description: "Automatyzuj raportowanie cen mieszkań zgodnie z ustawą o ochronie nabywcy. System dla deweloperów - generuje raporty XML i Markdown automatycznie. 14 dni za darmo.",
  keywords: [
    "raportowanie cen mieszkań",
    "ustawa o ochronie nabywcy",
    "automatyzacja raportowania",
    "compliance nieruchomości",
    "deweloper mieszkaniowy",
    "raporty XML mieszkania",
    "wykazcen alternatywa",
    "ministerstwo rozwoju raporting",
    "nieruchomości compliance",
    "automatyzacja deweloperska"
  ],
  authors: [{ name: "OTORAPORT Team" }],
  creator: "OTORAPORT",
  publisher: "OTORAPORT",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'pl_PL',
    url: 'https://otoraport.pl',
    siteName: 'OTORAPORT',
    title: 'OTORAPORT - Automatyzacja Raportowania Cen Mieszkań',
    description: 'Automatyzuj raportowanie cen mieszkań zgodnie z ustawą o ochronie nabywcy. System dla deweloperów - generuje raporty XML i Markdown automatycznie.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'OTORAPORT - Automatyzacja Raportowania Cen Mieszkań',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OTORAPORT - Automatyzacja Raportowania Cen Mieszkań',
    description: 'Automatyzuj raportowanie cen mieszkań zgodnie z ustawą o ochronie nabywcy. 14 dni za darmo.',
    images: ['/og-image.jpg'],
  },
  alternates: {
    canonical: 'https://otoraport.pl',
    languages: {
      'pl': 'https://otoraport.pl',
    },
  },
  category: 'Real Estate Software',
  classification: 'Business Software',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <head>
        <meta name="geo.region" content="PL" />
        <meta name="geo.country" content="Poland" />
        <meta name="geo.placename" content="Polska" />
        <meta name="distribution" content="Poland" />
        <meta name="target_country" content="PL" />
        <meta name="language" content="Polish" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClientSessionProvider>
          {children}
        </ClientSessionProvider>
      </body>
    </html>
  );
}
