# Przewodnik: Przesyłanie plików Excel do OTORAPORT

## Obsługiwane formaty

OTORAPORT obsługuje teraz następujące formaty plików:

✅ **CSV** - Pliki tekstowe z wartościami oddzielonymi przecinkami
✅ **XLSX** - Excel 2007 i nowsze (zalecane)
✅ **XLS** - Excel 97-2003 (starsze wersje)

---

## Szybki start

### Krok 1: Przygotuj plik Excel

Twój plik Excel powinien zawierać:
- **Pierwszy wiersz:** Nagłówki kolumn (nazwy pól)
- **Kolejne wiersze:** Dane mieszkań (jedno mieszkanie = jeden wiersz)

Przykład:

| Nr lokalu | Powierzchnia | Cena za m² | Cena całkowita | Status |
|-----------|--------------|------------|----------------|--------|
| M1.1 | 45.5 | 12500 | 568750 | Dostępne |
| M1.2 | 62.3 | 13000 | 809900 | Zarezerwowane |

### Krok 2: Prześlij plik

1. Zaloguj się do OTORAPORT
2. Przejdź do **Dashboard**
3. Znajdź widget **"Upload Cennika"**
4. Przeciągnij plik Excel lub kliknij **"Wybierz plik"**
5. Poczekaj 1-2 minuty na przetworzenie

### Krok 3: Sprawdź wyniki

Po przesłaniu zobaczysz:
- ✅ **Sukces** - Plik przetworzony pomyślnie
- 📊 **Rekordy** - Ile mieszkań znaleziono
- ✅ **Poprawne** - Ile rekordów jest kompletnych
- ❌ **Błędy** - Ile rekordów wymaga poprawy

---

## Nazwy kolumn (nagłówki)

OTORAPORT automatycznie rozpoznaje różne nazwy kolumn. Możesz używać nazw po polsku lub angielsku.

### Podstawowe pola (wymagane)

| Co system szuka | Twoje kolumny mogą się nazywać |
|-----------------|--------------------------------|
| **Numer lokalu** | "Nr lokalu", "Numer mieszkania", "Lokal", "Property Number" |
| **Powierzchnia** | "Powierzchnia", "Metraż", "Area", "m²", "m2" |
| **Cena za m²** | "Cena za m2", "Cena/m²", "Price per m2" |
| **Cena całkowita** | "Cena", "Cena całkowita", "Total Price" |

### Lokalizacja (wymagana przez ministerstwo)

| Pole ministerstwa | Twoje kolumny |
|-------------------|---------------|
| **Województwo** | "Województwo", "Woj.", "Region" |
| **Powiat** | "Powiat", "County" |
| **Gmina** | "Gmina", "Municipality" |
| **Miejscowość** | "Miasto", "Miejscowość", "City" |
| **Ulica** | "Ulica", "Ul.", "Street" |

### Dodatkowe pola (opcjonalne)

- **Liczba pokoi:** "Pokoje", "Liczba pokoi", "Rooms"
- **Piętro:** "Piętro", "Kondygnacja", "Floor"
- **Balkon:** "Balkon", "Powierzchnia balkonu"
- **Status:** "Status", "Dostępność", "Availability"
- **Parking:** "Parking", "Miejsce parkingowe"

---

## Format danych

### Liczby

System akceptuje różne formaty liczbowe:

✅ **Poprawne formaty:**
- `12500` - bez separatorów
- `12 500` - spacja jako separator tysięcy
- `12500.00` - kropka jako separator dziesiętny
- `12 500,00` - polski format (spacja + przecinek)
- `12,500.00` - angielski format

❌ **Unikaj:**
- Walut w kolumnie z ceną: `12500 PLN` ❌ (powinno być `12500`)
- Tekstu: `dwanaście tysięcy` ❌ (powinno być `12000`)

### Daty

Preferowane formaty dat:

✅ `2025-01-15` - format ISO (najlepszy)
✅ `15.01.2025` - polski format
✅ `01/15/2025` - amerykański format

### Status mieszkania

Rozpoznawane wartości:
- `Dostępne`, `Wolne`, `Available` → Dostępne
- `Zarezerwowane`, `Reserved` → Zarezerwowane
- `Sprzedane`, `Sold` → Sprzedane

---

## Polskie znaki

System w pełni obsługuje polskie znaki diakrytyczne:

✅ **Obsługiwane znaki:**
- Małe litery: ą, ć, ę, ł, ń, ó, ś, ź, ż
- Wielkie litery: Ą, Ć, Ę, Ł, Ń, Ó, Ś, Ź, Ż

✅ **Przykładowe nazwy:**
- "Powierzchnia użytkowa"
- "Cena za m²"
- "Województwo małopolskie"
- "Kraków"
- "Dostępność"

**Kodowanie:** System automatycznie wykrywa kodowanie (UTF-8, Windows-1250, ISO-8859-2).

---

## Wiele arkuszy

Jeśli Twój plik Excel ma wiele arkuszy:

🔷 **Obecnie:** System przetwarza **pierwszy arkusz** automatycznie
📋 **Zalecenie:** Umieść dane mieszkań w pierwszym arkuszu
🚀 **Przyszłość:** Możliwość wyboru arkusza zostanie dodana

---

## Puste komórki i brakujące dane

### Co robi system:

✅ **Oblicza brakujące wartości:**
```
Jeśli brakuje powierzchni:
Powierzchnia = Cena całkowita ÷ Cena za m²

Jeśli brakuje ceny za m²:
Cena za m² = Cena całkowita ÷ Powierzchnia

Jeśli brakuje ceny całkowitej:
Cena całkowita = Powierzchnia × Cena za m²
```

⚠️ **Pomija wiersze:**
- Całkowicie puste wiersze
- Wiersze z mniej niż 50% wypełnionych kolumn

---

## Typowe problemy i rozwiązania

### Problem: "Unsupported file format"

**Przyczyna:** Niewłaściwe rozszerzenie pliku lub uszkodzony plik

**Rozwiązanie:**
1. Sprawdź rozszerzenie: `.xlsx`, `.xls`, lub `.csv`
2. Otwórz w Excel i zapisz ponownie jako "Excel Workbook (.xlsx)"
3. Usuń hasło z pliku (jeśli jest chroniony)

### Problem: "Failed to parse file"

**Przyczyna:** Uszkodzony plik Excel lub niestandadowy format

**Rozwiązanie:**
1. Otwórz w Excel
2. Zapisz jako → "Excel Workbook (.xlsx)"
3. NIE używaj "Excel Binary Workbook (.xlsb)"
4. Spróbuj usunąć makra (Save without macros)

### Problem: Polskie znaki się "psują"

**Przyczyna:** Nieprawidłowe kodowanie pliku

**Rozwiązanie:**
1. Otwórz w Excel (nie w Notatniku)
2. File → Save As
3. Wybierz format: "Excel Workbook (.xlsx)"
4. System automatycznie wykryje poprawne kodowanie

### Problem: Wiele mieszkań ma status "błąd"

**Przyczyna:** Brakujące wymagane pola (województwo, powiat, gmina)

**Rozwiązanie:**
1. Dodaj kolumny: "Województwo", "Powiat", "Gmina"
2. Wypełnij dla wszystkich mieszkań
3. Prześlij plik ponownie

### Problem: System nie rozpoznaje moich kolumn

**Przyczyna:** Nietypowe nazwy kolumn

**Rozwiązanie:**
Zmień nazwy na standardowe:

| Zmień | Na |
|-------|-----|
| "Nieruchomość" | "Nr lokalu" |
| "M²" | "Powierzchnia" |
| "Koszt m²" | "Cena za m2" |
| "Wartość" | "Cena całkowita" |

---

## Najlepsze praktyki

### ✅ DO (Zalecane)

1. **Używaj pierwszego wiersza na nagłówki**
   ```
   ✅ Wiersz 1: Nr lokalu | Powierzchnia | Cena
   ✅ Wiersz 2: M1.1 | 45.5 | 568750
   ```

2. **Konsekwentne formatowanie liczb**
   - Wszystkie ceny w tym samym formacie
   - Wszystkie powierzchnie z tym samym separatorem

3. **Pełne nazwy województw**
   ```
   ✅ "mazowieckie" (poprawne)
   ❌ "maz" (niepoprawne)
   ❌ "MAZ" (niepoprawne)
   ```

4. **Jeden arkusz z danymi**
   - Proste i szybkie
   - Unikaj wielu arkuszy jeśli nie są potrzebne

5. **Testuj na małej próbce**
   - Prześlij 3-5 mieszkań najpierw
   - Sprawdź czy wszystko się zgadza
   - Potem prześlij cały cennik

### ❌ DON'T (Unikaj)

1. **Komórki scalone**
   ```
   ❌ Scalanie nagłówków
   ❌ Scalanie wielu wierszy
   ```

2. **Formaty niestandardowe**
   - Nie używaj makr
   - Nie używaj chronionych arkuszy
   - Nie używaj zewnętrznych linków

3. **Bardzo szerokie tabele**
   - Zbyt wiele kolumn (>100) spowalnia przetwarzanie

4. **Formatowanie warunkowe**
   - System ignoruje kolory
   - System ignoruje formatowanie

---

## Zgodność z Ministerstwem

OTORAPORT automatycznie mapuje Twoje dane na format wymagany przez Ministerstwo.

### 58 pól ministerstwa - obsługiwane w pełni

System rozpoznaje i przetwarza wszystkie pola wymagane przez schemat XML 1.13:

✅ Dane podstawowe (14 pól)
✅ Lokalizacja (7 pól)
✅ Ceny i powierzchnie (12 pól)
✅ Daty i statusy (8 pól)
✅ Parking i komórki (6 pól)
✅ Budynek i wykończenie (11 pól)

**Nie musisz znać wszystkich 58 pól!** System uzupełni brakujące pola wartościami domyślnymi.

---

## Przykładowe pliki

### Szablon 1: Podstawowy cennik
```excel
Nr lokalu | Powierzchnia | Cena za m2 | Cena | Status | Województwo | Powiat | Gmina
M1.1      | 45.5         | 12500      | 568750 | Dostępne | mazowieckie | Warszawa | Warszawa
M1.2      | 62.3         | 13000      | 809900 | Dostępne | mazowieckie | Warszawa | Warszawa
```

### Szablon 2: Rozszerzony cennik
```excel
Nr lokalu | Powierzchnia | Pokoje | Piętro | Balkon | Cena za m2 | Cena | Status
M1.1      | 45.5         | 2      | 1      | 5.5    | 12500      | 568750 | Dostępne
M2.1      | 62.3         | 3      | 2      | 8.2    | 13000      | 809900 | Dostępne
```

### Szablon 3: Format ministerstwa
```excel
Nr lokalu nadany przez dewelopera | Cena m2 [zł] | Cena lokalu [zł] | Województwo | Powiat | Gmina
M1.1 | 12500.00 | 568750.00 | mazowieckie | Warszawa | Warszawa
M1.2 | 13000.00 | 809900.00 | mazowieckie | Warszawa | Warszawa
```

**Wszystkie 3 szablony działają!** System automatycznie wykryje format.

---

## Wsparcie techniczne

Jeśli napotkasz problemy:

1. **Sprawdź raport z przesyłania**
   - Liczba rekordów: ile wierszy system znalazł
   - Poprawne: ile rekordów jest kompletnych
   - Błędy: lista problemów do naprawienia

2. **Zapisz plik ponownie**
   - Często rozwiązuje problemy z kodowaniem

3. **Upewnij się że masz nagłówki**
   - Pierwszy wiersz = nazwy kolumn

4. **Testuj małe pliki**
   - 3-5 mieszkań → przesyłasz → sprawdzasz wynik

---

**Wersja:** 1.0
**Data:** 2025-10-01
**System:** OTORAPORT - Automatyzacja raportowania cen mieszkań
