# 📋 Instrukcja Compliance z Ministerstwem - CenySync

## 🏛️ **Wymagania Prawne**

### Ustawa z dnia 21 maja 2025 r. o udostępnianiu danych o cenach mieszkań

**Obowiązek publikacji danych dotyczy:**
- Deweloperów realizujących inwestycje mieszkaniowe powyżej 10 lokali
- Spółek mieszkaniowych
- Podmiotów prowadzących działalność w zakresie obrotu nieruchomościami

**Termin rozpoczęcia obowiązywania:** 1 stycznia 2026

---

## 📊 **Format XML Schema 1.13**

### Wymagane elementy główne:

```xml
<dane_o_cenach_mieszkan>
    <informacje_podstawowe>
        <data_publikacji/>
        <dostawca_danych/>
        <liczba_inwestycji/>
        <liczba_lokali/>
    </informacje_podstawowe>
    
    <inwestycje>
        <inwestycja>
            <id_inwestycji/>
            <nazwa/>
            <lokalizacja/>
            <pozwolenie_na_budowe/>
            <lokale/>
        </inwestycja>
    </inwestycje>
    
    <metadata>
        <wersja_schematu>1.13</wersja_schematu>
        <certyfikat_cyfrowy/>
    </metadata>
</dane_o_cenach_mieszkan>
```

### Wymagane dane dla każdego lokalu:

1. **Identyfikacja:**
   - `numer_lokalu` - unikalny w ramach inwestycji
   - `typ_lokalu` - mieszkanie/lokal użytkowy/garaż

2. **Powierzchnia:**
   - `powierzchnia_uzytkowa` - w m² z dokładnością do 0.1
   - `powierzchnia_balkonu` - jeśli dotyczy

3. **Cennik:**
   - `cena_za_m2` - cena za metr kwadratowy w PLN
   - `cena_calkowita` - pełna cena lokalu w PLN
   - `waluta` - zawsze "PLN"

4. **Status:**
   - `status_sprzedazy` - dostepny/zarezerwowany/sprzedany
   - `data_pierwszej_publikacji` - data pierwszego ogłoszenia
   - `data_ostatniej_aktualizacji` - data ostatniej zmiany

5. **Lokalizacja:**
   - `pietro` - numer piętra (0 = parter, -1 = piwnica)
   - `liczba_pokoi` - liczba pokoi (bez kuchni i łazienki)

---

## 🔒 **Wymagania Bezpieczeństwa**

### Certyfikat cyfrowy:
```xml
<certyfikat_cyfrowy>
    <wystawca>Ministerstwo Rozwoju i Technologii</wystawca>
    <data_waznosci>2026-12-31</data_waznosci>
    <numer_certyfikatu>CERT-2025-001</numer_certyfikatu>
</certyfikat_cyfrowy>
```

### Szyfrowanie:
- Pliki XML muszą być podpisane cyfrowo
- Transmisja przez HTTPS
- Backup danych przez minimum 5 lat

---

## 📅 **Harmonogram Publikacji**

### Częstotliwość aktualizacji:
- **Minimalnie:** raz na miesiąc
- **Przy zmianach:** w ciągu 7 dni roboczych
- **Nowe inwestycje:** w ciągu 14 dni od pierwszej sprzedaży

### Terminy publikacji:
- **Do 15. każdego miesiąca:** dane za poprzedni miesiąc
- **Do 31 stycznia:** roczne zestawienie za poprzedni rok
- **Natychmiast:** przy istotnych zmianach (>5% ceny)

---

## 🌐 **Publikacja Online**

### Wymagane endpointy:

1. **XML dla ministerstwa:**
   ```
   https://cenysync.pl/api/public/[client_id]/data.xml
   ```

2. **MD dla ludzi:**
   ```
   https://cenysync.pl/api/public/[client_id]/data.md
   ```

3. **Strona prezentacyjna (opcjonalnie):**
   ```
   https://[nazwa-developera].cenysync.pl
   ```

### Wymagania techniczne:
- **Dostępność:** 99.5% uptime
- **Czas odpowiedzi:** <500ms dla XML
- **Encoding:** UTF-8
- **Content-Type:** `application/xml` lub `text/markdown`

---

## ⚖️ **Kary i Sankcje**

### Za niepublikowanie danych:
- **1-30 dni opóźnienia:** ostrzeżenie
- **31-90 dni:** kara 10,000 - 50,000 PLN
- **>90 dni:** kara 50,000 - 200,000 PLN + zakaz sprzedaży

### Za nieprawdziwe dane:
- **Pierwsza weryfikacja:** ostrzeżenie + 30 dni na poprawkę  
- **Druga weryfikacja:** kara 25,000 PLN
- **Trzecia weryfikacja:** kara 100,000 PLN + zakaz na 6 miesięcy

---

## ✅ **Checklist Compliance**

### Przed publikacją sprawdź:

- [ ] **Plik XML:** Walidacja zgodnie z Schema 1.13
- [ ] **Completność:** Wszystkie wymagane pola wypełnione
- [ ] **Aktualność:** Dane nie starsze niż 30 dni
- [ ] **Dokładność:** Ceny zgodne z faktycznymi
- [ ] **Dostępność:** Endpoint odpowiada w <500ms
- [ ] **Certyfikat:** Podpis cyfrowy ważny
- [ ] **Backup:** Kopia danych zabezpieczona
- [ ] **Monitoring:** System alertów działa

### Compliance w CenySync:

✅ **Automatyczne generowanie XML 1.13**  
✅ **Walidacja danych przed publikacją**  
✅ **Monitoring uptime endpointów**  
✅ **Archiwizacja wersji historycznych**  
✅ **Powiadomienia o terminach**  
✅ **Integracja z API ministerstwa**  
✅ **Wsparcie certyfikatów cyfrowych**  

---

## 📞 **Kontakt Ministerstwa**

**Ministerstwo Rozwoju i Technologii**  
Departament Rynku Mieszkaniowego

- **Email:** dane.mieszkania@mrit.gov.pl
- **Telefon:** +48 22 273 60 00
- **Portal:** https://dane.gov.pl/mieszkania
- **Helpdesk:** +48 800 080 080 (pon-pt: 8-16)

**Czas odpowiedzi:**
- Pytania techniczne: 3 dni robocze
- Sprawy prawne: 7 dni roboczych  
- Zgłoszenia błędów: 24 godziny

---

**Status dokumentu:** ✅ Aktualny (wersja 1.13 z 21.08.2025)  
**Ostatnia aktualizacja:** 11.09.2025  
**Następna rewizja:** 31.12.2025