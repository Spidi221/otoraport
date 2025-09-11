import { landingMetadata, structuredData } from './metadata';
import ScrollToTop from '@/components/ScrollToTop';
import PricingSection from '@/components/PricingSection';
import type { Metadata } from 'next';

export const metadata: Metadata = landingMetadata;

function StructuredData() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

// Landing page optimized for SEO and AEO (Answer Engine Optimization)
export default function LandingPage() {
  return (
    <>
      <StructuredData />
      <main className="min-h-screen w-full bg-white overflow-x-hidden">
      {/* Navigation - SEO Enhanced */}
      <header>
        <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-lg border-b border-gray-200 shadow-sm" role="navigation" aria-label="Nawigacja główna">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent" itemProp="name">OTORAPORT</span>
              </div>
            </div>
            <div className="hidden md:flex space-x-8" role="menubar">
              <a href="#features" className="nav-link text-gray-700 hover:text-blue-600 font-medium" role="menuitem">Funkcje</a>
              <a href="#pricing" className="nav-link text-gray-700 hover:text-blue-600 font-medium" role="menuitem">Cennik</a>
              <a href="#demo" className="nav-link text-gray-700 hover:text-blue-600 font-medium" role="menuitem">Demo</a>
              <a href="#faq" className="nav-link text-gray-700 hover:text-blue-600 font-medium" role="menuitem">FAQ</a>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/auth/signin" className="text-gray-700 hover:text-blue-600 transition-colors font-medium" aria-label="Zaloguj się do konta OTORAPORT">Logowanie</a>
              <a href="/auth/signup" className="btn-subtle-hover bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-800 font-semibold shadow-md" aria-label="Rozpocznij darmowy okres próbny OTORAPORT">
                Wypróbuj za darmo
              </a>
            </div>
          </div>
        </div>
        </nav>
      </header>

      {/* Hero Section - SEO Enhanced */}
      <section id="hero" className="pt-16 pb-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-white relative overflow-hidden min-h-screen flex items-center" itemScope itemType="https://schema.org/SoftwareApplication">
        {/* Background Decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2s"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4s"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 relative z-10">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold mb-6">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Zgodne z ustawą z 21 maja 2025
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight" itemProp="name">
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Automatyczne
              </span>
              <br />
              raportowanie cen mieszkań na dane.gov.pl
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed" itemProp="description">
              Spełnij wymogi <strong>ustawy z 21 maja 2025 roku</strong> o codziennym raportowaniu cen mieszkań. 
              <span className="font-semibold text-gray-900">Jeden upload miesięcznie</span> - system automatycznie generuje 
              pliki XML w formacie 1.13 i publikuje na <strong>portalu dane.gov.pl</strong>.
            </p>
            
            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-6 mb-10 text-sm text-gray-600">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                14 dni za darmo
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Bez zobowiązań
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Setup w 10 minut
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/auth/signup" className="group bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-indigo-800 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
                <span className="flex items-center justify-center">
                  Zacznij automatyzację już dziś
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </a>
              <a href="#demo" className="group border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl text-lg font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all">
                <span className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M12 5v.01M3 12a9 9 0 1018 0 9 9 0 00-18 0z" />
                  </svg>
                  Zobacz demo w 5 minut
                </span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section - AEO Optimized */}
      <section id="problem" className="py-20" aria-labelledby="problem-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 id="problem-heading" className="text-4xl font-bold text-gray-900 mb-6">
              Nowe wymagania ustawy z 21 maja 2025 - co musisz wiedzieć
            </h2>
            <div className="max-w-4xl mx-auto">
              <p className="text-xl text-gray-600 mb-8">
                <strong>Ustawa z 21 maja 2025 roku</strong> wprowadza konkretne obowiązki dla deweloperów. 
                Oto rzeczywiste wymagania ministerstwa:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mt-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Codzienna aktualizacja danych</h3>
                    <p className="text-gray-600">wymagana przez ministerstwo w specyfikacji XML v1.13</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mt-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Publikacja wyłącznie przez portal dane.gov.pl</h3>
                    <p className="text-gray-600">zgodnie z instrukcjami COI - nie ma innych opcji</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mt-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Format XML zgodny ze schematem 1.13</h3>
                    <p className="text-gray-600">z konkretnymi polami i strukturą określoną przez ministerstwo</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mt-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Strukturalne dane o każdej nieruchomości</h3>
                    <p className="text-gray-600">cena za m², powierzchnia, lokalizacja w formatach CSV, XML lub XLSX</p>
                  </div>
                </div>
              </div>
              <div className="mt-8 p-6 bg-red-50 rounded-lg" role="alert">
                <p className="text-lg font-semibold text-red-800">
                  <strong>Inne rozwiązania wymagają do 12,5 minuty na każdą aktualizację.</strong> Pomnóż to przez liczbę inwestycji i miesięcy - to setki straconych godzin rocznie dla każdego dewelopera.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section - AEO Enhanced */}
      <section id="solution" className="py-20 bg-blue-50" aria-labelledby="solution-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              OTORAPORT: Pełna automatyzacja compliance z dane.gov.pl
            </h2>
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
              Jedyne rozwiązanie, które w pełni automatyzuje wymagania ministerstwa:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
              <div className="bg-white p-6 rounded-lg shadow-sm hover-lift card-gentle-hover">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold">✓</span>
                  </div>
                  <h3 className="ml-3 font-semibold text-gray-900">Automatyczna publikacja na dane.gov.pl</h3>
                </div>
                <p className="text-gray-600">bezpośrednia integracja z portalem ministerstwa zgodnie z API</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm hover-lift card-gentle-hover">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold">✓</span>
                  </div>
                  <h3 className="ml-3 font-semibold text-gray-900">XML format 1.13 zgodny z COI</h3>
                </div>
                <p className="text-gray-600">generujemy dokładnie według najnowszych specyfikacji ministerstwa</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm hover-lift card-gentle-hover">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold">✓</span>
                  </div>
                  <h3 className="ml-3 font-semibold text-gray-900">Codzienna automatyzacja</h3>
                </div>
                <p className="text-gray-600">spełniamy wymóg "daily" update bez Twojego udziału</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm hover-lift card-gentle-hover">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold">✓</span>
                  </div>
                  <h3 className="ml-3 font-semibold text-gray-900">Onboarding poniżej 10 minut</h3>
                </div>
                <p className="text-gray-600">szybciej niż konkurencja o 25%</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm hover-lift card-gentle-hover">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold">✓</span>
                  </div>
                  <h3 className="ml-3 font-semibold text-gray-900">Wsparcie CSV, XML i Excel</h3>
                </div>
                <p className="text-gray-600">przyjmujemy dane w dowolnym formacie</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm hover-lift card-gentle-hover">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold">✓</span>
                  </div>
                  <h3 className="ml-3 font-semibold text-gray-900">Zero ręcznej pracy</h3>
                </div>
                <p className="text-gray-600">po pierwszej konfiguracji wszystko dzieje się automatycznie</p>
              </div>
            </div>
            <div className="mt-12 p-8 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-800 mb-4">Rezultat?</p>
              <p className="text-lg text-green-700">
                Pełna zgodność z prawem przy minimalnym nakładzie pracy. Więcej czasu na sprzedaż, zero stresu o compliance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Professional Design */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Dlaczego deweloperzy wybierają OTORAPORT?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Nie jesteśmy kolejnym narzędziem - jesteśmy kompletnym rozwiązaniem compliance.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            {/* Feature 1 - Speed */}
            <div className="group relative bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Najszybszy onboarding na rynku</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Mniej niż 10 minut od rejestracji do pierwszego raportu. Konkurencja potrzebuje godzin.
                </p>
                <div className="flex items-center text-sm font-semibold text-blue-600">
                  <span className="mr-2">25% szybciej niż konkurencja</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Feature 2 - Automation */}
            <div className="group relative bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="absolute inset-0 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Prawdziwa automatyzacja</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Zero ręcznej pracy po pierwszej konfiguracji. System sam aktualizuje raporty przy każdej zmianie cen.
                </p>
                <div className="flex items-center text-sm font-semibold text-green-600">
                  <span className="mr-2">100% automatyzacji procesów</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Feature 3 - Compliance */}
            <div className="group relative bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-50 to-violet-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Integracja z dane.gov.pl</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Jedyne rozwiązanie z bezpośrednią integracją z portalem dane.gov.pl. 
                  Automatyczne publikowanie w formacie XML 1.13 zgodnym z wymaganiami COI.
                </p>
                <div className="flex items-center text-sm font-semibold text-purple-600">
                  <span className="mr-2">Certyfikowana zgodność</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-blue-200 transition-colors">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Multi-format</h4>
              <p className="text-sm text-gray-600">CSV, XML, Excel - przyjmujemy wszystko</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-green-200 transition-colors">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">dane.gov.pl API</h4>
              <p className="text-sm text-gray-600">Automatyczna publikacja zgodna z COI</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-purple-200 transition-colors">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Bezpieczeństwo</h4>
              <p className="text-sm text-gray-600">Dane chronione zgodnie z RODO</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-orange-200 transition-colors">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Wsparcie 24/7</h4>
              <p className="text-sm text-gray-600">Pomoc techniczna gdy potrzebujesz</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section - Professional Design */}
      <PricingSection />

      {/* Demo Section - Professional Design */}
      <section id="demo" className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Zobacz jak to działa w praktyce
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Jeden upload, automatyczny compliance. Sprawdź jak OTORAPORT oszczędza Ci godziny pracy każdego dnia.
            </p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mx-auto max-w-5xl">
            {/* Browser Frame */}
            <div className="bg-gray-800 rounded-t-xl p-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
            </div>
            
            {/* Dashboard Content */}
            <div className="bg-white border-2 border-gray-200 rounded-b-xl overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-white">Dashboard - OTORAPORT</h3>
                    <p className="text-blue-100">Witaj ponownie, Jan Kowalski</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center text-white">
                      <div className="w-3 h-3 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                      <span className="text-sm">System aktywny</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="p-8 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Aktywne inwestycje</p>
                        <p className="text-3xl font-bold text-gray-900">3</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Mieszkania w sprzedaży</p>
                        <p className="text-3xl font-bold text-gray-900">847</p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Ostatnia aktualizacja</p>
                        <p className="text-3xl font-bold text-gray-900">2h</p>
                        <p className="text-xs text-gray-500">temu</p>
                      </div>
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Status compliance</p>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                          <p className="text-lg font-bold text-green-600">OK</p>
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* File Upload Area */}
                  <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                      <h4 className="text-xl font-semibold text-gray-900 mb-4">Aktualizacja cen</h4>
                      <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center bg-blue-50 hover:bg-blue-100 transition-colors">
                        <svg className="w-12 h-12 text-blue-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                        </svg>
                        <p className="text-lg font-semibold text-gray-900 mb-2">Przeciągnij plik lub kliknij aby wybrać</p>
                        <p className="text-gray-600">CSV, XML, Excel - wszystkie formaty obsługiwane</p>
                        <button className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                          Wybierz plik
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Quick Links */}
                  <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Linki dla ministerstwa</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-600">XML Report</span>
                          <button className="text-blue-600 hover:text-blue-700 font-semibold text-sm">
                            Kopiuj link
                          </button>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-600">Markdown Report</span>
                          <button className="text-blue-600 hover:text-blue-700 font-semibold text-sm">
                            Kopiuj link
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Ostatnie aktywności</h4>
                      <div className="space-y-3">
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                          <div>
                            <p className="text-sm text-gray-900 font-medium">Plik zaktualizowany</p>
                            <p className="text-xs text-gray-500">2 godziny temu</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          <div>
                            <p className="text-sm text-gray-900 font-medium">Raport wygenerowany</p>
                            <p className="text-xs text-gray-500">2 godziny temu</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                          <div>
                            <p className="text-sm text-gray-900 font-medium">Email wysłany</p>
                            <p className="text-xs text-gray-500">3 godziny temu</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Demo Steps */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Wgraj plik z cenami</h3>
              <p className="text-gray-600">CSV, XML lub Excel - system rozpozna format automatycznie</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">System generuje raporty</h3>
              <p className="text-gray-600">Automatycznie tworzy pliki XML i Markdown zgodne z ustawą</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-violet-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Ministerstwo ma dostęp 24/7</h3>
              <p className="text-gray-600">Stałe linki zapewniają ciągły dostęp do aktualnych danych</p>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-16">
            <a href="/auth/signup" className="inline-block bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-indigo-800 transition-all transform hover:scale-105">
              Wypróbuj za darmo - 14 dni
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta" className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Przestań marnować czas na biurokrację
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Każdy dzień zwłoki to kolejne godziny ręcznego przygotowywania raportów. Zautomatyzuj compliance już dziś i skup się na tym, co naprawdę przynosi zyski.
          </p>
          <a href="/auth/signup" className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition inline-block">
            Rozpocznij automatyzację - 14 dni gratis
          </a>
        </div>
      </section>

      {/* FAQ Section - AEO Optimized */}
      <section id="faq" className="py-20 bg-gray-50" aria-labelledby="faq-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 id="faq-heading" className="text-4xl font-bold text-gray-900 mb-6">
              Najczęściej zadawane pytania
            </h2>
            <p className="text-xl text-gray-600">
              Odpowiedzi na najważniejsze pytania o automatyzację raportowania cen mieszkań
            </p>
          </div>

          <div className="space-y-8">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 hover:shadow-lg transition-shadow duration-300" itemScope itemType="https://schema.org/Question">
              <h3 className="text-xl font-semibold text-gray-900 mb-4" itemProp="name">
                Jakie są dokładne wymagania ustawy z 21 maja 2025 roku?
              </h3>
              <div itemScope itemType="https://schema.org/Answer" itemProp="acceptedAnswer">
                <p className="text-gray-600 leading-relaxed" itemProp="text">
                  Ustawa wymaga <strong>codziennej aktualizacji</strong> danych 
                  publikowanych w formacie <strong>XML zgodnym ze schematem 1.13</strong> na portalu 
                  <strong>dane.gov.pl</strong>. Dane muszą zawierać strukturalne informacje o każdej nieruchomości 
                  w sprzedaży, w tym cenę za m², powierzchnię i lokalizację.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 hover:shadow-lg transition-shadow duration-300" itemScope itemType="https://schema.org/Question">
              <h3 className="text-xl font-semibold text-gray-900 mb-4" itemProp="name">
                Czy naprawdę muszę publikować dane codziennie?
              </h3>
              <div itemScope itemType="https://schema.org/Answer" itemProp="acceptedAnswer">
                <p className="text-gray-600 leading-relaxed" itemProp="text">
                  Tak - według oficjalnej instrukcji COI dane muszą być aktualizowane <strong>codziennie</strong>. 
                  To nie oznacza, że musisz ręcznie aktualizować co dzień, ale system musi być skonfigurowany 
                  do codziennej publikacji. OTORAPORT automatycznie spełnia ten wymóg.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 hover:shadow-lg transition-shadow duration-300" itemScope itemType="https://schema.org/Question">
              <h3 className="text-xl font-semibold text-gray-900 mb-4" itemProp="name">
                Jak OTORAPORT integruje się z portalem dane.gov.pl?
              </h3>
              <div itemScope itemType="https://schema.org/Answer" itemProp="acceptedAnswer">
                <p className="text-gray-600 leading-relaxed" itemProp="text">
                  OTORAPORT korzysta z oficjalnego API dane.gov.pl do automatycznego publikowania danych w formacie 
                  <strong>XML 1.13 zgodnym z instrukcjami COI</strong>. Po pierwszej konfiguracji system automatycznie 
                  generuje pliki XML z Twoich danych i publikuje je na portalu ministerstwa zgodnie z wymaganiami prawnymi.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 hover:shadow-lg transition-shadow duration-300" itemScope itemType="https://schema.org/Question">
              <h3 className="text-xl font-semibold text-gray-900 mb-4" itemProp="name">
                Ile kosztuje OTORAPORT i czy warto?
              </h3>
              <div itemScope itemType="https://schema.org/Answer" itemProp="acceptedAnswer">
                <p className="text-gray-600 leading-relaxed" itemProp="text">
                  Plan Basic kosztuje <strong>149 zł/miesiąc</strong>, Pro <strong>249 zł/miesiąc</strong>, Enterprise <strong>399 zł/miesiąc</strong>. 
                  Przy wymaganiu codziennego raportowania i skomplikowanych formatach XML, OTORAPORT 
                  oszczędza <strong>setki godzin pracy rocznie</strong> na każdego dewelopera.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-6">Nie znalazłeś odpowiedzi na swoje pytanie?</p>
            <a href="/contact" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
              Skontaktuj się z nami
            </a>
          </div>
        </div>
      </section>

      {/* Footer - Enhanced */}
      <footer className="py-16 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-white">OTORAPORT</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Automatyzacja raportowania cen mieszkań zgodnie z wymogami ustawy. Proste, szybkie, niezawodne.
              </p>
            </div>

            {/* Product */}
            <div>
              <h3 className="text-white font-semibold mb-4">Produkt</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="text-gray-400 hover:text-white transition-colors">Funkcje</a></li>
                <li><a href="#pricing" className="text-gray-400 hover:text-white transition-colors">Cennik</a></li>
                <li><a href="#demo" className="text-gray-400 hover:text-white transition-colors">Demo</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">API</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-white font-semibold mb-4">Wsparcie</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Centrum pomocy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Kontakt</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Status systemu</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Dokumentacja</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-white font-semibold mb-4">Prawne</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Polityka prywatności</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Regulamin</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">RODO</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Cookies</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="pt-8 border-t border-gray-800">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-gray-400 text-sm mb-4 md:mb-0">
                &copy; 2025 OTORAPORT. Wszystkie prawa zastrzeżone.
              </div>
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-1 text-gray-400 text-sm">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>System dostępny</span>
                </div>
                <div className="text-gray-400 text-sm">
                  Made with ❤️ in Poland
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
      
      <ScrollToTop />
    </main>
    </>
  )
}