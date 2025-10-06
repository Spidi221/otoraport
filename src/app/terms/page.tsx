import { LegalLayout } from '@/components/legal-layout'

export default function TermsPage() {
  return (
    <LegalLayout
      title="Regulamin Serwisu"
      lastUpdated="3 października 2025"
    >
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">I. POSTANOWIENIA OGÓLNE</h2>

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Definicje i zakres zastosowania</h3>
          <p className="text-gray-700 mb-4">
            Niniejszy Regulamin świadczenia usług drogą elektroniczną (dalej: <strong>Regulamin</strong>) określa zasady,
            warunki oraz zakres korzystania z platformy internetowej OTORAPORT (dalej: <strong>Serwis</strong>) dostępnej
            pod adresem <strong>otoraport.pl</strong> oraz <strong>www.otoraport.pl</strong>.
          </p>
          <p className="text-gray-700 mb-4">
            Regulamin został wydany na podstawie art. 8 ustawy z dnia 18 lipca 2002 r. o świadczeniu usług drogą
            elektroniczną (Dz.U. 2002 nr 144 poz. 1204 z późn. zm.) oraz określa zasady świadczenia usług
            elektronicznych przez Usługodawcę na rzecz Użytkowników.
          </p>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Dane Usługodawcy</h3>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-gray-700 mb-2">
              <strong>Usługodawcą</strong> i Administratorem Serwisu jest:
            </p>
            <ul className="list-none space-y-1 text-gray-700 ml-4">
              <li><strong>[NAZWA FIRMY]</strong> <span className="text-red-600">[DO UZUPEŁNIENIA]</span></li>
              <li>Forma prawna: <strong>[sp. z o.o. / S.A. / inne]</strong> <span className="text-red-600">[DO UZUPEŁNIENIA]</span></li>
              <li>Siedziba: <strong>[ADRES SIEDZIBY]</strong> <span className="text-red-600">[DO UZUPEŁNIENIA]</span></li>
              <li>NIP: <strong>[NIP]</strong> <span className="text-red-600">[DO UZUPEŁNIENIA]</span></li>
              <li>REGON: <strong>[REGON]</strong> <span className="text-red-600">[DO UZUPEŁNIENIA]</span></li>
              <li>KRS/CEiDG: <strong>[NUMER KRS lub CEiDG]</strong> <span className="text-red-600">[DO UZUPEŁNIENIA]</span></li>
              <li>Email kontaktowy: <strong>kontakt@otoraport.pl</strong></li>
              <li>Telefon: <strong>[NUMER TELEFONU]</strong> <span className="text-red-600">[DO UZUPEŁNIENIA]</span></li>
            </ul>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Akceptacja Regulaminu</h3>
          <p className="text-gray-700 mb-2">
            Rozpoczęcie korzystania z Serwisu, w tym założenie Konta Użytkownika, wymaga akceptacji niniejszego
            Regulaminu oraz Polityki Prywatności dostępnej pod adresem <strong>otoraport.pl/privacy</strong>.
          </p>
          <p className="text-gray-700">
            Akceptacja następuje poprzez oznaczenie odpowiedniego pola podczas procesu rejestracji. Brak akceptacji
            Regulaminu uniemożliwia korzystanie z Serwisu.
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">II. DEFINICJE</h2>
        <p className="text-gray-700 mb-4">
          Pojęcia użyte w Regulaminie oznaczają:
        </p>
        <ul className="list-none space-y-3 text-gray-700">
          <li>
            <strong>1. Serwis</strong> - platforma internetowa OTORAPORT dostępna pod adresem otoraport.pl,
            umożliwiająca automatyzację raportowania danych o nieruchomościach do organów administracji publicznej.
          </li>
          <li>
            <strong>2. Usługodawca</strong> - podmiot wskazany w pkt I.2 Regulaminu, świadczący usługi drogą
            elektroniczną za pośrednictwem Serwisu.
          </li>
          <li>
            <strong>3. Użytkownik</strong> - osoba fizyczna prowadząca działalność gospodarczą, osoba prawna lub
            jednostka organizacyjna nieposiadająca osobowości prawnej, której odrębna ustawa przyznaje zdolność prawną,
            korzystająca z Serwisu po założeniu Konta.
          </li>
          <li>
            <strong>4. Konto</strong> - zbiór zasobów i ustawień utworzonych dla Użytkownika w Serwisie, dostępnych
            po prawidłowym uwierzytelnieniu.
          </li>
          <li>
            <strong>5. Usługa</strong> - usługa świadczona drogą elektroniczną przez Usługodawcę na rzecz Użytkownika,
            polegająca na:
            <ul className="list-disc ml-8 mt-2 space-y-1">
              <li>przetwarzaniu plików CSV/Excel zawierających dane o nieruchomościach,</li>
              <li>automatycznym generowaniu raportów XML zgodnych ze schematem 1.13 określonym przez
                Ministerstwo Rozwoju i Technologii,</li>
              <li>generowaniu raportów CSV oraz sum kontrolnych MD5,</li>
              <li>udostępnianiu publicznych endpointów dla organów administracji (dane.gov.pl).</li>
            </ul>
          </li>
          <li>
            <strong>6. Subskrypcja</strong> - odpłatna usługa dostępu do funkcjonalności Serwisu w ramach wybranego
            Planu Taryfowego, odnawiająca się automatycznie w cyklach miesięcznych.
          </li>
          <li>
            <strong>7. Plan Taryfowy</strong> - jeden z pakietów usług oferowanych przez Usługodawcę: Basic, Pro
            lub Enterprise, różniących się zakresem funkcjonalności i ceną.
          </li>
          <li>
            <strong>8. Okres Próbny</strong> - bezpłatny 14-dniowy okres testowania Serwisu, dostępny dla nowych
            Użytkowników, nie wymagający podania danych płatności.
          </li>
          <li>
            <strong>9. Treści</strong> - wszelkie dane, informacje, teksty, pliki wprowadzane lub przesyłane przez
            Użytkownika do Serwisu.
          </li>
          <li>
            <strong>10. RODO</strong> - Rozporządzenie Parlamentu Europejskiego i Rady (UE) 2016/679 z dnia 27 kwietnia
            2016 r. w sprawie ochrony osób fizycznych w związku z przetwarzaniem danych osobowych i w sprawie swobodnego
            przepływu takich danych oraz uchylenia dyrektywy 95/46/WE.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">III. WYMAGANIA TECHNICZNE</h2>

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Minimalne wymagania systemowe</h3>
          <p className="text-gray-700 mb-2">
            Korzystanie z Serwisu wymaga spełnienia następujących minimalnych wymagań technicznych:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
            <li>Dostęp do Internetu o przepustowości minimum 1 Mb/s,</li>
            <li>Przeglądarka internetowa: aktualna wersja Google Chrome, Mozilla Firefox, Safari, Microsoft Edge,</li>
            <li>Włączona obsługa JavaScript,</li>
            <li>Włączona obsługa plików cookies (przynajmniej cookies technicznych),</li>
            <li>Aktywne konto email,</li>
            <li>Rozdzielczość ekranu minimum 1280x720 pikseli (zalecana: 1920x1080).</li>
          </ul>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Obsługiwane formaty plików</h3>
          <p className="text-gray-700 mb-2">
            Serwis umożliwia przesyłanie plików w następujących formatach:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
            <li>CSV (Comma-Separated Values) - kodowanie UTF-8,</li>
            <li>XLSX (Microsoft Excel 2007 i nowsze).</li>
          </ul>
          <p className="text-gray-700 mt-2">
            Maksymalny rozmiar pojedynczego pliku: <strong>25 MB</strong>. Parser automatycznie wykrywa strukturę
            danych i mapuje kolumny zgodnie z wymaganiami ministerstwa.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Bezpieczeństwo połączenia</h3>
          <p className="text-gray-700">
            Serwis wykorzystuje protokół HTTPS (SSL/TLS) dla wszystkich połączeń. Użytkownik zobowiązany jest do
            korzystania z aktualnego oprogramowania antywirusowego oraz zabezpieczenia dostępu do swojego urządzenia.
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">IV. ZAKŁADANIE I ZARZĄDZANIE KONTEM</h2>

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Zasady rejestracji</h3>
          <p className="text-gray-700 mb-2">
            <strong>1.1.</strong> Zakładanie Konta w Serwisie jest dobrowolne, ale niezbędne do korzystania z Usług.
          </p>
          <p className="text-gray-700 mb-2">
            <strong>1.2.</strong> Użytkownikiem Serwisu może być wyłącznie:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700 ml-8">
            <li>osoba fizyczna prowadząca działalność gospodarczą (przedsiębiorca),</li>
            <li>osoba prawna (spółka, fundacja, stowarzyszenie),</li>
            <li>jednostka organizacyjna nieposiadająca osobowości prawnej.</li>
          </ul>
          <p className="text-gray-700 mt-2">
            <strong>1.3.</strong> Serwis nie jest przeznaczony dla konsumentów w rozumieniu art. 22(1) Kodeksu cywilnego.
            Wszystkie transakcje mają charakter B2B (business-to-business).
          </p>
          <p className="text-gray-700 mt-2">
            <strong>1.4.</strong> Rejestracja wymaga podania prawdziwych, aktualnych i kompletnych danych, w tym:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700 ml-8">
            <li>Adresu email (login),</li>
            <li>Hasła (minimum 8 znaków),</li>
            <li>Nazwy firmy / działalności gospodarczej,</li>
            <li>Numeru NIP,</li>
            <li>Danych kontaktowych (adres, telefon).</li>
          </ul>
          <p className="text-gray-700 mt-2">
            <strong>1.5.</strong> Użytkownik może zarejestrować się również poprzez Google OAuth. W takim przypadku
            wymagane jest uzupełnienie danych firmy w profilu.
          </p>
          <p className="text-gray-700 mt-2">
            <strong>1.6.</strong> Jedno Konto może być przypisane tylko do jednego podmiotu gospodarczego.
          </p>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Obowiązki Użytkownika</h3>
          <p className="text-gray-700 mb-2">
            <strong>2.1.</strong> Użytkownik zobowiązuje się do:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700 ml-8">
            <li>Podawania prawdziwych i aktualnych danych podczas rejestracji oraz ich bieżącej aktualizacji,</li>
            <li>Zachowania poufności danych logowania (email, hasło),</li>
            <li>Nieprzekazywania dostępu do Konta osobom trzecim,</li>
            <li>Korzystania z Serwisu zgodnie z jego przeznaczeniem, przepisami prawa oraz dobrymi obyczajami,</li>
            <li>Niezwłocznego powiadomienia Usługodawcy o naruszeniu bezpieczeństwa Konta (email: kontakt@otoraport.pl),</li>
            <li>Niedziałania na szkodę innych Użytkowników, Usługodawcy lub osób trzecich.</li>
          </ul>
          <p className="text-gray-700 mt-2">
            <strong>2.2.</strong> Zabronione jest:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700 ml-8">
            <li>Próby obejścia zabezpieczeń Serwisu,</li>
            <li>Wykorzystywanie automatycznych skryptów (botów) bez zgody Usługodawcy,</li>
            <li>Przesyłanie treści niezgodnych z prawem lub naruszających prawa osób trzecich,</li>
            <li>Ingerencja w działanie Serwisu lub jego infrastrukturę,</li>
            <li>Kopiowanie, modyfikowanie, dekompilowanie kodu źródłowego Serwisu.</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Usunięcie Konta</h3>
          <p className="text-gray-700 mb-2">
            <strong>3.1.</strong> Użytkownik ma prawo usunąć Konto w każdej chwili, wysyłając żądanie na adres
            kontakt@otoraport.pl. Usunięcie następuje w ciągu 14 dni roboczych.
          </p>
          <p className="text-gray-700 mb-2">
            <strong>3.2.</strong> Usunięcie Konta skutkuje:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700 ml-8">
            <li>Utratą dostępu do wszystkich danych przechowywanych w Serwisie,</li>
            <li>Anulowaniem aktywnej Subskrypcji (bez zwrotu proporcjonalnej opłaty za niewykorzystany okres),</li>
            <li>Usunięciem przesłanych plików i wygenerowanych raportów (po 30 dniach od usunięcia Konta).</li>
          </ul>
          <p className="text-gray-700 mt-2">
            <strong>3.3.</strong> Dane niezbędne do celów księgowych i podatkowych będą przechowywane przez okres
            wymagany przepisami prawa (zazwyczaj 5 lat).
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">V. ZASADY ŚWIADCZENIA USŁUG</h2>

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Zakres Usług</h3>
          <p className="text-gray-700 mb-2">
            <strong>1.1.</strong> Usługodawca świadczy następujące usługi drogą elektroniczną:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 ml-8">
            <li>
              <strong>Upload i parsing plików</strong> - automatyczne przetwarzanie plików CSV/Excel z danymi
              o nieruchomościach, inteligentne wykrywanie kolumn (58 pól zgodnych ze schematem ministerstwa 1.13).
            </li>
            <li>
              <strong>Generowanie raportów Harvester XML</strong> - tworzenie plików XML z metadanymi zgodnych
              z namespace urn:otwarte-dane:harvester:1.13.
            </li>
            <li>
              <strong>Generowanie raportów CSV</strong> - eksport danych w formacie CSV (58 kolumn) zgodnym
              z wymaganiami dane.gov.pl.
            </li>
            <li>
              <strong>Generowanie sum kontrolnych MD5</strong> - obliczanie hashów dla walidacji integralności danych.
            </li>
            <li>
              <strong>Publiczne endpointy ministerstwa</strong> - udostępnianie URL do raportów dla systemu
              dane.gov.pl (data.xml, data.csv, data.md5).
            </li>
            <li>
              <strong>Dashboard zarządzania</strong> - panel z listą nieruchomości, funkcjami filtrowania, sortowania,
              usuwania rekordów.
            </li>
          </ul>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Dostępność Serwisu</h3>
          <p className="text-gray-700 mb-2">
            <strong>2.1.</strong> Usługodawca dołoży starań, aby Serwis był dostępny 24 godziny na dobę, 7 dni w tygodniu.
            Przewidywana dostępność: 99.5% w skali miesiąca (SLA).
          </p>
          <p className="text-gray-700 mb-2">
            <strong>2.2.</strong> Usługodawca zastrzega sobie prawo do okresowych przerw technicznych w celu konserwacji,
            aktualizacji lub rozbudowy Serwisu. O planowanych przerwach Użytkownicy zostaną powiadomieni z wyprzedzeniem
            minimum 48 godzin (email).
          </p>
          <p className="text-gray-700 mb-2">
            <strong>2.3.</strong> Usługodawca nie ponosi odpowiedzialności za przerwy w dostępie do Serwisu wynikające z:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700 ml-8">
            <li>Awarii infrastruktury dostawców zewnętrznych (Vercel, Supabase, AWS),</li>
            <li>Działania siły wyższej (klęski żywiołowe, konflikty zbrojne, ataki cybernetyczne na dużą skalę),</li>
            <li>Problemów po stronie dostawcy Internetu Użytkownika,</li>
            <li>Nieprawidłowej konfiguracji urządzenia Użytkownika.</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Ograniczenia techniczne</h3>
          <p className="text-gray-700 mb-2">
            <strong>3.1.</strong> Rate limiting (ograniczenia częstotliwości zapytań):
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700 ml-8">
            <li>Endpointy ministerstwa (XML, CSV, MD5): 60 żądań/minutę,</li>
            <li>Upload plików: 10 przesłań/godzinę,</li>
            <li>API logowania: 5 prób/15 minut.</li>
          </ul>
          <p className="text-gray-700 mt-2">
            <strong>3.2.</strong> Maksymalny rozmiar przesyłanych plików: 25 MB (Plan Basic/Pro), 50 MB (Plan Enterprise).
          </p>
          <p className="text-gray-700 mt-2">
            <strong>3.3.</strong> Limity projektów:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700 ml-8">
            <li>Plan Basic: do 2 projektów,</li>
            <li>Plan Pro: do 10 projektów,</li>
            <li>Plan Enterprise: bez limitów.</li>
          </ul>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">VI. OKRES PRÓBNY</h2>

        <p className="text-gray-700 mb-2">
          <strong>1.</strong> Każdy nowy Użytkownik otrzymuje bezpłatny Okres Próbny trwający 14 dni kalendarzowych
          od momentu rejestracji Konta.
        </p>
        <p className="text-gray-700 mb-2">
          <strong>2.</strong> W Okresie Próbnym Użytkownik ma dostęp do pełnej funkcjonalności Planu Basic, bez
          konieczności podawania danych płatności.
        </p>
        <p className="text-gray-700 mb-2">
          <strong>3.</strong> Po upływie Okresu Próbnego Użytkownik może:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-8">
          <li>Wykupić odpłatną Subskrypcję (Basic, Pro lub Enterprise),</li>
          <li>Nie podejmować działań - Konto pozostanie aktywne, ale dostęp do Usług zostanie ograniczony
            (brak możliwości generowania nowych raportów, dane pozostają dostępne do odczytu przez 30 dni).</li>
        </ul>
        <p className="text-gray-700 mt-2">
          <strong>4.</strong> Okres Próbny przysługuje jeden raz dla danego podmiotu (NIP). Usługodawca zastrzega
          sobie prawo do odmowy przyznania Okresu Próbnego w uzasadnionych przypadkach (np. nadużycie, wcześniejsze
          naruszenie Regulaminu).
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">VII. PŁATNOŚCI I SUBSKRYPCJE</h2>

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Plany Taryfowe</h3>
          <p className="text-gray-700 mb-2">
            Usługodawca oferuje następujące Plany Taryfowe (ceny netto + 23% VAT):
          </p>

          <div className="ml-4 space-y-4 mt-4">
            <div className="border border-gray-300 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Plan Basic - 149 zł netto/miesiąc (183.27 zł brutto)</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                <li>Do 2 projektów deweloperskich,</li>
                <li>Upload plików CSV/Excel (max 25 MB),</li>
                <li>Automatyczne generowanie raportów ministerstwa (XML, CSV, MD5),</li>
                <li>Publiczne endpointy dla dane.gov.pl,</li>
                <li>Dashboard zarządzania nieruchomościami,</li>
                <li>Wsparcie email (czas odpowiedzi: do 48h).</li>
              </ul>
            </div>

            <div className="border border-gray-300 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Plan Pro - 249 zł netto/miesiąc (306.27 zł brutto)</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                <li>Do 10 projektów deweloperskich,</li>
                <li>Wszystkie funkcje Planu Basic,</li>
                <li>Strony prezentacyjne projektów (public property pages),</li>
                <li>Analytics dashboard (porównanie rynku, wykresy),</li>
                <li>Priorytetowe wsparcie email (czas odpowiedzi: do 24h).</li>
              </ul>
            </div>

            <div className="border border-gray-300 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Plan Enterprise - 399 zł netto/miesiąc (490.77 zł brutto)</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                <li>Bez limitu projektów,</li>
                <li>Wszystkie funkcje Planu Pro,</li>
                <li>Custom domains (własne domeny dla prezentacji),</li>
                <li>White-label branding (logo, kolory, baner),</li>
                <li>API access (REST endpoints dla integracji),</li>
                <li>Upload plików do 50 MB,</li>
                <li>Wsparcie priorytetowe + telefon (czas odpowiedzi: do 12h).</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Zasady płatności</h3>
          <p className="text-gray-700 mb-2">
            <strong>2.1.</strong> Płatności za Subskrypcję realizowane są wyłącznie za pośrednictwem operatora płatności
            <strong> Stripe</strong> (Stripe Payments Europe, Ltd., The One Building, 1 Grand Canal Street Lower, Dublin 2, Irlandia).
          </p>
          <p className="text-gray-700 mb-2">
            <strong>2.2.</strong> Użytkownik może dokonać płatności za pomocą:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700 ml-8">
            <li>Karty płatniczej (Visa, Mastercard, American Express),</li>
            <li>BLIK (dla kart wydanych w Polsce),</li>
            <li>Płatności SEPA (przelewy w strefie euro).</li>
          </ul>
          <p className="text-gray-700 mt-2">
            <strong>2.3.</strong> Subskrypcja odnawia się automatycznie w cyklach miesięcznych. Pierwsza opłata pobierana
            jest bezpośrednio po wyborze Planu Taryfowego (lub po upływie Okresu Próbnego, jeśli Plan został wybrany
            przed końcem trial).
          </p>
          <p className="text-gray-700 mt-2">
            <strong>2.4.</strong> Termin płatności: natychmiast (płatność z góry za okres rozliczeniowy).
          </p>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Faktury VAT</h3>
          <p className="text-gray-700 mb-2">
            <strong>3.1.</strong> Usługodawca wystawia faktury VAT elektroniczne, które wysyłane są na adres email
            Użytkownika w ciągu 7 dni od dokonania płatności.
          </p>
          <p className="text-gray-700 mb-2">
            <strong>3.2.</strong> Faktury dostępne są również w panelu Użytkownika w zakładce "Rozliczenia".
          </p>
          <p className="text-gray-700 mt-2">
            <strong>3.3.</strong> Dane na fakturze pobierane są z profilu Użytkownika (NIP, nazwa firmy, adres).
            Użytkownik zobowiązany jest do aktualizacji tych danych przed dokonaniem pierwszej płatności.
          </p>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">4. Zmiana Planu Taryfowego</h3>
          <p className="text-gray-700 mb-2">
            <strong>4.1.</strong> Użytkownik może w każdej chwili zmienić Plan Taryfowy (upgrade lub downgrade)
            z poziomu panelu Konta.
          </p>
          <p className="text-gray-700 mb-2">
            <strong>4.2.</strong> Upgrade (np. z Basic do Pro):
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700 ml-8">
            <li>Zmiany są natychmiastowe,</li>
            <li>Użytkownik płaci różnicę proporcjonalną za pozostały okres rozliczeniowy,</li>
            <li>Nowy cykl rozliczeniowy rozpoczyna się od następnego okresu.</li>
          </ul>
          <p className="text-gray-700 mt-2">
            <strong>4.3.</strong> Downgrade (np. z Pro do Basic):
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700 ml-8">
            <li>Zmiana wchodzi w życie po zakończeniu bieżącego okresu rozliczeniowego,</li>
            <li>Brak zwrotu za niewykorzystany okres,</li>
            <li>Użytkownik traci dostęp do funkcji zaawansowanych (np. Analytics, Custom domains).</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">5. Anulowanie Subskrypcji</h3>
          <p className="text-gray-700 mb-2">
            <strong>5.1.</strong> Użytkownik może anulować Subskrypcję w każdej chwili z poziomu panelu Konta
            (Ustawienia → Subskrypcja → Anuluj).
          </p>
          <p className="text-gray-700 mb-2">
            <strong>5.2.</strong> Po anulowaniu:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700 ml-8">
            <li>Subskrypcja pozostaje aktywna do końca opłaconego okresu rozliczeniowego,</li>
            <li>Brak automatycznego odnowienia w kolejnym miesiącu,</li>
            <li>Brak zwrotu za niewykorzystany czas,</li>
            <li>Po wygaśnięciu Subskrypcji Konto przechodzi w tryb "tylko odczyt" (brak możliwości generowania
              nowych raportów, dane pozostają dostępne przez 30 dni).</li>
          </ul>
          <p className="text-gray-700 mt-2">
            <strong>5.3.</strong> Użytkownik może w każdej chwili wznowić Subskrypcję.
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">VIII. PRAWA WŁASNOŚCI INTELEKTUALNEJ</h2>

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Prawa Usługodawcy</h3>
          <p className="text-gray-700 mb-2">
            <strong>1.1.</strong> Wszystkie prawa własności intelektualnej do Serwisu, w tym prawa autorskie do kodu
            źródłowego, interfejsu użytkownika, bazy danych, logo, grafik i dokumentacji, przysługują Usługodawcy
            lub jego licencjodawcom.
          </p>
          <p className="text-gray-700 mb-2">
            <strong>1.2.</strong> Serwis jest chroniony prawem autorskim (ustawa z dnia 4 lutego 1994 r. o prawie
            autorskim i prawach pokrewnych) oraz prawem własności przemysłowej.
          </p>
          <p className="text-gray-700 mt-2">
            <strong>1.3.</strong> Użytkownikowi przysługuje prawo korzystania z Serwisu wyłącznie w zakresie określonym
            niniejszym Regulaminem (licencja niewyłączna, niezbywalna, ograniczona terytorialnie do Polski, na czas
            trwania umowy).
          </p>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Treści Użytkownika</h3>
          <p className="text-gray-700 mb-2">
            <strong>2.1.</strong> Użytkownik zachowuje pełne prawa własności do Treści przesyłanych do Serwisu
            (pliki CSV/Excel, dane o nieruchomościach).
          </p>
          <p className="text-gray-700 mb-2">
            <strong>2.2.</strong> Poprzez przesłanie Treści Użytkownik udziela Usługodawcy niewyłącznej, nieodpłatnej
            licencji do przetwarzania tych Treści wyłącznie w celu świadczenia Usług (generowanie raportów XML/CSV,
            przechowywanie danych, udostępnianie publicznych endpointów).
          </p>
          <p className="text-gray-700 mt-2">
            <strong>2.3.</strong> Usługodawca nie nabywa praw własności do Treści Użytkownika. Po usunięciu Konta
            lub anulowaniu Subskrypcji Treści zostaną trwale usunięte z systemów Usługodawcy (okres retencji: 30 dni).
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Zakazy</h3>
          <p className="text-gray-700 mb-2">
            Użytkownikowi zabrania się:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700 ml-8">
            <li>Kopiowania, modyfikowania, adaptowania, tłumaczenia, dekompilacji, dezasemblacji lub inżynierii
              wstecznej kodu źródłowego Serwisu,</li>
            <li>Tworzenia utworów zależnych na podstawie Serwisu,</li>
            <li>Sprzedaży, wypożyczania, licencjonowania, sublicencjonowania Serwisu osobom trzecim,</li>
            <li>Usuwania oznaczeń praw autorskich lub innych informacji właścicielskich,</li>
            <li>Korzystania z Serwisu w sposób naruszający prawa osób trzecich.</li>
          </ul>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">IX. ODPOWIEDZIALNOŚĆ I GWARANCJE</h2>

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Odpowiedzialność Usługodawcy</h3>
          <p className="text-gray-700 mb-2">
            <strong>1.1.</strong> Usługodawca ponosi odpowiedzialność za niewykonanie lub nienależyte wykonanie Usług
            wyłącznie w zakresie określonym przepisami prawa, z zastrzeżeniem ograniczeń wskazanych w niniejszym Regulaminie.
          </p>
          <p className="text-gray-700 mb-2">
            <strong>1.2.</strong> Odpowiedzialność Usługodawcy za szkody wyrządzone Użytkownikowi z tytułu niewykonania
            lub nienależytego wykonania Usług ograniczona jest do wysokości opłaty za Subskrypcję za ostatni miesiąc
            rozliczeniowy.
          </p>
          <p className="text-gray-700 mt-2">
            <strong>1.3.</strong> Usługodawca nie ponosi odpowiedzialności za:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700 ml-8">
            <li>Nieprawidłowości, niekompletność lub nieprawdziwość danych dostarczonych przez Użytkownika,</li>
            <li>Decyzje organów administracji publicznej (w tym Ministerstwa Rozwoju) dotyczące akceptacji lub
              odrzucenia raportów wygenerowanych przez Serwis,</li>
            <li>Szkody wynikające z działań lub zaniechań osób trzecich (w tym dostawców infrastruktury:
              Vercel, Supabase, Stripe),</li>
            <li>Przerwy w działaniu Serwisu wynikające z przyczyn niezależnych od Usługodawcy (siła wyższa,
              ataki DDoS, awarie sprzętu, awarie Internetu),</li>
            <li>Utratę danych spowodowaną działaniem Użytkownika (np. przypadkowe usunięcie),</li>
            <li>Szkody pośrednie, utracone korzyści, utratę reputacji lub inne szkody niematerialne.</li>
          </ul>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Odpowiedzialność Użytkownika</h3>
          <p className="text-gray-700 mb-2">
            <strong>2.1.</strong> Użytkownik ponosi pełną odpowiedzialność za:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700 ml-8">
            <li>Prawidłowość, kompletność i zgodność z prawem Treści przesyłanych do Serwisu,</li>
            <li>Zachowanie poufności danych dostępowych do Konta,</li>
            <li>Wszelkie działania dokonane z wykorzystaniem jego Konta,</li>
            <li>Szkody wyrządzone Usługodawcy lub osobom trzecim wskutek naruszenia Regulaminu.</li>
          </ul>
          <p className="text-gray-700 mt-2">
            <strong>2.2.</strong> Użytkownik zobowiązuje się do niezwłocznego powiadomienia Usługodawcy o wykryciu
            błędów w Serwisie lub nieuprawnionego dostępu do Konta.
          </p>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Wyłączenie gwarancji</h3>
          <p className="text-gray-700 mb-2">
            <strong>3.1.</strong> Serwis świadczony jest w modelu "AS IS" (tak jak jest), bez jakichkolwiek gwarancji,
            wyraźnych lub dorozumianych, z wyjątkiem gwarancji wymaganych bezwzględnie obowiązującymi przepisami prawa.
          </p>
          <p className="text-gray-700 mb-2">
            <strong>3.2.</strong> Usługodawca nie gwarantuje, że:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700 ml-8">
            <li>Serwis będzie dostępny bez przerw i wolny od błędów,</li>
            <li>Wszystkie funkcjonalności będą działać we wszystkich przeglądarkach i systemach operacyjnych,</li>
            <li>Raporty wygenerowane przez Serwis zostaną zaakceptowane przez organy administracji (użytkownik
              zobowiązany jest do weryfikacji zgodności z aktualnymi wymogami ministerstwa).</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">4. Backup i utrata danych</h3>
          <p className="text-gray-700 mb-2">
            <strong>4.1.</strong> Usługodawca wykonuje regularne kopie zapasowe danych (backup co 24 godziny)
            za pośrednictwem dostawcy Supabase.
          </p>
          <p className="text-gray-700 mb-2">
            <strong>4.2.</strong> Użytkownik jest zobowiązany do samodzielnego tworzenia lokalnych kopii zapasowych
            ważnych danych. Usługodawca nie ponosi odpowiedzialności za utratę danych w przypadku awarii systemów
            dostawców zewnętrznych.
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">X. REKLAMACJE</h2>

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Procedura składania reklamacji</h3>
          <p className="text-gray-700 mb-2">
            <strong>1.1.</strong> Użytkownik ma prawo złożyć reklamację dotyczącą nieprawidłowości w świadczeniu Usług.
          </p>
          <p className="text-gray-700 mb-2">
            <strong>1.2.</strong> Reklamacje należy składać na adres email: <strong>kontakt@otoraport.pl</strong>
            z podaniem:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700 ml-8">
            <li>Adresu email powiązanego z Kontem,</li>
            <li>Opisu problemu (szczegółowy opis nieprawidłowości),</li>
            <li>Daty i godziny wystąpienia problemu,</li>
            <li>Zrzutów ekranu lub logów (jeśli dotyczy),</li>
            <li>Oczekiwanego sposobu rozpatrzenia reklamacji.</li>
          </ul>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Rozpatrzenie reklamacji</h3>
          <p className="text-gray-700 mb-2">
            <strong>2.1.</strong> Usługodawca zobowiązuje się do rozpatrzenia reklamacji w terminie <strong>14 dni
            roboczych</strong> od daty jej otrzymania.
          </p>
          <p className="text-gray-700 mb-2">
            <strong>2.2.</strong> Odpowiedź na reklamację zostanie wysłana na adres email, z którego złożono reklamację.
          </p>
          <p className="text-gray-700 mt-2">
            <strong>2.3.</strong> Jeśli reklamacja wymaga dodatkowych informacji, Usługodawca może zwrócić się do
            Użytkownika z prośbą o ich uzupełnienie. W takim przypadku termin rozpatrzenia biegnie od daty otrzymania
            uzupełnienia.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Formy zadośćuczynienia</h3>
          <p className="text-gray-700 mb-2">
            W przypadku uznania reklamacji Usługodawca może:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700 ml-8">
            <li>Naprawić nieprawidłowości w działaniu Serwisu,</li>
            <li>Przedłużyć Subskrypcję o okres odpowiadający czasowi niedostępności (proporcjonalnie),</li>
            <li>Zaoferować zwrot proporcjonalnej części opłaty za Subskrypcję,</li>
            <li>Zaproponować inne rozwiązanie akceptowalne dla Użytkownika.</li>
          </ul>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">XI. OCHRONA DANYCH OSOBOWYCH</h2>

        <p className="text-gray-700 mb-4">
          <strong>1.</strong> Administratorem danych osobowych Użytkowników jest Usługodawca. Szczegółowe informacje
          dotyczące przetwarzania danych osobowych, w tym podstawy prawne, cele, okres przechowywania, prawa osób,
          których dane dotyczą, oraz odbiorcy danych, znajdują się w <strong>Polityce Prywatności</strong> dostępnej
          pod adresem: <strong>otoraport.pl/privacy</strong>.
        </p>
        <p className="text-gray-700 mb-4">
          <strong>2.</strong> Korzystanie z Serwisu wymaga akceptacji Polityki Prywatności.
        </p>
        <p className="text-gray-700 mb-4">
          <strong>3.</strong> Użytkownik ma prawo dostępu do swoich danych, ich sprostowania, usunięcia, ograniczenia
          przetwarzania, przenoszenia danych oraz wniesienia sprzeciwu wobec przetwarzania. Użytkownik może również
          wnieść skargę do Prezesa Urzędu Ochrony Danych Osobowych (PUODO).
        </p>
        <p className="text-gray-700">
          <strong>4.</strong> W przypadku pytań dotyczących ochrony danych osobowych prosimy o kontakt:
          <strong> kontakt@otoraport.pl</strong>.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">XII. ZMIANA REGULAMINU</h2>

        <p className="text-gray-700 mb-2">
          <strong>1.</strong> Usługodawca zastrzega sobie prawo do zmiany Regulaminu z ważnych przyczyn, w tym:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-8">
          <li>Zmian w przepisach prawa mających wpływ na świadczenie Usług,</li>
          <li>Zmian zakresu lub sposobu świadczenia Usług,</li>
          <li>Wprowadzenia nowych funkcjonalności lub planów taryfowych,</li>
          <li>Zapewnienia bezpieczeństwa i stabilności Serwisu,</li>
          <li>Naprawienia błędów lub nieścisłości w treści Regulaminu.</li>
        </ul>
        <p className="text-gray-700 mt-4 mb-2">
          <strong>2.</strong> O planowanej zmianie Regulaminu Użytkownicy zostaną powiadomieni z wyprzedzeniem
          <strong> co najmniej 14 dni kalendarzowych</strong> poprzez:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-8">
          <li>Email wysłany na adres powiązany z Kontem,</li>
          <li>Komunikat widoczny po zalogowaniu do Serwisu.</li>
        </ul>
        <p className="text-gray-700 mt-4 mb-2">
          <strong>3.</strong> Zmieniony Regulamin wchodzi w życie z dniem wskazanym w powiadomieniu (nie wcześniej
          niż po upływie 14 dni od daty wysłania powiadomienia).
        </p>
        <p className="text-gray-700 mt-4 mb-2">
          <strong>4.</strong> Kontynuowanie korzystania z Serwisu po wejściu w życie zmian oznacza akceptację
          zmienionego Regulaminu.
        </p>
        <p className="text-gray-700 mt-4">
          <strong>5.</strong> Użytkownik, który nie akceptuje zmian, ma prawo do wypowiedzenia umowy (anulowania
          Subskrypcji) przed datą wejścia w życie zmian. W takim przypadku przysługuje mu zwrot proporcjonalnej
          części opłaty za niewykorzystany okres Subskrypcji.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">XIII. ROZWIĄZANIE UMOWY</h2>

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Wypowiedzenie przez Użytkownika</h3>
          <p className="text-gray-700 mb-2">
            <strong>1.1.</strong> Użytkownik może w każdej chwili rozwiązać umowę poprzez anulowanie Subskrypcji
            z poziomu panelu Konta lub wysyłając wiadomość email na adres kontakt@otoraport.pl.
          </p>
          <p className="text-gray-700 mb-2">
            <strong>1.2.</strong> Rozwiązanie umowy następuje z końcem opłaconego okresu rozliczeniowego (brak
            natychmiastowej dezaktywacji Konta).
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Rozwiązanie przez Usługodawcę</h3>
          <p className="text-gray-700 mb-2">
            <strong>2.1.</strong> Usługodawca ma prawo rozwiązać umowę ze skutkiem natychmiastowym w przypadku:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700 ml-8">
            <li>Rażącego naruszenia Regulaminu przez Użytkownika (w tym prób nieautoryzowanego dostępu, sabotażu,
              ataków na infrastrukturę),</li>
            <li>Działań Użytkownika naruszających przepisy prawa,</li>
            <li>Nieuregulowania płatności za Subskrypcję pomimo dwukrotnego wezwania (z terminem minimum 7 dni na
              każde wezwanie),</li>
            <li>Wykorzystywania Serwisu w sposób zagrażający bezpieczeństwu innych Użytkowników lub stabilności systemu.</li>
          </ul>
          <p className="text-gray-700 mt-4 mb-2">
            <strong>2.2.</strong> W przypadku rozwiązania umowy przez Usługodawcę z przyczyn leżących po stronie
            Użytkownika, nie przysługuje zwrot proporcjonalnej części opłaty za niewykorzystany okres.
          </p>
          <p className="text-gray-700 mt-4">
            <strong>2.3.</strong> Usługodawca powiadomi Użytkownika o rozwiązaniu umowy oraz o przyczynach na adres
            email powiązany z Kontem.
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">XIV. POSTANOWIENIA KOŃCOWE</h2>

        <p className="text-gray-700 mb-4">
          <strong>1. Prawo właściwe.</strong> W sprawach nieuregulowanych niniejszym Regulaminem zastosowanie mają
          przepisy prawa polskiego, w szczególności:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-8">
          <li>Ustawa z dnia 23 kwietnia 1964 r. – Kodeks cywilny (Dz.U. 1964 nr 16 poz. 93 z późn. zm.),</li>
          <li>Ustawa z dnia 18 lipca 2002 r. o świadczeniu usług drogą elektroniczną (Dz.U. 2002 nr 144 poz. 1204
            z późn. zm.),</li>
          <li>Rozporządzenie Parlamentu Europejskiego i Rady (UE) 2016/679 (RODO).</li>
        </ul>

        <p className="text-gray-700 mt-4 mb-4">
          <strong>2. Rozstrzyganie sporów.</strong> Wszelkie spory wynikłe z niniejszego Regulaminu lub związane z
          korzystaniem z Serwisu będą rozstrzygane przez sąd powszechny właściwy miejscowo dla siedziby Usługodawcy,
          chyba że bezwzględnie obowiązujące przepisy prawa stanowią inaczej.
        </p>

        <p className="text-gray-700 mb-4">
          <strong>3. Możliwość polubownego rozstrzygnięcia sporu.</strong> Użytkownik będący przedsiębiorcą może
          skorzystać z polubownych sposobów rozwiązywania sporów, w tym mediacji lub sądu polubownego. Informacje
          dostępne na stronie: <a href="https://polubowne.uokik.gov.pl" className="text-blue-600 underline"
          target="_blank" rel="noopener noreferrer">polubowne.uokik.gov.pl</a>.
        </p>

        <p className="text-gray-700 mb-4">
          <strong>4. Cesja umowy.</strong> Użytkownik nie może przenieść praw i obowiązków wynikających z niniejszego
          Regulaminu na osoby trzecie bez pisemnej zgody Usługodawcy. Usługodawca ma prawo do cesji umowy na rzecz
          podmiotów powiązanych lub następców prawnych.
        </p>

        <p className="text-gray-700 mb-4">
          <strong>5. Nieważność postanowień.</strong> Jeśli którekolwiek z postanowień Regulaminu zostanie uznane za
          nieważne lub nieskuteczne, nie wpływa to na ważność pozostałych postanowień. W miejsce nieważnego postanowienia
          zastosowanie będzie miał przepis prawa najbliższy celowi tego postanowienia.
        </p>

        <p className="text-gray-700 mb-4">
          <strong>6. Kontakt.</strong> W przypadku pytań dotyczących Regulaminu prosimy o kontakt:
        </p>
        <ul className="list-none space-y-1 text-gray-700 ml-8">
          <li>Email: <strong>kontakt@otoraport.pl</strong></li>
          <li>Telefon: <strong>[NUMER TELEFONU]</strong> <span className="text-red-600">[DO UZUPEŁNIENIA]</span></li>
          <li>Adres korespondencyjny: <strong>[ADRES SIEDZIBY]</strong> <span className="text-red-600">[DO UZUPEŁNIENIA]</span></li>
        </ul>

        <p className="text-gray-700 mt-6">
          <strong>7. Data wejścia w życie.</strong> Niniejszy Regulamin wchodzi w życie z dniem <strong>3 października 2025 r.</strong>
        </p>
      </section>

      <div className="mt-12 p-6 bg-amber-50 rounded-lg border-2 border-amber-400">
        <h3 className="text-lg font-bold text-amber-900 mb-3">⚠️ UWAGA PRAWNA - WYMAGANA WERYFIKACJA</h3>
        <p className="text-sm text-amber-800 mb-3">
          <strong>Powyższa treść Regulaminu ma charakter projektowy i wymaga obowiązkowej weryfikacji oraz akceptacji
          przez radcę prawnego lub adwokata specjalizującego się w prawie nowych technologii i e-commerce.</strong>
        </p>

        <div className="bg-white p-4 rounded border border-amber-300 mb-3">
          <p className="text-sm font-semibold text-gray-900 mb-2">DO UZUPEŁNIENIA PRZEZ WŁAŚCICIELA FIRMY:</p>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            <li><strong>[NAZWA FIRMY]</strong> - pełna nazwa prawna (np. "Tech Solutions Sp. z o.o.")</li>
            <li><strong>[sp. z o.o. / S.A. / inne]</strong> - forma prawna działalności</li>
            <li><strong>[ADRES SIEDZIBY]</strong> - pełny adres (ulica, nr budynku/lokalu, kod pocztowy, miasto)</li>
            <li><strong>[NIP]</strong> - 10-cyfrowy numer NIP (format: 123-456-78-90)</li>
            <li><strong>[REGON]</strong> - 9 lub 14-cyfrowy numer REGON</li>
            <li><strong>[NUMER KRS lub CEiDG]</strong> - numer z Krajowego Rejestru Sądowego lub Centralnej Ewidencji
              i Informacji o Działalności Gospodarczej</li>
            <li><strong>[NUMER TELEFONU]</strong> - telefon kontaktowy dla użytkowników (format: +48 123 456 789)</li>
          </ul>
        </div>

        <div className="bg-white p-4 rounded border border-amber-300">
          <p className="text-sm font-semibold text-gray-900 mb-2">WYMAGANA KONSULTACJA PRAWNA W ZAKRESIE:</p>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            <li>Zgodność z ustawą o świadczeniu usług drogą elektroniczną (art. 8)</li>
            <li>Ograniczenia odpowiedzialności (sekcja IX) - weryfikacja pod kątem Kodeksu cywilnego</li>
            <li>Procedury reklamacyjne (sekcja X) - zgodność z prawem konsumenckim (mimo B2B należy zweryfikować)</li>
            <li>Warunki zwrotu płatności (sekcja VII.5) - zgodność z przepisami o płatnościach</li>
            <li>Klauzule dotyczące cesji, rozwiązania umowy (sekcje XIII, XIV) - skuteczność prawna</li>
            <li>Właściwość sądów i prawo właściwe (sekcja XIV.2) - weryfikacja pod kątem przepisów UE</li>
            <li>Czy wymagane jest powołanie Inspektora Ochrony Danych (IOD/DPO) dla tego typu działalności</li>
          </ul>
        </div>
      </div>
    </LegalLayout>
  )
}
