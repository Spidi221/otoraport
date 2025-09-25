import { Metadata } from 'next'
import ScrollToTop from '@/components/ScrollToTop'

export const metadata: Metadata = {
  title: 'Klauzule RODO - OTORAPORT',
  description: 'Szczegółowe klauzule informacyjne RODO dla wszystkich procesów przetwarzania danych osobowych w platformie OTORAPORT. Pełne informacje o ochronie danych.',
  robots: 'index, follow',
  alternates: {
    canonical: 'https://otoraport.pl/rodo',
  },
}

export default function RodoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Klauzule Informacyjne RODO
          </h1>
          
          <div className="prose prose-gray max-w-none">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <p className="text-blue-800 font-medium mb-2">📋 Szczegółowe Klauzule RODO</p>
              <p className="text-blue-700 text-sm">
                Kompleksowe klauzule informacyjne dla wszystkich procesów przetwarzania danych osobowych zgodnie z RODO.
                Ostatnia aktualizacja: 11 września 2025.
              </p>
            </div>

            {/* Administrator danych */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Administrator Danych</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p><strong>OTORAPORT Sp. z o.o.</strong></p>
                <p>ul. Technologiczna 15, 00-001 Warszawa</p>
                <p>NIP: 1234567890 | REGON: 123456789 | KRS: 0000123456</p>
                <p>Email: kontakt@cenysync.pl</p>
                <p>Telefon: +48 22 123 45 67</p>
              </div>
            </section>

            {/* IOD */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Inspektor Ochrony Danych</h2>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="font-medium text-green-800">📧 Email: dpo@cenysync.pl</p>
                <p className="text-green-700">☎️ Telefon: +48 22 123 45 67</p>
                <p className="text-green-600 text-sm mt-2">
                  Czas odpowiedzi: do 30 dni roboczych od otrzymania zapytania
                </p>
              </div>
            </section>

            {/* Klauzule procesowe */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Klauzule dla Procesów</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* Rejestracja */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-800 mb-2">👤 Rejestracja w Serwisie</h3>
                  <div className="text-blue-700 text-sm space-y-2">
                    <p><strong>Dane:</strong> Imię, nazwisko, email, telefon, dane firmy</p>
                    <p><strong>Cel:</strong> Świadczenie usług platformy</p>
                    <p><strong>Podstawa:</strong> Art. 6 ust. 1 lit. b) RODO</p>
                    <p><strong>Czas:</strong> Okres umowy + 6 lat</p>
                  </div>
                </div>

                {/* Kontakt */}
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <h3 className="font-semibold text-purple-800 mb-2">📞 Formularz Kontaktowy</h3>
                  <div className="text-purple-700 text-sm space-y-2">
                    <p><strong>Dane:</strong> Imię, nazwisko, email, treść zapytania</p>
                    <p><strong>Cel:</strong> Obsługa zapytania, wsparcie</p>
                    <p><strong>Podstawa:</strong> Art. 6 ust. 1 lit. f) RODO</p>
                    <p><strong>Czas:</strong> 3 lata od ostatniego kontaktu</p>
                  </div>
                </div>

                {/* Newsletter */}
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <h3 className="font-semibold text-orange-800 mb-2">📧 Newsletter</h3>
                  <div className="text-orange-700 text-sm space-y-2">
                    <p><strong>Dane:</strong> Email, imię, preferencje</p>
                    <p><strong>Cel:</strong> Wysyłka informacji branżowych</p>
                    <p><strong>Podstawa:</strong> Art. 6 ust. 1 lit. a) RODO</p>
                    <p><strong>Czas:</strong> Do odwołania zgody</p>
                  </div>
                </div>

                {/* Cookies */}
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h3 className="font-semibold text-yellow-800 mb-2">🍪 Cookies</h3>
                  <div className="text-yellow-700 text-sm space-y-2">
                    <p><strong>Dane:</strong> ID sesji, preferencje, analityka</p>
                    <p><strong>Cel:</strong> Funkcjonowanie, personalizacja</p>
                    <p><strong>Podstawa:</strong> Art. 6 ust. 1 lit. a/f) RODO</p>
                    <p><strong>Czas:</strong> Zgodnie z polityką cookies</p>
                  </div>
                </div>

                {/* Płatności */}
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h3 className="font-semibold text-red-800 mb-2">💳 Płatności</h3>
                  <div className="text-red-700 text-sm space-y-2">
                    <p><strong>Dane:</strong> Dane do faktury, metoda płatności</p>
                    <p><strong>Cel:</strong> Rozliczenie subskrypcji</p>
                    <p><strong>Podstawa:</strong> Art. 6 ust. 1 lit. b/c) RODO</p>
                    <p><strong>Czas:</strong> 6 lat (przepisy rachunkowe)</p>
                  </div>
                </div>

                {/* Bezpieczeństwo */}
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                  <h3 className="font-semibold text-indigo-800 mb-2">🛡️ Monitoring</h3>
                  <div className="text-indigo-700 text-sm space-y-2">
                    <p><strong>Dane:</strong> Logi dostępu, IP, anomalie</p>
                    <p><strong>Cel:</strong> Bezpieczeństwo systemu</p>
                    <p><strong>Podstawa:</strong> Art. 6 ust. 1 lit. f) RODO</p>
                    <p><strong>Czas:</strong> 12 miesięcy (logi)</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Prawa RODO */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Twoje Prawa RODO</h2>
              <div className="grid md:grid-cols-2 gap-6">
                
                {/* Prawa podstawowe */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Prawa Podstawowe</h3>
                  
                  <div className="border-l-4 border-blue-500 pl-4 bg-blue-50 p-3 rounded-r">
                    <h4 className="font-semibold text-blue-800">📋 Prawo dostępu (art. 15)</h4>
                    <p className="text-blue-700 text-sm">
                      Możesz uzyskać kopię swoich danych i informację o przetwarzaniu
                    </p>
                  </div>

                  <div className="border-l-4 border-green-500 pl-4 bg-green-50 p-3 rounded-r">
                    <h4 className="font-semibold text-green-800">✏️ Prawo sprostowania (art. 16)</h4>
                    <p className="text-green-700 text-sm">
                      Możesz poprawić nieprawidłowe lub nieaktualne dane
                    </p>
                  </div>

                  <div className="border-l-4 border-red-500 pl-4 bg-red-50 p-3 rounded-r">
                    <h4 className="font-semibold text-red-800">🗑️ Prawo do usunięcia (art. 17)</h4>
                    <p className="text-red-700 text-sm">
                      Możesz żądać usunięcia danych w określonych przypadkach
                    </p>
                  </div>

                  <div className="border-l-4 border-yellow-500 pl-4 bg-yellow-50 p-3 rounded-r">
                    <h4 className="font-semibold text-yellow-800">⏸️ Prawo ograniczenia (art. 18)</h4>
                    <p className="text-yellow-700 text-sm">
                      Możesz ograniczyć przetwarzanie w szczególnych sytuacjach
                    </p>
                  </div>
                </div>

                {/* Prawa dodatkowe */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Prawa Dodatkowe</h3>
                  
                  <div className="border-l-4 border-purple-500 pl-4 bg-purple-50 p-3 rounded-r">
                    <h4 className="font-semibold text-purple-800">📦 Prawo przenoszenia (art. 20)</h4>
                    <p className="text-purple-700 text-sm">
                      Możesz otrzymać dane w formacie JSON, CSV lub PDF
                    </p>
                  </div>

                  <div className="border-l-4 border-orange-500 pl-4 bg-orange-50 p-3 rounded-r">
                    <h4 className="font-semibold text-orange-800">🚫 Prawo sprzeciwu (art. 21)</h4>
                    <p className="text-orange-700 text-sm">
                      Możesz sprzeciwić się przetwarzaniu, zwłaszcza marketingowi
                    </p>
                  </div>

                  <div className="border-l-4 border-teal-500 pl-4 bg-teal-50 p-3 rounded-r">
                    <h4 className="font-semibold text-teal-800">🔄 Wycofanie zgody</h4>
                    <p className="text-teal-700 text-sm">
                      Możesz cofnąć zgodę w każdym czasie (jeśli była podstawą)
                    </p>
                  </div>

                  <div className="border-l-4 border-gray-500 pl-4 bg-gray-50 p-3 rounded-r">
                    <h4 className="font-semibold text-gray-800">⚖️ Prawo do skargi</h4>
                    <p className="text-gray-700 text-sm">
                      Możesz złożyć skargę do UODO (Urząd Ochrony Danych Osobowych)
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Transfer danych */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Transfer Danych poza UE</h2>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-orange-800 mb-2">🌍 Dostawcy USA</h3>
                    <ul className="text-orange-700 text-sm space-y-1">
                      <li>• <strong>Vercel:</strong> hosting aplikacji</li>
                      <li>• <strong>Google:</strong> analityka i reklamy</li>
                      <li>• <strong>Resend:</strong> wysyłka emaili</li>
                      <li>• <strong>Mailchimp:</strong> newsletter</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-orange-800 mb-2">🔒 Zabezpieczenia</h3>
                    <ul className="text-orange-700 text-sm space-y-1">
                      <li>• Standard Contractual Clauses (SCC)</li>
                      <li>• Dodatkowe środki bezpieczeństwa</li>
                      <li>• Monitorowanie zgodności</li>
                      <li>• Prawo do sprzeciwu wobec transferu</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-orange-100 rounded">
                  <p className="text-orange-800 text-sm">
                    <strong>Twoje prawo:</strong> Możesz sprzeciwić się transferowi danych do USA kontaktując się z IOD.
                  </p>
                </div>
              </div>
            </section>

            {/* Bezpieczeństwo */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Bezpieczeństwo Danych</h2>
              <div className="grid md:grid-cols-3 gap-4">
                
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h3 className="font-semibold text-red-800 mb-2">🔐 Techniczne</h3>
                  <ul className="text-red-700 text-sm space-y-1">
                    <li>• Szyfrowanie HTTPS/TLS</li>
                    <li>• AES-256 dla danych</li>
                    <li>• Kontrola dostępu</li>
                    <li>• Tokenizacja płatności</li>
                  </ul>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-800 mb-2">🏢 Organizacyjne</h3>
                  <ul className="text-blue-700 text-sm space-y-1">
                    <li>• Szkolenia pracowników</li>
                    <li>• Procedury bezpieczeństwa</li>
                    <li>• Audyty zgodności</li>
                    <li>• Plany reagowania</li>
                  </ul>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-green-800 mb-2">📊 Monitoring</h3>
                  <ul className="text-green-700 text-sm space-y-1">
                    <li>• Monitoring 24/7</li>
                    <li>• Kopie zapasowe</li>
                    <li>• Wykrywanie anomalii</li>
                    <li>• Logi bezpieczeństwa</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Kontakt w sprawach RODO */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Jak Skorzystać z Praw</h2>
              <div className="grid md:grid-cols-2 gap-6">
                
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-800 mb-3">📞 Kanały Kontaktu</h3>
                  <div className="text-blue-700 text-sm space-y-2">
                    <p><strong>Email (priorytet):</strong> dpo@cenysync.pl</p>
                    <p><strong>Telefon:</strong> +48 22 123 45 67 (pon-pt 9-17)</p>
                    <p><strong>Formularz:</strong> cenysync.pl/kontakt-dpo</p>
                    <p><strong>Poczta:</strong> ul. Technologiczna 15, 00-001 Warszawa</p>
                  </div>
                </div>

                <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-green-800 mb-3">⏱️ Czas Odpowiedzi</h3>
                  <div className="text-green-700 text-sm space-y-2">
                    <p><strong>Standardowo:</strong> do 30 dni</p>
                    <p><strong>Skomplikowane:</strong> do 60 dni (z powiadomieniem)</p>
                    <p><strong>Pilne (naruszenia):</strong> 72 godziny</p>
                    <p><strong>Informacja:</strong> Natychmiastowa potwierdzenie</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Wzory wniosków */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Wzory Wniosków RODO</h2>
              <div className="space-y-6">
                
                {/* Dostęp do danych */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-3">📋 Wniosek o dostęp do danych (art. 15)</h3>
                  <div className="bg-white p-4 rounded border text-sm font-mono">
                    <p className="mb-2"><strong>DO:</strong> dpo@cenysync.pl</p>
                    <p className="mb-2"><strong>TEMAT:</strong> Wniosek o dostęp do danych - art. 15 RODO</p>
                    <p className="mb-4">Na podstawie art. 15 RODO wnoszę o:</p>
                    <p className="mb-2">1. Potwierdzenie przetwarzania moich danych</p>
                    <p className="mb-2">2. Udostępnienie kopii moich danych</p>
                    <p className="mb-2">3. Informację o celach i podstawach prawnych</p>
                    <p className="mb-4">4. Informację o okresie przechowywania</p>
                    <p className="mb-2">Dane identyfikujące:</p>
                    <p className="mb-1">- Email: [TWÓJ EMAIL]</p>
                    <p className="mb-1">- Imię i nazwisko: [TWOJE DANE]</p>
                  </div>
                </div>

                {/* Usunięcie danych */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-3">🗑️ Wniosek o usunięcie danych (art. 17)</h3>
                  <div className="bg-white p-4 rounded border text-sm font-mono">
                    <p className="mb-2"><strong>DO:</strong> dpo@cenysync.pl</p>
                    <p className="mb-2"><strong>TEMAT:</strong> Wniosek o usunięcie danych - art. 17 RODO</p>
                    <p className="mb-4">Na podstawie art. 17 RODO wnoszę o usunięcie moich danych.</p>
                    <p className="mb-2">Podstawa wniosku:</p>
                    <p className="mb-1">☐ Dane nie są już niezbędne</p>
                    <p className="mb-1">☐ Cofam zgodę na przetwarzanie</p>
                    <p className="mb-1">☐ Sprzeciw wobec przetwarzania</p>
                    <p className="mb-1">☐ Inne: [OPISZ]</p>
                  </div>
                </div>
              </div>
            </section>

            {/* UODO */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">9. Urząd Ochrony Danych Osobowych</h2>
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-red-800 mb-2">📍 Kontakt UODO</h3>
                    <div className="text-red-700 text-sm space-y-1">
                      <p><strong>Adres:</strong> ul. Stawki 2, 00-193 Warszawa</p>
                      <p><strong>Email:</strong> kancelaria@uodo.gov.pl</p>
                      <p><strong>Telefon:</strong> +48 22 531 03 00</p>
                      <p><strong>Infolinia:</strong> +48 606 950 000</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-red-800 mb-2">⚖️ Prawo do skargi</h3>
                    <div className="text-red-700 text-sm space-y-1">
                      <p>Możesz złożyć skargę jeśli uważasz, że przetwarzanie Twoich danych narusza RODO.</p>
                      <p><strong>Online:</strong> uodo.gov.pl</p>
                      <p><strong>Formularz:</strong> dostępny na stronie UODO</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg text-center">
              <h3 className="text-xl font-semibold mb-2">Masz pytania o swoje prawa RODO?</h3>
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
                Klauzule RODO zaktualizowane: 11 września 2025 | Wersja: 1.0 | 
                <a href="/privacy" className="text-blue-600 hover:underline ml-1">Polityka Prywatności</a> | 
                <a href="/terms" className="text-blue-600 hover:underline ml-1">Regulamin</a> | 
                <a href="/cookies" className="text-blue-600 hover:underline ml-1">Cookies</a>
              </p>
            </div>
          </div>
        </div>
      </div>
      <ScrollToTop />
    </div>
  )
}