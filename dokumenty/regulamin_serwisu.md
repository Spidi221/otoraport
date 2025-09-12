# REGULAMIN SERWISU CENYSYNC
**Platforma SaaS do automatycznego raportowania cen mieszkań**

---

## 1. POSTANOWIENIA OGÓLNE

### 1.1 Definicje
W rozumieniu niniejszego Regulaminu następujące pojęcia oznaczają:

**Serwis/Platforma** - serwis internetowy CenySync dostępny pod adresem https://cenysync.pl wraz z wszystkimi funkcjonalnościami, API i subdomenami

**Administrator/Usługodawca** - CenySync Sp. z o.o. z siedzibą w Warszawie (00-001), ul. Technologiczna 15, NIP: 1234567890, REGON: 123456789, KRS: 0000123456

**Użytkownik/Klient** - przedsiębiorca w rozumieniu art. 43¹ Kodeksu cywilnego, korzystający z Serwisu w ramach działalności gospodarczej

**Deweloper** - podmiot prowadzący działalność w zakresie budownictwa mieszkaniowego, zobowiązany do publikacji danych o cenach zgodnie z ustawą z 21 maja 2025 r.

**Konto** - indywidualny panel użytkownika z dostępem do funkcjonalności Platformy

**Subskrypcja** - odpłatny dostęp do usług Platformy w ramach wybranego pakietu (Basic/Pro/Enterprise)

**Compliance** - zgodność z wymogami ustawy z 21 maja 2025 r. o udostępnianiu danych o cenach mieszkań

**Endpoint** - adres URL udostępniający dane w formatach XML/MD/JSON zgodnie z wymaganiami ministerstwa

### 1.2 Zakres zastosowania
1. Niniejszy Regulamin określa zasady korzystania z Serwisu CenySync
2. Regulamin obowiązuje wszystkich Użytkowników od momentu rejestracji
3. Serwis jest przeznaczony wyłącznie dla przedsiębiorców (B2B)
4. Korzystanie z Serwisu wymaga zaakceptowania Regulaminu
5. Regulamin jest dostępny stale pod adresem: https://cenysync.pl/regulamin

### 1.3 Charakter prawny
1. Regulamin stanowi wzorzec umowy w rozumieniu art. 384 Kodeksu cywilnego
2. Rejestracja w Serwisie oznacza zawarcie umowy o świadczenie usług drogą elektroniczną
3. Umowa zostaje zawarta na czas nieokreślony z możliwością wypowiedzenia
4. Do umowy stosuje się przepisy polskiego prawa, w szczególności:
   - Ustawa z 23 kwietnia 1964 r. - Kodeks cywilny
   - Ustawa z 18 lipca 2002 r. o świadczeniu usług drogą elektroniczną
   - Ustawa z 30 maja 2014 r. o prawach konsumenta (w zakresie nieuregulowanym)

---

## 2. USŁUGI ŚWIADCZONE PRZEZ PLATFORMĘ

### 2.1 Zakres podstawowych usług
Platforma CenySync świadczy następujące usługi:

1. **Automatyzacja compliance ministerialnego:**
   - Upload danych o nieruchomościach (CSV, XML, ręczne wprowadzanie)
   - Walidacja zgodności z Schema XML 1.13
   - Generowanie plików XML/MD zgodnych z wymaganiami
   - Publikacja na endpointach publicznych

2. **Zarządzanie danymi projektów:**
   - Tworzenie i edycja profili inwestycji mieszkaniowych
   - Import masowy danych z plików CSV/Excel
   - Historia zmian cen i statusów lokali
   - Archiwizacja wersji historycznych

3. **Monitoring i powiadomienia:**
   - Monitorowanie dostępności endpointów (uptime)
   - Alerty o zbliżających się terminach publikacji
   - Powiadomienia o błędach walidacji
   - Raporty compliance dla audytów ministerialnych

4. **Integracje techniczne:**
   - API RESTful dla zaawansowanych użytkowników
   - Webhook notifications
   - Export danych do formatów standardowych
   - Integracja z systemami CRM/ERP (roadmap)

### 2.2 Pakiety subskrypcyjne

**BASIC (149 PLN/miesiąc):**
- Podstawowe funkcjonalności compliance
- Do 3 aktywnych projektów
- Endpointy XML/MD dla ministerstwa
- Email support (48h response)
- 1 użytkownik na konto

**PRO (249 PLN/miesiąc):**
- Wszystkie funkcje BASIC
- Do 10 aktywnych projektów
- Strony prezentacyjne na subdomenach *.cenysync.pl
- Personalizacja wyglądu stron klienckich
- Analytics i lead capture forms
- Priority support (24h response)
- Do 3 użytkowników na konto

**ENTERPRISE (399 PLN/miesiąc):**
- Wszystkie funkcje PRO
- Unlimited projekty
- Custom domeny dla stron prezentacyjnych
- White-label branding
- API access z wyższymi limitami
- Dedicated account manager
- Phone support
- SSO integration (SAML/OAuth)
- SLA 99.95% uptime

### 2.3 Funkcjonalności dodatkowe
1. **AI Chatbot Assistant (dostępny we wszystkich pakietach):**
   - 24/7 wsparcie przy onboardingu
   - Pomoc w formatowaniu danych
   - Wyjaśnianie wymagań ministerialnych
   - Rozwiązywanie problemów technicznych

2. **Zaawansowana analityka (PRO/ENTERPRISE):**
   - Raporty sprzedaży i trendów cenowych
   - Analiza konkurencji rynkowej
   - Forecasting cen mieszkań
   - Custom dashboards

3. **Integracje zewnętrzne (ENTERPRISE):**
   - Synchronizacja z systemami deweloperskimi
   - Automatyczny import z baz danych
   - Integracja z portalami nieruchomości
   - API dla aplikacji mobilnych

---

## 3. REJESTRACJA I KONTO UŻYTKOWNIKA

### 3.1 Warunki rejestracji
1. **Wymagania:**
   - Posiadanie statusu przedsiębiorcy
   - Prowadzenie działalności w branży nieruchomości
   - Podanie prawdziwych danych firmy (NIP, REGON)
   - Akceptacja Regulaminu i Polityki Prywatności

2. **Proces rejestracji:**
   - Wypełnienie formularza rejestracyjnego
   - Weryfikacja adresu email (link aktywacyjny)
   - Wybór pakietu subskrypcyjnego
   - Potwierdzenie pierwszej płatności
   - Aktywacja konta (automatyczna po płatności)

3. **Weryfikacja tożsamości:**
   - Automatyczne sprawdzenie NIP w bazie CEIDG/KRS
   - W przypadkach wątpliwych: żądanie dokumentów potwierdzających
   - Prawo odmowy rejestracji bez podania przyczyny

### 3.2 Zarządzanie kontem
1. **Dane konta:**
   - Dane firmy (nazwa, adres, NIP, REGON, KRS)
   - Dane kontaktowe (email, telefon, osoba odpowiedzialna)
   - Ustawienia rozliczeniowe (dane do faktury)
   - Preferencje komunikacji i powiadomień

2. **Bezpieczeństwo:**
   - Obowiązkowe hasła spełniające kryteria bezpieczeństwa
   - Opcjonalna autentyfikacja dwuskładnikowa (2FA)
   - Logi aktywności na koncie
   - Możliwość zdalnego wylogowania ze wszystkich sesji

3. **Zarządzanie użytkownikami (PRO/ENTERPRISE):**
   - Dodawanie współpracowników z różnymi uprawnieniami
   - Role: Administrator, Edytor, Viewer
   - Kontrola dostępu do poszczególnych projektów
   - Audit trail dla działań użytkowników

### 3.3 Zawieszenie i usunięcie konta
1. **Zawieszenie przez Usługodawcę:**
   - Naruszenie postanowień Regulaminu
   - Brak płatności przez okres 14 dni
   - Podejrzenie działalności niezgodnej z prawem
   - Żądanie organów państwowych

2. **Usunięcie na żądanie Użytkownika:**
   - Wypowiedzenie umowy z zachowaniem okresu rozliczeniowego
   - Eksport danych przed usunięciem (prawo do przenoszenia)
   - Trwałe usunięcie danych po 30 dniach
   - Zachowanie danych wymaganych prawem (faktury, logi)

---

## 4. ZASADY KORZYSTANIA Z SERWISU

### 4.1 Dozwolone użycie
1. **Zgodne z przeznaczeniem:**
   - Publikacja prawdziwych danych o cenach mieszkań
   - Zapewnienie compliance z wymogami ministerstwa
   - Używanie w ramach prowadzonej działalności gospodarczej
   - Wykorzystanie zgodnie z licencją i ograniczeniami pakietu

2. **Obowiązki Użytkownika:**
   - Dostarczanie aktualnych i prawdziwych danych
   - Regularne aktualizowanie informacji o projektach
   - Przestrzeganie terminów publikacji wymaganych prawem
   - Zabezpieczenie danych dostępowych do konta

3. **Współpraca w compliance:**
   - Udostępnianie dokumentów na potrzeby audytów
   - Powiadamianie o zmianach w prowadzonej działalności
   - Współpraca przy weryfikacji danych przez organy państwowe
   - Przestrzeganie wytycznych dotyczących formatów danych

### 4.2 Zabronione działania
1. **Zakaz manipulacji danych:**
   - Publikowanie nieprawdziwych cen mieszkań
   - Ukrywanie dostępnych lokali w celu manipulacji rynkiem
   - Wprowadzanie fałszywych danych projektów
   - Obchodzenie wymogów raportowania ministerialnego

2. **Zakaz działań technicznych:**
   - Próby włamania do systemu lub kont innych użytkowników
   - Nadmierne obciążanie serwerów (ponad limity API)
   - Reverse engineering kodu aplikacji
   - Dystrybucja wirusów, malware lub szkodliwego kodu

3. **Zakaz działań konkurencyjnych:**
   - Tworzenie konkurencyjnych serwisów na podstawie naszych danych
   - Masowe pobieranie danych innych użytkowników
   - Reselling dostępu do platformy bez zgody
   - Naruszanie praw własności intelektualnej

### 4.3 Konsekwencje naruszeń
1. **Upomnienie:** przy pierwszych, drobnych naruszeniach
2. **Ograniczenie funkcjonalności:** czasowe wyłączenie określonych opcji
3. **Zawieszenie konta:** na okres od 7 do 30 dni
4. **Rozwiązanie umowy:** w przypadku poważnych naruszeń
5. **Roszczenia prawne:** dochodzenie odszkodowań za szkody

---

## 5. PŁATNOŚCI I ROZLICZENIA

### 5.1 Model rozliczeniowy
1. **Subskrypcja miesięczna:**
   - Płatność z góry za każdy miesiąc kalendarzowy
   - Automatyczna prolongata przy aktywnej metodzie płatności
   - Brak możliwości proporcjonalnego zwrotu za niewykorzystany okres
   - Ceny zawierają podatek VAT zgodnie z polskimi przepisami

2. **Metody płatności:**
   - **Przelewy24:** karty płatnicze, BLIK, przelewy bankowe
   - **Tradycyjny przelew:** na podstawie wystawionej faktury
   - **Płatność cykliczna:** automatyczne obciążenia (karty/konto)

3. **Fakturowanie:**
   - Faktury VAT wystawiane automatycznie po płatności
   - Wysyłka w formie elektronicznej na email rozliczeniowy
   - Możliwość zmiany danych do faktury w ustawieniach konta
   - Archiwum faktur dostępne w panelu użytkownika

### 5.2 Zmiany cen i pakietów
1. **Zmiana pakietu:**
   - **Upgrade:** natychmiastowy z proporcjonalnym dopłaceniem
   - **Downgrade:** od kolejnego cyklu rozliczeniowego
   - **Trial period:** 14 dni bezpłatnego testowania PRO (nowi klienci)

2. **Zmiany cenników:**
   - Powiadomienie o podwyżkach z 30-dniowym wyprzedzeniem
   - Prawo do wypowiedzenia umowy przed wejściem nowych cen
   - Zmiany nie dotyczą okresów już opłaconych
   - Możliwość zamrożenia cen w umowach Enterprise (min. 12 miesięcy)

### 5.3 Opóźnienia w płatnościach
1. **Grace period:** 7 dni od terminu płatności bez konsekwencji
2. **Soft suspension:** po 14 dniach - ograniczenie funkcjonalności
3. **Hard suspension:** po 30 dniach - całkowite zawieszenie dostępu
4. **Usunięcie danych:** po 60 dniach nieaktywności konta

**Przywrócenie:** możliwe w każdym momencie po uregulowaniu zaległości + opłata reaktywacyjna 50 PLN

---

## 6. ODPOWIEDZIALNOŚĆ I GWARANCJE

### 6.1 Gwarancje Usługodawcy
1. **SLA (Service Level Agreement):**
   - **BASIC/PRO:** 99.5% dostępności miesięcznie
   - **ENTERPRISE:** 99.95% dostępności miesięcznie
   - **Czas odpowiedzi API:** <200ms (95th percentile)
   - **Monitoring 24/7:** automatyczne systemy alertów

2. **Gwarancja zgodności:**
   - Zgodność generowanych plików XML z Schema 1.13
   - Aktualność wymagań ministerialnych (aktualizacje w ciągu 7 dni)
   - Poprawność walidacji danych wejściowych
   - Zachowanie formatów wymaganych przez organy państwowe

3. **Gwarancja bezpieczeństwa:**
   - Szyfrowanie danych w tranzycie i spoczynku
   - Regularne kopie zapasowe (daily backups)
   - Monitoring bezpieczeństwa i protection przed atakami
   - Compliance z wymogami RODO/GDPR

### 6.2 Wyłączenia odpowiedzialności
1. **Usługodawca nie ponosi odpowiedzialności za:**
   - Szkody wynikające z błędów w danych dostarczonych przez Użytkownika
   - Konsekwencje prawne publikacji nieprawdziwych informacji
   - Straty wynikające z decyzji biznesowych podjętych na podstawie danych
   - Przerwy w dostępności spowodowane siłą wyższą

2. **Ograniczenia czasowe:**
   - Awarie spowodowane aktualizacjami systemu (max 4h miesięcznie)
   - Przerwy konserwacyjne z 48h wyprzedzeniem
   - Niedostępność usług zewnętrznych (DNS, CDN, płatności)
   - Ataki DDoS lub inne działania podmiotów trzecich

3. **Wyłączenie odpowiedzialności za dane strony trzecie:**
   - Integracje z API zewnętrznymi (GUS, CEIDG, mapy)
   - Dane importowane z innych systemów
   - Informacje pobrane z portali internetowych
   - Zmiany w przepisach prawnych po dacie aktualizacji

### 6.3 Ograniczenie wysokości odszkodowań
1. **Maksymalna odpowiedzialność** Usługodawcy ograniczona jest do wysokości opłat zapłaconych przez Użytkownika w okresie 12 miesięcy poprzedzających powstanie szkody
2. **Wyłączenie odpowiedzialności za szkody pośrednie,** w tym utracone korzyści, szkody w reputacji, koszty alternatywnych rozwiązań
3. **Wyjątki:** umyślne działania, naruszenia bezpieczeństwa danych z winy Usługodawcy, naruszenia praw własności intelektualnej

---

## 7. WŁASNOŚĆ INTELEKTUALNA

### 7.1 Prawa Usługodawcy
1. **Własność platformy:**
   - Kod źródłowy aplikacji, algorytmy, bazy danych
   - Interfejs użytkownika, design, logotypy
   - Dokumentacja techniczna i instrukcje
   - Znaki towarowe "CenySync" i powiązane

2. **Licencja dla Użytkownika:**
   - Niewyłączne prawo do korzystania z Serwisu
   - Ograniczone do celów prowadzonej działalności gospodarczej
   - Bez prawa do sublicencjonowania lub odsprzedaży
   - Na czas trwania umowy subskrypcyjnej

### 7.2 Prawa Użytkownika
1. **Własność danych:**
   - Użytkownik zachowuje pełną własność wprowadzonych danych
   - Dane projektów, ceny mieszkań, informacje kontaktowe
   - Zdjęcia, plany, materiały promocyjne przesłane do systemu
   - Konfiguracjie, ustawienia, preferencje personalizacji

2. **Licencja dla Usługodawcy:**
   - Użytkownik udziela licencji na przetwarzanie danych w celu świadczenia usług
   - Prawo do publikacji na endpointach publicznych (wymaganie prawne)
   - Prawo do tworzenia kopii zapasowych i archiwizacji
   - Bez prawa do wykorzystania w celach konkurencyjnych

### 7.3 Naruszenia praw autorskich
1. **Procedura DMCA:**
   - Zgłaszanie naruszeń na adres: legal@cenysync.pl
   - Weryfikacja zgodnie z procedurami międzynarodowymi
   - Usunięcie materiałów naruszających w ciągu 24h
   - Możliwość counter-notice dla fałszywych zgłoszeń

2. **Ochrona własności:**
   - Monitoring automatyczny pod kątem kopiowania treści
   - Współpraca z organami ścigania w przypadkach kradzieży IP
   - Prawo do dochodzenia roszczeń przed sądami polskimi
   - Zabezpieczenie dowodów zgodnie z wymogami procesowymi

---

## 8. OCHRONA DANYCH OSOBOWYCH

### 8.1 Zakres przetwarzania
**Szczegółowe informacje w:** [Polityka Prywatności](./polityka_prywatnosci.md)

1. **Dane przetwarzane:**
   - Dane kontaktowe przedstawicieli firm użytkowników
   - Dane techniczne związane z korzystaniem z platformy
   - Dane projektów i nieruchomości (bez danych osobowych nabywców)
   - Logi systemowe i dane analityczne

2. **Podstawy prawne:**
   - Wykonanie umowy (świadczenie usług)
   - Obowiązek prawny (compliance, księgowość)
   - Prawnie uzasadniony interes (bezpieczeństwo, marketing)
   - Zgoda (newsletter, cookies marketingowe)

### 8.2 Prawa osób, których dane dotyczą
1. **Katalog praw:** dostęp, sprostowanie, usunięcie, ograniczenie, przenoszenie, sprzeciw
2. **Realizacja:** kontakt z IOD na dpo@cenysync.pl
3. **Terminy:** do 30 dni od złożenia wniosku
4. **Odwołania:** do Prezesa Urzędu Ochrony Danych Osobowych

### 8.3 Bezpieczeństwo danych
1. **Środki techniczne:** szyfrowanie, kontrola dostępu, monitoring
2. **Środki organizacyjne:** szkolenia, procedury, audyty
3. **Incydenty:** zgłoszenie do UODO w ciągu 72h (jeśli wymagane)
4. **Podwykonawcy:** umowy z klauzulami RODO, Due Diligence

---

## 9. WSPARCIE TECHNICZNE

### 9.1 Kanały wsparcia
1. **AI Chatbot (24/7):**
   - Podstawowe pytania i onboarding
   - Troubleshooting typowych problemów
   - Przewodnik po funkcjonalnościach
   - Escalation do zespołu ludzkiego

2. **Email Support:**
   - **BASIC:** support@cenysync.pl (48h response SLA)
   - **PRO:** priority@cenysync.pl (24h response SLA)
   - **ENTERPRISE:** vip@cenysync.pl (4h response SLA)

3. **Phone Support (tylko ENTERPRISE):**
   - Dedicated line: +48 22 123 45 67
   - Dostępność: pon-pt 9:00-18:00
   - Emergency hotline 24/7 dla krytycznych awarii

### 9.2 Scope wsparcia
1. **Wsparcie techniczne:**
   - Problemy z logowaniem i dostępem do konta
   - Błędy podczas uploadowania danych
   - Problemy z generowaniem plików XML/MD
   - Konfiguracja endpointów i subdomen

2. **Wsparcie merytoryczne:**
   - Wyjaśnienie wymagań ministerialnych
   - Pomoc w formacie danych wejściowych
   - Best practices dla compliance
   - Interpretacja komunikatów błędów

3. **Wsparcie rozwoju (ENTERPRISE):**
   - Konsultacje przy integracji API
   - Custom feature development (płatne)
   - Dedicated account manager
   - Priority w roadmap development

### 9.3 Eskalacja i SLA
1. **Poziomy wsparcia:**
   - **L1:** Podstawowe pytania, onboarding, dokumentacja
   - **L2:** Problemy techniczne, błędy systemu, integracje
   - **L3:** Krytyczne awarie, eskalacja deweloperska

2. **SLA Response Time:**
   - **BASIC:** 48 godzin (dni robocze)
   - **PRO:** 24 godziny (dni robocze)
   - **ENTERPRISE:** 4 godziny (24/7)

3. **SLA Resolution Time:**
   - **Minor issues:** 5 dni roboczych
   - **Major issues:** 2 dni robocze
   - **Critical issues:** 24 godziny (z workarounds)

---

## 10. SIŁA WYŻSZA I OKOLICZNOŚCI NADZWYCZAJNE

### 10.1 Definicja siły wyższej
Za okoliczności siły wyższej uważa się zdarzenia pozostające poza kontrolą Usługodawcy:
1. **Klęski żywiołowe:** powodzie, pożary, trzęsienia ziemi, hurricanes
2. **Wydarzenia geopolityczne:** wojny, zamieszki, strajki generalne
3. **Awarie infrastruktury:** blackouts, awarie internetu, DNS
4. **Cyberataki:** DDoS, ransomware, ataki na dostawców usług
5. **Zmiany prawne:** nagłe zmiany regulacji, zakazy działalności
6. **Pandemie:** ograniczenia w działalności, lockdowns

### 10.2 Procedury w przypadku siły wyższej
1. **Komunikacja:** natychmiastowe powiadomienie użytkowników o wystąpieniu siły wyższej
2. **Status page:** aktualizacje w czasie rzeczywistym na https://status.cenysync.pl
3. **Środki zaradcze:** implementacja rozwiązań tymczasowych gdzie możliwe
4. **Eskalacja:** uruchomienie planów awaryjnych i backup procedures

### 10.3 Skutki dla umowy
1. **Zawieszenie zobowiązań:** na czas trwania okoliczności siły wyższej
2. **Brak naliczania kar:** za niedostępność usług w tym okresie
3. **Przedłużenie SLA:** o czas trwania siły wyższej
4. **Prawo rozwiązania:** jeśli siła wyższa trwa ponad 30 dni

---

## 11. ROZWIĄZANIE UMOWY

### 11.1 Wypowiedzenie przez Użytkownika
1. **Wypowiedzenie bez przyczyny:**
   - W każdym czasie z zachowaniem okresu rozliczeniowego
   - Skuteczne z końcem opłaconego miesiąca
   - Brak zwrotu proporcjonalnego za niewykorzystany okres
   - Możliwość rezygnacji przez ustawienia konta lub email

2. **Wypowiedzenie z ważnej przyczyny:**
   - Istotne naruszenie umowy przez Usługodawcę
   - Brak usunięcia naruszeń w terminie 14 dni od wezwania
   - Zmiana regulaminu na niekorzyść Użytkownika
   - Skuteczne z momentem doręczenia oświadczenia

### 11.2 Wypowiedzenie przez Usługodawcę
1. **Wypowiedzenie bez przyczyny:**
   - Z zachowaniem 30-dniowego terminu wypowiedzenia
   - Zwrot proporcjonalnej części opłaty za niewykorzystany okres
   - Możliwość eksportu danych przez okres wypowiedzenia

2. **Wypowiedzenie z ważnej przyczyny (ze skutkiem natychmiastowym):**
   - Rażące naruszenie postanowień regulaminu
   - Działalność niezgodna z prawem
   - Zagrożenie bezpieczeństwa systemu
   - Nieuregulowane opłaty przez okres ponad 60 dni

### 11.3 Skutki rozwiązania umowy
1. **Natychmiastowe:**
   - Utrata dostępu do panelu administracyjnego
   - Zatrzymanie generowania nowych plików XML/MD
   - Wyłączenie powiadomień i monitoringu

2. **W terminie 30 dni:**
   - Trwałe usunięcie danych użytkownika z systemów
   - Deaktywacja endpointów publicznych
   - Usunięcie subdomen i stron prezentacyjnych

3. **Zachowane elementy:**
   - Faktury i dokumenty księgowe (zgodnie z prawem)
   - Logi bezpieczeństwa (12 miesięcy)
   - Dane wymagane dla rozliczenia zobowiązań

---

## 12. ROZSTRZYGANIE SPORÓW

### 12.1 Postępowanie przedsądowe
1. **Obowiązek negocjacji:** strony zobowiązują się do próby polubownego rozwiązania sporu
2. **Termin na odpowiedź:** 14 dni od otrzymania reklamacji/roszczenia
3. **Mediacja:** w przypadku braku porozumienia, mediacja przez akredytowany ośrodek
4. **Dokumentacja:** prowadzenie pisemnej dokumentacji wszystkich ustaleń

### 12.2 Właściwość sądów
1. **Sąd właściwy:** Sądy Rejonowe/Okręgowe dla Warszawy (siedziba Usługodawcy)
2. **Prawo właściwe:** polskie prawo materialne i procesowe
3. **Język postępowania:** polski
4. **Wyłączenie konwencji:** Convention on the International Sale of Goods nie ma zastosowania

### 12.3 Specjalne procedury dla niektórych sporów
1. **Spory o ochronę danych osobowych:**
   - Możliwość skierowania skargi do UODO
   - Właściwość sądów miejsca zamieszkania osoby, której dane dotyczą
   - Stosowanie przepisów RODO i ustawy o ochronie danych

2. **Spory konsumenckie (jeśli zastosowanie):**
   - Możliwość skierowania do UOKiK
   - Polubowne sądy konsumenckie
   - Europejska platforma ODR dla sporów online

---

## 13. ZMIANY REGULAMINU

### 13.1 Procedura wprowadzania zmian
1. **Powiadomienie:** informacja o planowanych zmianach z 30-dniowym wyprzedzeniem
2. **Kanały komunikacji:** email, powiadomienie w aplikacji, strona internetowa
3. **Akceptacja:** milcząca przez kontynuowanie korzystania z usług
4. **Sprzeciw:** prawo do wypowiedzenia umowy przed wejściem zmian w życie

### 13.2 Rodzaje zmian
1. **Zmiany korzystne dla Użytkowników:**
   - Dodanie nowych funkcjonalności bez dodatkowych opłat
   - Poprawa jakości obsługi
   - Rozszerzenie gwarancji lub SLA
   - Mogą wejść w życie bez okresu wypowiedzenia

2. **Zmiany neutralne:**
   - Dostosowanie do zmian przepisów prawnych
   - Aktualizacja danych kontaktowych
   - Korekty redakcyjne i doprecyzowania
   - Standardowy 30-dniowy okres

3. **Zmiany niekorzystne:**
   - Podwyższenie cen lub opłat
   - Ograniczenie funkcjonalności
   - Zaostrzenie warunków korzystania
   - Prawo do wypowiedzenia do momentu wejścia w życie

### 13.3 Historia zmian
**Wersja 1.0** (11.09.2025) - pierwsza wersja regulaminu

Archiwum poprzednich wersji dostępne na: https://cenysync.pl/regulamin/historia

---

## 14. POSTANOWIENIA KOŃCOWE

### 14.1 Integralność umowy
1. **Kompletność:** Regulamin wraz z Polityką Prywatności i Polityką Cookies stanowi pełną umowę między stronami
2. **Sprzeczności:** w przypadku konfliktów pierwszeństwo ma Regulamin
3. **Nieważność części:** nieważność pojedynczych postanowień nie wpływa na ważność całości
4. **Zastępowanie:** nieważne postanowienia zastępowane przepisami prawa lub zwyczajami handlowymi

### 14.2 Komunikacja
1. **Forma pisemna:** wszelka komunikacja w sprawach umowy powinna być pisemna
2. **Środki elektroniczne:** email uznawany za formę pisemną
3. **Adresy do doręczeń:**
   - **Usługodawca:** legal@cenysync.pl, ul. Technologiczna 15, 00-001 Warszawa
   - **Użytkownik:** email podany przy rejestracji, adres z danych firmy

4. **Domniemanie doręczenia:**
   - Email: po 24 godzinach od wysłania
   - List polecony: po 7 dniach od nadania
   - Osoba prawna: doręczenie do siedziby lub oddział

### 14.3 Prawa autorskie
**© 2025 CenySync Sp. z o.o.** Wszelkie prawa zastrzeżone.

Niniejszy Regulamin jest objęty ochroną prawa autorskiego. Kopiowanie, dystrybucja lub używanie bez zgody zabronione.

### 14.4 Kontakt
**CenySync Sp. z o.o.**
- **Adres:** ul. Technologiczna 15, 00-001 Warszawa
- **Email:** kontakt@cenysync.pl
- **Telefon:** +48 22 123 45 67
- **NIP:** 1234567890
- **Sprawy prawne:** legal@cenysync.pl
- **Ochrona danych:** dpo@cenysync.pl

---

**NINIEJSZY REGULAMIN WCHODZI W ŻYCIE Z DNIEM 11 WRZEŚNIA 2025 ROKU**

*Regulamin opracowany przez ekspertów prawnych specjalizujących się w prawie nowych technologii, ochronie danych osobowych i compliance w branży nieruchomości. Uwzględnia najnowsze zmiany w prawie polskim i unijnym, ze szczególnym uwzględnieniem ustawy z 21 maja 2025 r. o udostępnianiu danych o cenach mieszkań.*

**Wersja:** 1.0  
**Status:** Obowiązujący  
**Następna planowana rewizja:** 11.09.2026