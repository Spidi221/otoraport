# 🧪 RAPORT TESTOWY - Parser "FILTER ON UPLOAD"

## 📋 Informacje

**Data testu:** 03.10.2025
**Parser fix:** Commit c0cbfb60
**Lokalizacja kodu:** `src/lib/smart-csv-parser.ts:1071-1116`
**Testowane pliki:** 4 przykładowe pliki CSV z różnymi scenariuszami

---

## 🎯 Cel testów

Zweryfikować czy parser poprawnie **pomija sprzedane mieszkania** oznaczone markerami "X", "x", lub "#VALUE!" w kolumnach cen (39, 41, 43).

---

## 📁 Pliki testowe

Lokalizacja: `./backup dokumentów real estate app/przykładowe pliki/`

### Test #1: `2025-09-11.csv` (TAMBUD)
- **Rozmiar:** 19K
- **Total rows:** 21 linii (20 mieszkań + header)
- **Sprzedane:** ~3 mieszkania (marker #VALUE!)
- **Oczekiwany wynik:** Parser dodaje **~17 mieszkań** do bazy

**Przykładowa linia sprzedanego mieszkania:**
```
2;X;x;#VALUE! (Function ADD parameter 1 expects number values...)
```

**Przykładowa linia dostępnego mieszkania:**
```
3;11831,88671;1295000;1299000
```

---

### Test #2: `2025-10-02.xlsx - wzorcowy zakres danych.csv`
- **Rozmiar:** 19K
- **Total rows:** 21 linii (20 mieszkań + header)
- **Format:** Excel export (długie linie, 58 kolumn)
- **Sprzedane:** ~1-2 mieszkania (marker "x" w kolumnie 39)
- **Oczekiwany wynik:** Parser dodaje **~18-19 mieszkań** do bazy

**Uwaga:** Ten plik ma wszystkie 58 kolumn ministerstwa w jednej linii.

---

### Test #3: `Ceny-ofertowe-mieszkan-dewelopera-inpro_s__a-2025-10-02.csv` (INPRO)
- **Rozmiar:** 4.0K
- **Total rows:** 4 linie (3 mieszkania + header)
- **Format:** INPRO z dodatkowymi kolumnami (Id nieruchomości, Powierzchnia, Piętro, Liczba pokoi)
- **Sprzedane:** 0 (wszystkie dostępne)
- **Oczekiwany wynik:** Parser dodaje **3 mieszkania** do bazy

**Uwaga:** INPRO używa "X" w innych kolumnach (nie ceny), parser musi to ignorować.

---

### Test #4: `atal - Dane.csv` (ATAL - DUŻY PLIK)
- **Rozmiar:** 3.3M
- **Total rows:** 6110 linii (6109 mieszkań + header)
- **Problem oryginalny:** Parser wrzucał 3600 mieszkań zamiast ~2700
- **Sprzedane:** ~3400 mieszkań (user wspomniał że około 57% sprzedanych)
- **Oczekiwany wynik:** Parser dodaje **~2700 mieszkań** do bazy

**To jest główny test case!** Ten plik ujawnił bug w parserze.

---

## ✅ Instrukcje testowania

### Przygotowanie:
1. Uruchom dev server: `npm run dev`
2. Zaloguj się do dashboardu: http://localhost:3000/dashboard
3. **Wyczyść bazę properties** (opcjonalne, jeśli chcesz czysty test):
   ```sql
   DELETE FROM properties WHERE developer_id = (
     SELECT id FROM developers WHERE user_id = auth.uid()
   );
   ```

### Test każdego pliku:
1. **Upload plik** przez dashboard (Drag & drop lub click upload)
2. **Sprawdź logi** w terminalu gdzie działa `npm run dev`:
   - Szukaj: `🚫 PARSER: Skipping sold property at row X`
   - Policz ile razy się pojawia (to liczba pominiętych)
3. **Sprawdź dashboard** - liczba mieszkań w tabeli
4. **Zapisz wyniki** w sekcji "Rezultaty testów" poniżej

### Weryfikacja CSV endpoint:
Po wrzuceniu wszystkich plików:
```bash
# Pobierz CSV z endpoint
curl http://localhost:3000/api/public/YOUR_CLIENT_ID/data.csv > test_output.csv

# Sprawdź czy są jakieś "X" w cenach (kolumny 39, 41, 43)
# Nie powinno być ŻADNYCH
grep ";X;" test_output.csv | head -5
```

Jeśli grep zwróci jakieś linie - **TEST FAILED** (parser nie pominął sprzedanych)

---

## 📊 Rezultaty testów

### Test #1: 2025-09-11.csv
- [ ] Plik wrzucony
- **Logi parsera:**
  - Liczba wierszy przetworzonych: ___
  - Liczba pominiętych (`🚫 Skipping`): ___
- **Dashboard:**
  - Liczba mieszkań dodanych: ___
- **Oczekiwano:** ~17 mieszkań
- **Status:** ✅ PASS / ❌ FAIL
- **Notatki:**

---

### Test #2: 2025-10-02 wzorcowy
- [ ] Plik wrzucony
- **Logi parsera:**
  - Liczba wierszy przetworzonych: ___
  - Liczba pominiętych: ___
- **Dashboard:**
  - Liczba mieszkań dodanych: ___
- **Oczekiwano:** ~18-19 mieszkań
- **Status:** ✅ PASS / ❌ FAIL
- **Notatki:**

---

### Test #3: INPRO CSV
- [ ] Plik wrzucony
- **Logi parsera:**
  - Liczba wierszy przetworzonych: ___
  - Liczba pominiętych: ___
- **Dashboard:**
  - Liczba mieszkań dodanych: ___
- **Oczekiwano:** 3 mieszkania (wszystkie available)
- **Status:** ✅ PASS / ❌ FAIL
- **Notatki:**

---

### Test #4: ATAL CSV (CRITICAL)
- [ ] Plik wrzucony
- **Logi parsera:**
  - Liczba wierszy przetworzonych: ___
  - Liczba pominiętych (`🚫 Skipping`): ___
- **Dashboard:**
  - Liczba mieszkań dodanych: ___
- **Oczekiwano:** ~2700 mieszkań (NIE 3600!)
- **Status:** ✅ PASS / ❌ FAIL
- **Notatki:**

---

### Weryfikacja CSV Endpoint
- [ ] CSV endpoint sprawdzony
- **Komenda:**
  ```bash
  curl http://localhost:3000/api/public/YOUR_CLIENT_ID/data.csv | grep ";X;" | wc -l
  ```
- **Wynik:** ___ (powinno być 0)
- **Status:** ✅ PASS (0 X markers) / ❌ FAIL (znaleziono X)
- **Notatki:**

---

## 🐛 Znalezione problemy

### Problem #1:
**Opis:**
**Plik:**
**Oczekiwane zachowanie:**
**Faktyczne zachowanie:**
**Priorytet:** 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low

---

## ✅ Wnioski końcowe

**Czy parser działa poprawnie?**
- [ ] ✅ TAK - wszystkie testy PASS
- [ ] ❌ NIE - (opisz problemy w sekcji "Znalezione problemy")

**Czy ministerstwo compliance jest zachowane?**
- [ ] ✅ TAK - CSV endpoint nie zawiera "X" markers
- [ ] ❌ NIE - CSV endpoint zawiera sprzedane mieszkania

**Czy fix jest gotowy do produkcji?**
- [ ] ✅ TAK - można deployować
- [ ] ❌ NIE - wymagane dalsze poprawki

---

**Osoba testująca:**
**Data:**
**Czas trwania testów:**
**Dodatkowe uwagi:**
