import { Metadata } from 'next'
import ScrollToTop from '@/components/ScrollToTop'

export const metadata: Metadata = {
  title: 'Polityka Prywatności - OTORAPORT',
  description: 'Polityka prywatności platformy OTORAPORT zgodna z RODO i polskim prawem ochrony danych osobowych dla deweloperów nieruchomości.',
  robots: 'index, follow',
  alternates: {
    canonical: 'https://otoraport.pl/privacy',
  },
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Polityka Prywatności
          </h1>
          
          <div className="prose prose-gray max-w-none">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <p className="text-blue-800 font-medium mb-2">🔒 Ochrona Danych Osobowych</p>
              <p className="text-blue-700 text-sm">
                Dokument zgodny z RODO, polskim prawem ochrony danych oraz specyfiką branży nieruchomości.
                Ostatnia aktualizacja: 11 września 2025.
              </p>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Administrator Danych</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p><strong>OTORAPORT Sp. z o.o.</strong></p>
                <p>ul. Technologiczna 15, 00-001 Warszawa</p>
                <p>NIP: 1234567890</p>
                <p>REGON: 123456789</p>
                <p>Email: kontakt@cenysync.pl</p>
                <p>Telefon: +48 22 123 45 67</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Kontakt z Inspektorem Ochrony Danych</h2>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="font-medium text-green-800">📧 Email IOD: dpo@cenysync.pl</p>
                <p className="text-green-700">☎️ Telefon: +48 22 123 45 67</p>
                <p className="text-green-600 text-sm mt-2">
                  Inspektor Ochrony Danych odpowiada na pytania w ciągu 30 dni roboczych.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Jakie Dane Zbieramy</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">Dane Firmy</h3>
                  <ul className="text-blue-700 text-sm space-y-1">
                    <li>• Nazwa firmy i NIP</li>
                    <li>• Email i telefon</li>
                    <li>• Adres siedziby</li>
                    <li>• Dane przedstawiciela</li>
                  </ul>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-800 mb-2">Dane Mieszkań</h3>
                  <ul className="text-purple-700 text-sm space-y-1">
                    <li>• Ceny i powierzchnie</li>
                    <li>• Lokalizacja inwestycji</li>
                    <li>• Status sprzedaży</li>
                    <li>• Parametry techniczne</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Cele Przetwarzania</h2>
              <div className="space-y-4">
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-semibold text-gray-800">🏛️ Compliance z Ministerstwem</h3>
                  <p className="text-gray-600">Automatyczne generowanie raportów XML/MD zgodnie z ustawą o cenach mieszkań</p>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Obowiązek prawny</span>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-semibold text-gray-800">💼 Świadczenie Usług SaaS</h3>
                  <p className="text-gray-600">Dashboard, upload danych, generowanie plików, wsparcie techniczne</p>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Wykonanie umowy</span>
                </div>
                <div className="border-l-4 border-purple-500 pl-4">
                  <h3 className="font-semibold text-gray-800">📧 Komunikacja</h3>
                  <p className="text-gray-600">Powiadomienia o aktualizacjach, wsparcie, newsletter branżowy</p>
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Uzasadniony interes</span>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Twoje Prawa RODO</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h3 className="font-semibold text-yellow-800 mb-2">Prawa Podstawowe</h3>
                  <ul className="text-yellow-700 text-sm space-y-1">
                    <li>✅ Prawo dostępu do danych</li>
                    <li>✏️ Prawo sprostowania</li>
                    <li>🗑️ Prawo do usunięcia</li>
                    <li>⏸️ Prawo ograniczenia</li>
                  </ul>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                  <h3 className="font-semibold text-indigo-800 mb-2">Prawa Dodatkowe</h3>
                  <ul className="text-indigo-700 text-sm space-y-1">
                    <li>📦 Prawo przenoszenia</li>
                    <li>🚫 Prawo sprzeciwu</li>
                    <li>⚖️ Skarga do UODO</li>
                    <li>🔄 Wycofanie zgody</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Bezpieczeństwo Danych</h2>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-800 mb-2">🛡️ Zabezpieczenia Techniczne</h3>
                <ul className="text-red-700 text-sm space-y-1">
                  <li>• <strong>Szyfrowanie HTTPS</strong> - wszystkie połączenia zabezpieczone</li>
                  <li>• <strong>Hosting EU</strong> - Supabase Frankfurt (zgodność RODO)</li>
                  <li>• <strong>Kopie zapasowe</strong> - automatyczne backup co 24h</li>
                  <li>• <strong>Monitoring</strong> - 24/7 nadzór nad bezpieczeństwem</li>
                  <li>• <strong>Kontrola dostępu</strong> - uwierzytelnianie dwuskładnikowe</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Transfer Danych do USA</h2>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-orange-800 font-medium mb-2">🌍 Dostawcy Amerykańscy</p>
                <p className="text-orange-700 text-sm mb-3">
                  Niektórzy dostawcy (Vercel, Google Analytics) mogą przetwarzać dane w USA na podstawie 
                  Standard Contractual Clauses i dodatkowych zabezpieczeń.
                </p>
                <div className="bg-orange-100 p-3 rounded">
                  <p className="text-orange-800 text-sm font-medium">🔒 Twoje Prawa:</p>
                  <p className="text-orange-700 text-sm">
                    Możesz sprzeciwić się transferowi do USA kontaktując się z nami na dpo@cenysync.pl
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Okres Przechowywania</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-gray-50 p-3 rounded">
                  <span className="font-medium">Dane konta aktywnego</span>
                  <span className="text-blue-600 font-medium">Przez okres świadczenia usług</span>
                </div>
                <div className="flex justify-between items-center bg-gray-50 p-3 rounded">
                  <span className="font-medium">Dane po zamknięciu konta</span>
                  <span className="text-green-600 font-medium">5 lat (obowiązki księgowe)</span>
                </div>
                <div className="flex justify-between items-center bg-gray-50 p-3 rounded">
                  <span className="font-medium">Logi bezpieczeństwa</span>
                  <span className="text-purple-600 font-medium">2 lata (cyberbezpieczeństwo)</span>
                </div>
                <div className="flex justify-between items-center bg-gray-50 p-3 rounded">
                  <span className="font-medium">Dane marketingowe</span>
                  <span className="text-orange-600 font-medium">Do wycofania zgody</span>
                </div>
              </div>
            </section>

            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg text-center">
              <h3 className="text-xl font-semibold mb-2">Masz pytania o ochronę danych?</h3>
              <p className="mb-4">Skontaktuj się z naszym Inspektorem Ochrony Danych</p>
              <a 
                href="mailto:dpo@cenysync.pl" 
                className="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                📧 dpo@cenysync.pl
              </a>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200 text-center">
              <p className="text-gray-500 text-sm">
                Dokument zaktualizowany: 11 września 2025 | 
                <a href="/terms" className="text-blue-600 hover:underline ml-1">Regulamin</a> | 
                <a href="/cookies" className="text-blue-600 hover:underline ml-1">Cookies</a> | 
                <a href="/rodo" className="text-blue-600 hover:underline ml-1">RODO</a>
              </p>
            </div>
          </div>
        </div>
      </div>
      <ScrollToTop />
    </div>
  )
}