import type { Metadata } from "next";

export const landingMetadata: Metadata = {
  title: "OTO-RAPORT - Automatyczne Raportowanie Cen Mieszkań | Zgodność z Ustawą",
  description: "Automatyzuj raportowanie cen mieszkań zgodnie z ustawą z 21 maja 2025. Generuj publiczne endpointy XML/CSV/MD5 dla ministerstwa. Smart parser 58 pól. Rozpocznij bezpłatny trial.",
  keywords: [
    "raportowanie cen mieszkań automatyczne",
    "ustawa o ochronie nabywcy mieszkania",
    "compliance deweloperzy nieruchomości",
    "generator raportów XML mieszkania",
    "wykazcen.pl alternatywa",
    "ministerstwo rozwoju raporting",
    "automatyzacja compliance nieruchomości",
    "system raportowania dla deweloperów",
    "raporty markdown XML mieszkania",
    "software dla deweloperów mieszkaniowych"
  ],
  openGraph: {
    title: "OTO-RAPORT - Automatyczne Raportowanie Cen Mieszkań dla Deweloperów",
    description: "Jeden plik miesięcznie = pełna automatyzacja compliance. 25% szybciej niż konkurencja. 14 dni za darmo.",
    type: "website",
    locale: "pl_PL",
    url: "https://oto-raport.pl",
    siteName: "OTO-RAPORT",
    images: [
      {
        url: "/og-landing.jpg",
        width: 1200,
        height: 630,
        alt: "OTO-RAPORT - Dashboard automatyzacji raportowania cen mieszkań",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OTO-RAPORT - Automatyczne Raportowanie Cen Mieszkań",
    description: "Jeden plik miesięcznie = pełna automatyzacja compliance. 25% szybciej niż konkurencja. 14 dni za darmo.",
    images: ["/og-landing.jpg"],
  },
  alternates: {
    canonical: "https://oto-raport.pl",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "@id": "https://oto-raport.pl/#software",
      "name": "OTO-RAPORT",
      "description": "Automatyzacja raportowania cen mieszkań zgodnie z ustawą z 21 maja 2025. System dla deweloperów generujący publiczne endpointy XML/CSV/MD5 w formacie ministerstwa 1.13.",
      "url": "https://oto-raport.pl",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web Browser",
      "offers": [
        {
          "@type": "Offer",
          "name": "Plan Basic",
          "description": "Dla małych deweloperów z 1-2 inwestycjami",
          "price": "149",
          "priceCurrency": "PLN",
          "billingDuration": "P1M",
          "availability": "https://schema.org/InStock"
        },
        {
          "@type": "Offer",
          "name": "Plan Pro", 
          "description": "Dla średnich deweloperów z wieloma projektami",
          "price": "249",
          "priceCurrency": "PLN",
          "billingDuration": "P1M",
          "availability": "https://schema.org/InStock"
        },
        {
          "@type": "Offer",
          "name": "Plan Enterprise", 
          "description": "Dla dużych deweloperów z wieloma projektami",
          "price": "499",
          "priceCurrency": "PLN",
          "billingDuration": "P1M",
          "availability": "https://schema.org/InStock"
        }
      ],
      "featureList": [
        "Automatyczne generowanie raportów XML 1.13 i CSV",
        "Zgodność z ustawą o ochronie nabywcy",
        "Smart CSV Parser z wykrywaniem 58 pól ministerstwa",
        "Stałe publiczne endpointy dla ministerstwa",
        "Upload plików CSV, XML, Excel",
        "Dashboard zarządzania",
        "Enterprise-grade bezpieczeństwo (RLS, encryption)",
        "RODO compliance"
      ],
      "screenshot": "https://oto-raport.pl/dashboard-screenshot.jpg",
      "softwareVersion": "1.0",
      "datePublished": "2025-01-01",
      "creator": {
        "@type": "Organization",
        "@id": "https://oto-raport.pl/#organization"
      },
      "downloadUrl": "https://oto-raport.pl/auth/signup",
      "installUrl": "https://oto-raport.pl/auth/signup"
    },
    {
      "@type": "Organization",
      "@id": "https://oto-raport.pl/#organization", 
      "name": "OTO-RAPORT",
      "url": "https://oto-raport.pl",
      "logo": "https://oto-raport.pl/logo.png",
      "description": "Dostawca oprogramowania do automatyzacji raportowania cen mieszkań dla deweloperów w Polsce",
      "foundingDate": "2024",
      "founders": [{
        "@type": "Person",
        "name": "OTO-RAPORT Team"
      }],
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "PL",
        "addressLocality": "Warszawa"
      },
      "contactPoint": [{
        "@type": "ContactPoint",
        "contactType": "customer support",
        "availableLanguage": "Polish",
        "email": "support@oto-raport.pl"
      }],
      "sameAs": [],
      "areaServed": {
        "@type": "Country",
        "name": "Poland"
      }
    },
    {
      "@type": "WebSite",
      "@id": "https://oto-raport.pl/#website",
      "url": "https://oto-raport.pl",
      "name": "OTO-RAPORT",
      "description": "Automatyzacja raportowania cen mieszkań zgodnie z ustawą o ochronie nabywcy",
      "publisher": {
        "@id": "https://oto-raport.pl/#organization"
      },
      "inLanguage": "pl-PL",
      "potentialAction": [{
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://oto-raport.pl/search?q={search_term_string}"
        },
        "query-input": "required name=search_term_string"
      }]
    },
    {
      "@type": "Service",
      "@id": "https://oto-raport.pl/#service",
      "name": "Automatyzacja raportowania cen mieszkań",
      "description": "Usługa automatycznego generowania publicznych endpointów XML/CSV/MD5 z danymi cen mieszkań zgodnych z ustawą z 21 maja 2025 i formatem ministerstwa 1.13",
      "provider": {
        "@id": "https://oto-raport.pl/#organization" 
      },
      "areaServed": {
        "@type": "Country",
        "name": "Poland"
      },
      "audience": {
        "@type": "BusinessAudience",
        "audienceType": "Deweloperzy mieszkaniowi"
      },
      "serviceType": "Software as a Service",
      "offers": {
        "@type": "Offer",
        "availability": "https://schema.org/InStock",
        "hasOfferCatalog": {
          "@type": "OfferCatalog",
          "name": "Plany subskrypcyjne OTO-RAPORT",
          "itemListElement": [
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Plan Basic"
              },
              "price": "149",
              "priceCurrency": "PLN"
            },
            {
              "@type": "Offer", 
              "itemOffered": {
                "@type": "Service",
                "name": "Plan Pro"
              },
              "price": "249",
              "priceCurrency": "PLN"
            },
            {
              "@type": "Offer", 
              "itemOffered": {
                "@type": "Service",
                "name": "Plan Enterprise"
              },
              "price": "499",
              "priceCurrency": "PLN"
            }
          ]
        }
      }
    },
    {
      "@type": "FAQPage",
      "@id": "https://oto-raport.pl/#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Jak działa automatyzacja raportowania cen mieszkań w OTO-RAPORT?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "OTO-RAPORT automatycznie generuje publiczne endpointy XML/CSV/MD5 zgodne z ustawą z 21 maja 2025. Wystarczy wgrać plik z cenami, a system utworzy stałe URL które rejestrujesz na portalu dane.gov.pl - ministerstwo pobiera dane automatycznie z Twoich endpointów."
          }
        },
        {
          "@type": "Question", 
          "name": "Jakie formaty plików obsługuje OTO-RAPORT?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "System obsługuje pliki CSV, XML i Excel. Automatycznie rozpoznaje format i przetwarza dane zgodnie z wymaganiami ustawy o ochronie nabywcy mieszkania."
          }
        },
        {
          "@type": "Question",
          "name": "Czy OTO-RAPORT jest zgodny z ustawą o ochronie nabywcy?",
          "acceptedAnswer": {
            "@type": "Answer", 
            "text": "Tak, OTO-RAPORT generuje raporty w pełni zgodne z wymogami ustawy z 21 maja 2025 roku. Wszystkie raporty XML i Markdown są automatycznie formatowane zgodnie z najnowszymi wymaganiami ministerstwa."
          }
        },
        {
          "@type": "Question",
          "name": "Ile kosztuje OTO-RAPORT w porównaniu do wykazcen.pl?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Plan Basic kosztuje 149 zł/miesiąc, Pro 249 zł/miesiąc, Enterprise 499 zł/miesiąc. W porównaniu do wykazcen.pl oferujemy 25% szybszy onboarding i pełną automatyzację procesów, co znacząco oszczędza czas deweloperów."
          }
        }
      ]
    }
  ]
};