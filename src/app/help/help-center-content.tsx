'use client';

import { useState } from 'react';
import { BookOpen, Rocket, CheckCircle } from 'lucide-react';
import { HelpSearch } from '@/components/help/help-search';
import { HelpSidebar } from '@/components/help/help-sidebar';
import { FAQAccordion, FAQCategoryFilter } from '@/components/help/faq-accordion';
import { VideoTutorialsGrid } from '@/components/help/video-tutorial-card';
import { APIDocsSection } from '@/components/help/api-docs-section';
import { TroubleshootingSection } from '@/components/help/troubleshooting-section';
import { ContactForm } from '@/components/help/contact-form';
import { VIDEO_TUTORIALS, GETTING_STARTED_STEPS } from '@/lib/help-content';
import { Button } from '@/components/ui/button';

export function HelpCenterContent() {
  const [selectedFAQCategory, setSelectedFAQCategory] = useState<string | null>(null);

  // In a real app, you'd get this from user session
  const userPlan: 'free' | 'pro' | 'enterprise' = 'pro';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Centrum Pomocy OTORAPORT
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Znajdź odpowiedzi na swoje pytania lub skontaktuj się z naszym zespołem wsparcia
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <HelpSearch />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <HelpSidebar />

          {/* Main Content Area */}
          <main className="flex-1 space-y-16">
            {/* Getting Started Section */}
            <section id="getting-started" className="scroll-mt-20">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Rocket className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Wprowadzenie</h2>
                  <p className="text-gray-600">Jak zacząć z OTORAPORT w 5 krokach</p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
                <p className="text-gray-700 mb-6">
                  Witaj w OTORAPORT! Ten przewodnik pomoże Ci szybko rozpocząć automatyzację
                  raportowania do Ministerstwa Rozwoju. Wykonaj poniższe kroki, aby w pełni
                  wykorzystać możliwości systemu.
                </p>

                <div className="space-y-4">
                  {GETTING_STARTED_STEPS.map((step) => (
                    <div
                      key={step.number}
                      className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                        {step.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {step.number}. {step.title}
                        </h3>
                        <p className="text-gray-600">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Gotowy do startu?</span>
                    </div>
                    <Button onClick={() => (window.location.href = '/dashboard')}>
                      Przejdź do Dashboardu
                    </Button>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <a
                  href="#faq-prepare-csv"
                  className="block p-4 bg-white rounded-lg border hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Przygotowanie pliku CSV
                  </h4>
                  <p className="text-sm text-gray-600">
                    Dowiedz się jak poprawnie sformatować dane
                  </p>
                </a>
                <a
                  href="#faq-find-endpoints"
                  className="block p-4 bg-white rounded-lg border hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <h4 className="font-semibold text-gray-900 mb-1">Konfiguracja endpointów</h4>
                  <p className="text-sm text-gray-600">
                    Znajdź i przetestuj swoje URL endpointów
                  </p>
                </a>
                <a
                  href="#faq-report-to-ministry"
                  className="block p-4 bg-white rounded-lg border hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <h4 className="font-semibold text-gray-900 mb-1">Zgłoszenie do Ministerstwa</h4>
                  <p className="text-sm text-gray-600">
                    Instrukcja zgłaszania na dane.gov.pl
                  </p>
                </a>
              </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="scroll-mt-20">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Najczęstsze pytania</h2>
                  <p className="text-gray-600">Odpowiedzi na pytania użytkowników OTORAPORT</p>
                </div>
              </div>

              <FAQCategoryFilter
                selectedCategory={selectedFAQCategory}
                onCategoryChange={setSelectedFAQCategory}
              />

              <FAQAccordion category={selectedFAQCategory || undefined} />
            </section>

            {/* Video Tutorials Section */}
            <section id="tutorials" className="scroll-mt-20">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Tutoriale wideo</h2>
                  <p className="text-gray-600">Naucz się korzystać z OTORAPORT krok po kroku</p>
                </div>
              </div>

              <VideoTutorialsGrid tutorials={VIDEO_TUTORIALS} userPlan={userPlan} />

              <div className="mt-6 p-6 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg border border-amber-200">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Potrzebujesz tutoriala na konkretny temat?
                </h3>
                <p className="text-sm text-gray-700 mb-4">
                  Daj nam znać, a stworzymy dedykowany przewodnik wideo odpowiadający na Twoje
                  potrzeby.
                </p>
                <Button variant="outline" size="sm" onClick={() => (window.location.href = '#contact')}>
                  Zaproponuj temat
                </Button>
              </div>
            </section>

            {/* API Documentation Section */}
            <section id="api-docs" className="scroll-mt-20">
              <APIDocsSection userPlan={userPlan} />
            </section>

            {/* Troubleshooting Section */}
            <section id="troubleshooting" className="scroll-mt-20">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Rozwiązywanie problemów</h2>
                  <p className="text-gray-600">Najczęstsze problemy i ich rozwiązania</p>
                </div>
              </div>

              <TroubleshootingSection />
            </section>

            {/* Contact Section */}
            <section id="contact" className="scroll-mt-20">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Skontaktuj się z nami</h2>
                  <p className="text-gray-600">Jesteśmy tu, aby pomóc</p>
                </div>
              </div>

              <ContactForm />
            </section>
          </main>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h2 className="text-2xl font-bold mb-3">Nie znalazłeś odpowiedzi?</h2>
          <p className="text-blue-100 mb-6">
            Nasz zespół wsparcia jest zawsze gotowy, aby pomóc. Skontaktuj się z nami, a
            odpowiemy najszybciej jak to możliwe.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => (window.location.href = '#contact')}
            >
              Skontaktuj się z supportem
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => (window.location.href = '/dashboard')}
              className="border-white text-white hover:bg-white/10"
            >
              Wróć do Dashboardu
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
