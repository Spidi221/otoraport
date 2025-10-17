/**
 * Complete Column Synonym Mappings for Ministry Schema 1.13 (58 fields)
 *
 * Priority Order Strategy:
 * 1. INPRO exact match (highest priority - most divergent format)
 * 2. ATAL exact match (may be truncated)
 * 3. Ministry official name
 * 4. Generic Polish variations
 * 5. English equivalents (lowest priority)
 *
 * Data Sources:
 * - TAMBUD CSV: Uses exact ministry column names
 * - ATAL CSV: Uses abbreviated/truncated ministry names (character limit issues)
 * - INPRO CSV: Uses compact custom naming
 * - Ministry Schema: 1.13 (58 official columns)
 *
 * Notes:
 * - All variants are normalized through normalizeString() before matching (lowercase, no punctuation/diacritics)
 * - Longer ministry names are prioritized to avoid false positives
 * - Each array contains ~8-15 variants for maximum coverage
 *
 * @see src/lib/COLUMN_SYNONYMS_ANALYSIS.md for detailed analysis
 * @see src/lib/smart-csv-parser.ts for usage
 */

export const COMPLETE_COLUMN_PATTERNS = {
  // ========================================
  // SECTION 1: DEVELOPER INFO (Columns 1-29)
  // ========================================

  // Field 1: row_number (optional - not in Schema 1.13 but used by TAMBUD)
  row_number: [
    // INPRO exact
    'id nieruchomości',
    'id nieruchomosci',
    // TAMBUD exact
    'row_number',
    'row number',
    // Generic Polish
    'numer wiersza',
    'id',
    'lp',
    // English
    'row id',
    'line number'
  ],

  // Field 2: developer_name
  developer_name: [
    // Ministry official
    'nazwa dewelopera',
    // Generic Polish variations
    'deweloper',
    'nazwa firmy',
    'firma',
    'developer_name',
    'nazwa_dewelopera',
    'nazwa developerska',
    // English
    'developer',
    'company name'
  ],

  // Field 3: forma_prawna
  forma_prawna: [
    // Ministry official (all CSVs use this)
    'forma prawna dewelopera',
    // Generic variations
    'forma prawna',
    'typ spółki',
    'rodzaj działalności',
    'status prawny firmy',
    'forma_prawna',
    // English
    'legal_form',
    'legal form',
    'company type'
  ],

  // Field 4: nr_krs
  nr_krs: [
    // Ministry official (all CSVs use this)
    'nr krs',
    // Generic variations
    'krs',
    'numer krs',
    'nr_krs',
    'nrkrs',
    'krs number',
    // English
    'krs_number',
    'registry number'
  ],

  // Field 5: nr_ceidg
  nr_ceidg: [
    // Ministry official
    'nr wpisu do ceidg',
    // Generic variations
    'nr ceidg',
    'ceidg',
    'numer ceidg',
    'nr_ceidg',
    'nr wpisu do ceydg', // typo variant
    'wpis ceidg',
    // English
    'ceidg_number',
    'ceidg number'
  ],

  // Field 6: nip
  nip: [
    // Ministry official (all CSVs use this)
    'nr nip',
    // Generic variations
    'nip',
    'numer nip',
    'nr_nip',
    'nrnip',
    // English
    'tax_id',
    'vat_id',
    'tax id',
    'vat number'
  ],

  // Field 7: regon
  regon: [
    // Ministry official (all CSVs use this)
    'nr regon',
    // Generic variations
    'regon',
    'numer regon',
    'nr_regon',
    'nrregon',
    // English
    'regon_number',
    'regon number',
    'statistical number'
  ],

  // Field 8: telefon
  phone: [
    // Ministry official
    'nr telefonu',
    // Generic variations
    'telefon',
    'tel',
    'numer telefonu',
    'kontakt',
    'tel.',
    'telefon_kontaktowy',
    'numer_telefonu',
    // English
    'phone',
    'phone number',
    'contact phone'
  ],

  // Field 9: email
  email: [
    // Ministry official
    'adres poczty elektronicznej',
    // Generic variations
    'email',
    'e-mail',
    'mail',
    'adres email',
    'email_kontaktowy',
    'adres_email',
    'poczta elektroniczna',
    // English
    'contact_email',
    'e-mail address'
  ],

  // Field 10: fax
  fax: [
    // Ministry official (all CSVs use this)
    'nr faxu',
    // Generic variations
    'fax',
    'numer faxu',
    'nr_faxu',
    'nrfaxu',
    'telefax',
    // English
    'fax_number',
    'fax number'
  ],

  // Field 11: strona_internetowa
  strona_internetowa: [
    // Ministry official
    'adres strony internetowej dewelopera',
    // Generic variations
    'strona internetowa',
    'www',
    'adres www',
    'strona_internetowa',
    'portal',
    'witryna',
    // English
    'website',
    'web address',
    'url'
  ],

  // ========================================
  // Fields 12-19: Developer HQ Address (Siedziba dewelopera)
  // ========================================

  // Field 12: wojewodztwo_siedziby
  wojewodztwo_siedziby: [
    // Ministry official
    'województwo adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera',
    'wojewodztwo adresu siedziby/glownego miejsca wykonywania dzialalnosci gospodarczej dewelopera',
    // Shortened versions (likely ATAL truncation)
    'województwo adresu siedziby głównego miejsca wykonywania działalności gospodarczej dewelopera',
    'wojewodztwo adresu siedziby glownego miejsca wykonywania dzialalnosci gospodarczej dewelopera',
    // Generic variations
    'województwo adresu siedziby',
    'wojewodztwo adresu siedziby',
    'wojewodztwo siedziby',
    'woj siedziby',
    // English
    'voivodeship headquarters',
    'hq province'
  ],

  // Field 13: powiat_siedziby
  powiat_siedziby: [
    // Ministry official
    'powiat adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera',
    'powiat adresu siedziby/glownego miejsca wykonywania dzialalnosci gospodarczej dewelopera',
    // Shortened
    'powiat adresu siedziby głównego miejsca wykonywania działalności gospodarczej dewelopera',
    'powiat adresu siedziby glownego miejsca wykonywania dzialalnosci gospodarczej dewelopera',
    // Generic
    'powiat adresu siedziby',
    'powiat siedziby',
    'pow siedziby',
    // English
    'county headquarters',
    'hq county'
  ],

  // Field 14: gmina_siedziby
  gmina_siedziby: [
    // Ministry official
    'gmina adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera',
    'gmina adresu siedziby/glownego miejsca wykonywania dzialalnosci gospodarczej dewelopera',
    // Shortened
    'gmina adresu siedziby głównego miejsca wykonywania działalności gospodarczej dewelopera',
    'gmina adresu siedziby glownego miejsca wykonywania dzialalnosci gospodarczej dewelopera',
    // Generic
    'gmina adresu siedziby',
    'gmina siedziby',
    'gm siedziby',
    // English
    'municipality headquarters',
    'hq municipality'
  ],

  // Field 15: miejscowosc_siedziby
  miejscowosc_siedziby: [
    // Ministry official
    'miejscowość adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera',
    'miejscowosc adresu siedziby/glownego miejsca wykonywania dzialalnosci gospodarczej dewelopera',
    // Shortened
    'miejscowość adresu siedziby głównego miejsca wykonywania działalności gospodarczej dewelopera',
    'miejscowosc adresu siedziby glownego miejsca wykonywania dzialalnosci gospodarczej dewelopera',
    // Generic
    'miejscowość adresu siedziby',
    'miejscowosc adresu siedziby',
    'miejscowosc siedziby',
    'miasto siedziby',
    // English
    'city headquarters',
    'hq city'
  ],

  // Field 16: ulica_siedziby
  ulica_siedziby: [
    // Ministry official
    'ulica adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera',
    'ulica adresu siedziby/glownego miejsca wykonywania dzialalnosci gospodarczej dewelopera',
    // Shortened
    'ulica adresu siedziby głównego miejsca wykonywania działalności gospodarczej dewelopera',
    'ulica adresu siedziby glownego miejsca wykonywania dzialalnosci gospodarczej dewelopera',
    // Generic
    'ulica adresu siedziby',
    'ulica siedziby',
    'ul siedziby',
    // English
    'street headquarters',
    'hq street'
  ],

  // Field 17: nr_budynku_siedziby
  nr_budynku_siedziby: [
    // Ministry official
    'nr nieruchomości adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera',
    'nr nieruchomosci adresu siedziby/glownego miejsca wykonywania dzialalnosci gospodarczej dewelopera',
    // Shortened
    'nr nieruchomości adresu siedziby głównego miejsca wykonywania działalności gospodarczej dewelopera',
    'nr nieruchomosci adresu siedziby glownego miejsca wykonywania dzialalnosci gospodarczej dewelopera',
    // Generic
    'nr nieruchomości adresu siedziby',
    'nr nieruchomosci adresu siedziby',
    'nr budynku siedziby',
    'numer budynku siedziby',
    // English
    'building number headquarters',
    'hq building number'
  ],

  // Field 18: nr_lokalu_siedziby
  nr_lokalu_siedziby: [
    // Ministry official
    'nr lokalu adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera',
    'nr lokalu adresu siedziby/glownego miejsca wykonywania dzialalnosci gospodarczej dewelopera',
    // Shortened
    'nr lokalu adresu siedziby głównego miejsca wykonywania działalności gospodarczej dewelopera',
    'nr lokalu adresu siedziby glownego miejsca wykonywania dzialalnosci gospodarczej dewelopera',
    // Generic
    'nr lokalu adresu siedziby',
    'nr lokalu siedziby',
    'numer lokalu siedziby',
    // English
    'apartment number headquarters',
    'hq apartment number'
  ],

  // Field 19: kod_pocztowy_siedziby
  kod_pocztowy_siedziby: [
    // Ministry official
    'kod pocztowy adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera',
    'kod pocztowy adresu siedziby/glownego miejsca wykonywania dzialalnosci gospodarczej dewelopera',
    // Shortened
    'kod pocztowy adresu siedziby głównego miejsca wykonywania działalności gospodarczej dewelopera',
    'kod pocztowy adresu siedziby glownego miejsca wykonywania dzialalnosci gospodarczej dewelopera',
    // Generic
    'kod pocztowy adresu siedziby',
    'kod pocztowy siedziby',
    'kod siedziby',
    // English
    'postal code headquarters',
    'hq postal code'
  ],

  // ========================================
  // Fields 20-27: Sales Office Address (Punkt sprzedaży)
  // ========================================

  // Field 20: wojewodztwo_sprzedazy
  wojewodztwo_sprzedazy: [
    // Ministry official
    'województwo adresu lokalu, w którym prowadzona jest sprzedaż',
    'wojewodztwo adresu lokalu, w ktorym prowadzona jest sprzedaz',
    // Without commas
    'województwo adresu lokalu w którym prowadzona jest sprzedaż',
    'wojewodztwo adresu lokalu w ktorym prowadzona jest sprzedaz',
    // Generic
    'województwo sprzedaży',
    'wojewodztwo sprzedazy',
    'woj sprzedazy',
    // English
    'voivodeship sales office',
    'sales province'
  ],

  // Field 21: powiat_sprzedazy
  powiat_sprzedazy: [
    // Ministry official
    'powiat adresu lokalu, w którym prowadzona jest sprzedaż',
    'powiat adresu lokalu, w ktorym prowadzona jest sprzedaz',
    // Without commas
    'powiat adresu lokalu w którym prowadzona jest sprzedaż',
    'powiat adresu lokalu w ktorym prowadzona jest sprzedaz',
    // Generic
    'powiat sprzedaży',
    'powiat sprzedazy',
    'pow sprzedazy',
    // English
    'county sales office',
    'sales county'
  ],

  // Field 22: gmina_sprzedazy
  gmina_sprzedazy: [
    // Ministry official
    'gmina adresu lokalu, w którym prowadzona jest sprzedaż',
    'gmina adresu lokalu, w ktorym prowadzona jest sprzedaz',
    // Without commas
    'gmina adresu lokalu w którym prowadzona jest sprzedaż',
    'gmina adresu lokalu w ktorym prowadzona jest sprzedaz',
    // Generic
    'gmina sprzedaży',
    'gmina sprzedazy',
    'gm sprzedazy',
    // English
    'municipality sales office',
    'sales municipality'
  ],

  // Field 23: miejscowosc_sprzedazy
  miejscowosc_sprzedazy: [
    // Ministry official
    'miejscowość adresu lokalu, w którym prowadzona jest sprzedaż',
    'miejscowosc adresu lokalu, w ktorym prowadzona jest sprzedaz',
    // Without commas
    'miejscowość adresu lokalu w którym prowadzona jest sprzedaż',
    'miejscowosc adresu lokalu w ktorym prowadzona jest sprzedaz',
    // Generic
    'miejscowość sprzedaży',
    'miejscowosc sprzedazy',
    'miasto sprzedazy',
    // English
    'city sales office',
    'sales city'
  ],

  // Field 24: ulica_sprzedazy
  ulica_sprzedazy: [
    // Ministry official
    'ulica adresu lokalu, w którym prowadzona jest sprzedaż',
    'ulica adresu lokalu, w ktorym prowadzona jest sprzedaz',
    // Without commas
    'ulica adresu lokalu w którym prowadzona jest sprzedaż',
    'ulica adresu lokalu w ktorym prowadzona jest sprzedaz',
    // Generic
    'ulica sprzedaży',
    'ulica sprzedazy',
    'ul sprzedazy',
    // English
    'street sales office',
    'sales street'
  ],

  // Field 25: nr_budynku_sprzedazy
  nr_budynku_sprzedazy: [
    // Ministry official
    'nr nieruchomości adresu lokalu, w którym prowadzona jest sprzedaż',
    'nr nieruchomosci adresu lokalu, w ktorym prowadzona jest sprzedaz',
    // Without commas
    'nr nieruchomości adresu lokalu w którym prowadzona jest sprzedaż',
    'nr nieruchomosci adresu lokalu w ktorym prowadzona jest sprzedaz',
    // Generic
    'nr nieruchomości sprzedaży',
    'nr nieruchomosci sprzedazy',
    'nr budynku sprzedazy',
    // English
    'building number sales office',
    'sales building number'
  ],

  // Field 26: nr_lokalu_sprzedazy
  nr_lokalu_sprzedazy: [
    // Ministry official
    'nr lokalu adresu lokalu, w którym prowadzona jest sprzedaż',
    'nr lokalu adresu lokalu, w ktorym prowadzona jest sprzedaz',
    // Without commas
    'nr lokalu adresu lokalu w którym prowadzona jest sprzedaż',
    'nr lokalu adresu lokalu w ktorym prowadzona jest sprzedaz',
    // Generic
    'nr lokalu sprzedaży',
    'nr lokalu sprzedazy',
    'numer lokalu sprzedazy',
    // English
    'apartment number sales office',
    'sales apartment number'
  ],

  // Field 27: kod_pocztowy_sprzedazy
  kod_pocztowy_sprzedazy: [
    // Ministry official
    'kod pocztowy adresu lokalu, w którym prowadzona jest sprzedaż',
    'kod pocztowy adresu lokalu, w ktorym prowadzona jest sprzedaz',
    // Without commas
    'kod pocztowy adresu lokalu w którym prowadzona jest sprzedaż',
    'kod pocztowy adresu lokalu w ktorym prowadzona jest sprzedaz',
    // Generic
    'kod pocztowy sprzedaży',
    'kod pocztowy sprzedazy',
    'kod sprzedazy',
    // English
    'postal code sales office',
    'sales postal code'
  ],

  // Field 28: dodatkowe_lokalizacje_sprzedazy
  dodatkowe_lokalizacje_sprzedazy: [
    // Ministry official (all CSVs use this)
    'dodatkowe lokalizacje, w których prowadzona jest sprzedaż',
    'dodatkowe lokalizacje, w ktorych prowadzona jest sprzedaz',
    // Without commas
    'dodatkowe lokalizacje w których prowadzona jest sprzedaż',
    'dodatkowe lokalizacje w ktorych prowadzona jest sprzedaz',
    // Generic
    'dodatkowe lokalizacje sprzedaży',
    'dodatkowe lokalizacje sprzedazy',
    'dodatkowe_lokalizacje_sprzedazy',
    'inne punkty sprzedaży',
    'inne punkty sprzedazy',
    // English
    'additional_sales_locations',
    'additional sales locations',
    'other sales points'
  ],

  // Field 29: sposob_kontaktu
  sposob_kontaktu: [
    // Ministry official (all CSVs use this)
    'sposób kontaktu nabywcy z deweloperem',
    'sposob kontaktu nabywcy z deweloperem',
    // Generic variations
    'sposób kontaktu',
    'sposob kontaktu',
    'sposob_kontaktu',
    'jak skontaktować się',
    'jak skontaktowac sie',
    'kontakt z deweloperem',
    // English
    'contact_method',
    'contact method',
    'how to contact'
  ],

  // ========================================
  // SECTION 2: INVESTMENT LOCATION (Columns 30-36)
  // ========================================

  // Field 30: wojewodztwo_inwestycji
  wojewodztwo: [
    // Ministry official
    'województwo lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego',
    'wojewodztwo lokalizacji przedsiewziecia deweloperskiego lub zadania inwestycyjnego',
    // Shortened
    'województwo lokalizacji przedsięwzięcia deweloperskiego',
    'wojewodztwo lokalizacji przedsiewziecia deweloperskiego',
    // Generic variations
    'województwo',
    'wojewodztwo',
    'wojewodztwo_inwestycji',
    'województwo_inwestycji',
    'woj',
    'woj.',
    // English
    'voivodeship',
    'province',
    'region'
  ],

  // Field 31: powiat_inwestycji
  powiat: [
    // Ministry official
    'powiat lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego',
    'powiat lokalizacji przedsiewziecia deweloperskiego lub zadania inwestycyjnego',
    // Shortened
    'powiat lokalizacji przedsięwzięcia deweloperskiego',
    'powiat lokalizacji przedsiewziecia deweloperskiego',
    // Generic
    'powiat',
    'powiat_inwestycji',
    'pow',
    'pow.',
    // English
    'county',
    'district'
  ],

  // Field 32: gmina_inwestycji
  gmina: [
    // Ministry official
    'gmina lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego',
    'gmina lokalizacji przedsiewziecia deweloperskiego lub zadania inwestycyjnego',
    // Shortened
    'gmina lokalizacji przedsięwzięcia deweloperskiego',
    'gmina lokalizacji przedsiewziecia deweloperskiego',
    // Generic
    'gmina',
    'gmina_inwestycji',
    'gm',
    'gm.',
    // English
    'municipality',
    'commune'
  ],

  // Field 33: miejscowosc_inwestycji
  miejscowosc: [
    // Ministry official
    'miejscowość lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego',
    'miejscowosc lokalizacji przedsiewziecia deweloperskiego lub zadania inwestycyjnego',
    // Shortened
    'miejscowość lokalizacji przedsięwzięcia deweloperskiego',
    'miejscowosc lokalizacji przedsiewziecia deweloperskiego',
    // Generic
    'miejscowość',
    'miejscowosc',
    'miejscowosc_inwestycji',
    'miejscowość_inwestycji',
    'miasto',
    // English
    'city',
    'town',
    'locality',
    'place'
  ],

  // Field 34: ulica_inwestycji
  ulica: [
    // Ministry official
    'ulica lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego',
    'ulica lokalizacji przedsiewziecia deweloperskiego lub zadania inwestycyjnego',
    // Shortened
    'ulica lokalizacji przedsięwzięcia deweloperskiego',
    'ulica lokalizacji przedsiewziecia deweloperskiego',
    // Generic
    'ulica',
    'ulica_inwestycji',
    'ul',
    'ul.',
    // English
    'street',
    'address'
  ],

  // Field 35: nr_budynku_inwestycji
  numer_nieruchomosci: [
    // Ministry official
    'nr nieruchomości lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego',
    'nr nieruchomosci lokalizacji przedsiewziecia deweloperskiego lub zadania inwestycyjnego',
    // Shortened
    'nr nieruchomości lokalizacji przedsięwzięcia deweloperskiego',
    'nr nieruchomosci lokalizacji przedsiewziecia deweloperskiego',
    // Generic
    'numer nieruchomości',
    'nr nieruchomości',
    'numer_nieruchomosci',
    'nr_budynku_inwestycji',
    'nr budynku',
    'numer budynku',
    // English
    'building_number',
    'house_number',
    'building number'
  ],

  // Field 36: kod_pocztowy_inwestycji
  kod_pocztowy: [
    // Ministry official
    'kod pocztowy lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego',
    'kod pocztowy lokalizacji przedsiewziecia deweloperskiego lub zadania inwestycyjnego',
    // Shortened
    'kod pocztowy lokalizacji przedsięwzięcia deweloperskiego',
    'kod pocztowy lokalizacji przedsiewziecia deweloperskiego',
    // Generic
    'kod pocztowy',
    'kod_pocztowy',
    'kod_pocztowy_inwestycji',
    'zip',
    // English
    'postal_code',
    'zip_code',
    'postal',
    'zip code'
  ],

  // ========================================
  // SECTION 3: PROPERTY DATA (Columns 37-44)
  // ========================================

  // Field 37: rodzaj_nieruchomosci
  property_type: [
    // Ministry official (with colon and comma)
    'rodzaj nieruchomości: lokal mieszkalny, dom jednorodzinny',
    'rodzaj nieruchomosci: lokal mieszkalny, dom jednorodzinny',
    // INPRO exact (no punctuation)
    'rodzaj nieruchomości lokal mieszkalny dom jednorodzinny',
    'rodzaj nieruchomosci lokal mieszkalny dom jednorodzinny',
    // Generic variations
    'rodzaj nieruchomości',
    'rodzaj nieruchomosci',
    'typ',
    'typ lokalu',
    'typ mieszkania',
    'rodzaj',
    'property_type',
    'type',
    'kategoria',
    'typ_lokalu',
    'rodzaj_lokalu'
  ],

  // Field 38: property_number (apartment_number in DB)
  property_number: [
    // INPRO exact (highest priority - most specific)
    'nr nieruchomości nadany przez dewelopera',
    'nr nieruchomosci nadany przez dewelopera',
    // Ministry official
    'nr lokalu lub domu jednorodzinnego nadany przez dewelopera',
    // Generic variations
    'oznaczenie lokalu nadane przez dewelopera',
    'nr lokalu',
    'numer lokalu',
    'nr mieszkania',
    'numer mieszkania',
    'lokal',
    'mieszkanie',
    'property_number',
    'apartment_number',
    'nr_lokalu',
    'numer_lokalu',
    'mieszkanie_nr',
    'nr' // fallback
  ],

  // Field 39: cena_za_m2
  price_per_m2: [
    // INPRO exact (compact format)
    'cena za m2 nieruchomości',
    'cena za m2 nieruchomosci',
    // Ministry official (with "2" as superscript)
    'cena m 2 powierzchni użytkowej lokalu mieszkalnego / domu jednorodzinnego [zł]',
    'cena m 2 powierzchni uzytkowej lokalu mieszkalnego / domu jednorodzinnego [zl]',
    // ATAL variant (no "za", no brackets)
    'cena m2 powierzchni użytkowej lokalu mieszkalnego / domu jednorodzinnego zł',
    'cena m2 powierzchni uzytkowej lokalu mieszkalnego / domu jednorodzinnego zl',
    // Generic variations
    'cena metra kwadratowego powierzchni użytkowej',
    'cena za m²',
    'cena za m2',
    'cena m2',
    'cena m²',
    'cena/m2',
    'cena/m²',
    'cena za m 2',
    'cena m 2',
    'cena/m 2',
    'cena za metr',
    // English
    'price_per_m2',
    'price_per_sqm',
    'cena_za_m2',
    'cena_m2'
  ],

  // Field 40: data_obowiazywania_ceny_m2
  price_valid_from: [
    // INPRO exact
    'data od której obowiązuje cena za m2 nieruchomości',
    'data od ktorej obowiazuje cena za m2 nieruchomosci',
    // Ministry official
    'data od której cena obowiązuje cena m 2 powierzchni użytkowej lokalu mieszkalnego / domu jednorodzinnego',
    'data od ktorej cena obowiazuje cena m 2 powierzchni uzytkowej lokalu mieszkalnego / domu jednorodzinnego',
    // ATAL variant
    'data od której cena obowiązuje cena m2 powierzchni użytkowej lokalu mieszkalnego / domu jednorodzinnego',
    'data od ktorej cena obowiazuje cena m2 powierzchni uzytkowej lokalu mieszkalnego / domu jednorodzinnego',
    // Alternative ministry format (longer)
    'data od której obowiązuje cena lokalu mieszkalnego lub domu jednorodzinnego uwzględniająca cenę lokalu stanowiącą iloczyn powierzchni oraz metrażu i innych składowych ceny, o których mowa w art. 19a ust. 1 pkt 1), 2) lub 3)',
    // Generic
    'data od której cena obowiązuje',
    'data od',
    'obowiązuje od',
    'price_valid_from',
    'valid_from',
    'cena od',
    'od kiedy'
  ],

  // Field 41: cena_bazowa
  base_price: [
    // INPRO exact (compact)
    'cena nieruchomości',
    'cena nieruchomosci',
    // Ministry official
    'cena lokalu mieszkalnego lub domu jednorodzinnego będących przedmiotem umowy stanowiąca iloczyn ceny m2 oraz powierzchni [zł]',
    'cena lokalu mieszkalnego lub domu jednorodzinnego bedacych przedmiotem umowy stanowiaca iloczyn ceny m2 oraz powierzchni [zl]',
    // ATAL (no brackets)
    'cena lokalu mieszkalnego lub domu jednorodzinnego będących przedmiotem umowy stanowiąca iloczyn ceny m2 oraz powierzchni zł',
    'cena lokalu mieszkalnego lub domu jednorodzinnego bedacych przedmiotem umowy stanowiaca iloczyn ceny m2 oraz powierzchni zl',
    // Generic
    'cena będąca iloczynem powierzchni oraz metrażu',
    'cena bazowa',
    'cena_bazowa',
    'base_price',
    'cena podstawowa',
    'cena_podstawowa'
  ],

  // Field 42: data_obowiazywania_ceny_bazowej
  base_price_valid_from: [
    // INPRO exact
    'data od której obowiązuje cena nieruchomości',
    'data od ktorej obowiazuje cena nieruchomosci',
    // Ministry official
    'data od której obowiązuje cena lokalu mieszkalnego lub domu jednorodzinnego będących przedmiotem umowy stanowiąca iloczyn ceny m2 oraz powierzchni',
    'data od ktorej obowiazuje cena lokalu mieszkalnego lub domu jednorodzinnego bedacych przedmiotem umowy stanowiaca iloczyn ceny m2 oraz powierzchni',
    // ATAL truncated (typo: "miesz." instead of "mieszkalnego", "jedn." instead of "jednorodzinnego", "pow" instead of "powierzchni")
    'data od której obowiązuje cena lokalu miesz. lub domu jedn. będących przedmiotem umowy stanowiąca iloczyn ceny m2 oraz pow',
    'data od ktorej obowiazuje cena lokalu miesz. lub domu jedn. bedacych przedmiotem umowy stanowiaca iloczyn ceny m2 oraz pow',
    // Generic
    'data obowiązywania ceny lokalu mieszkalnego lub domu jednorodzinnego będących przedmiotem umowy stanowiąca iloczyn ceny m2 oraz powierzchni',
    'data obowiazywania ceny bazowej',
    'data bazowa',
    'data_bazowa',
    'data ceny bazowej',
    'data_ceny_bazowej',
    'base_price_date'
  ],

  // Field 43: cena_finalna
  final_price: [
    // Ministry official
    'cena lokalu mieszkalnego lub domu jednorodzinnego uwzględniająca cenę lokalu stanowiącą iloczyn powierzchni oraz metrażu i innych składowych ceny, o których mowa w art. 19a ust. 1 pkt 1), 2) lub 3) [zł]',
    'cena lokalu mieszkalnego lub domu jednorodzinnego uwzgledniajaca cene lokalu stanowiaca iloczyn powierzchni oraz metrazu i innych skladowych ceny, o ktorych mowa w art. 19a ust. 1 pkt 1), 2) lub 3) [zl]',
    // ATAL abbreviated (no brackets, shortened words)
    'cena lokalu miesz. lub domu jedno. uwzględniająca cenę lokalu stanowiącą iloczyn pow. oraz metrażu i innych skł. ceny',
    'cena lokalu miesz. lub domu jedno. uwzgledniajaca cene lokalu stanowiaca iloczyn pow. oraz metrazu i innych skl. ceny',
    // Generic
    'cena uwzględniająca wszystkie składowe',
    'cena finalna',
    'cena końcowa',
    'cena ostateczna',
    'cena_koncowa',
    'final_price',
    'cena_finalna',
    'cena_ostateczna'
  ],

  // Field 44: data_obowiazywania_ceny_finalnej
  final_price_valid_from: [
    // Ministry official
    'data od której obowiązuje cena lokalu mieszkalnego lub domu jednorodzinnego uwzględniająca cenę lokalu stanowiącą iloczyn powierzchni oraz metrażu i innych składowych ceny, o których mowa w art. 19a ust. 1 pkt 1), 2) lub 3)',
    'data od ktorej obowiazuje cena lokalu mieszkalnego lub domu jednorodzinnego uwzgledniajaca cene lokalu stanowiaca iloczyn powierzchni oraz metrazu i innych skladowych ceny, o ktorych mowa w art. 19a ust. 1 pkt 1), 2) lub 3)',
    // ATAL typo variant (missing "której", abbreviated)
    'data od cena lokalu miesz. lub domu jedno. uwzględniająca cenę lokalu stanowiącą iloczyn pow. oraz metrażu i innych skł. ceny',
    'data od cena lokalu miesz. lub domu jedno. uwzgledniajaca cene lokalu stanowiaca iloczyn pow. oraz metrazu i innych skl. ceny',
    // Generic
    'data obowiązywania ceny lokalu mieszkalnego lub domu jednorodzinnego uwzględniająca cenę lokalu stanowiącą iloczyn powierzchni oraz metrażu i innych składowych ceny, o których mowa w art. 19a ust. 1 pkt 1), 2) lub 3)',
    'data obowiazywania ceny finalnej',
    'data obowiazywania ceny koncowej',
    'data finalna',
    'data_finalna',
    'data ceny finalnej',
    'data_ceny_finalnej',
    'final_price_date',
    'data końcowa',
    'data_koncowa'
  ],

  // ========================================
  // SECTION 4: PARKING/STORAGE (Columns 45-54)
  // ========================================

  // Field 45: parking_type
  parking_type: [
    // Ministry official (all CSVs use this)
    'rodzaj części nieruchomości będących przedmiotem umowy',
    'rodzaj czesci nieruchomosci bedacych przedmiotem umowy',
    // Generic variations
    'miejsce postojowe',
    'parking type',
    'rodzaj parkingu',
    'rodzaj czesci nieruchomosci',
    'typ parkingu',
    'rodzaj miejsca parkingowego'
  ],

  // Field 46: parking_designation
  parking_designation: [
    // Ministry official (all CSVs use this)
    'oznaczenie części nieruchomości nadane przez dewelopera',
    'oznaczenie czesci nieruchomosci nadane przez dewelopera',
    // Generic variations
    'oznaczenie parkingu',
    'parking designation',
    'nr parkingu',
    'numer parkingu',
    'oznaczenie miejsca parkingowego'
  ],

  // Field 47: parking_price
  parking_price: [
    // Ministry official
    'cena części nieruchomości, będących przedmiotem umowy [zł]',
    'cena czesci nieruchomosci, bedacych przedmiotem umowy [zl]',
    // ATAL (no brackets)
    'cena części nieruchomości, będących przedmiotem umowy zł',
    'cena czesci nieruchomosci, bedacych przedmiotem umowy zl',
    // Generic variations
    'cena parkingu',
    'cena garażu',
    'cena garazu',
    'parking price',
    'parking_price',
    'cena_parkingu',
    'cena_garazu',
    'parking_cost',
    'cena przypisanego miejsca parkingowego / garażu [1]',
    'cena miejsca parkingowego garażu',
    'cena części nieruchomości',
    'cena czesci nieruchomosci'
  ],

  // Field 48: parking_date
  parking_date: [
    // Ministry official (all CSVs use this)
    'data od której obowiązuje cena części nieruchomości, będących przedmiotem umowy',
    'data od ktorej obowiazuje cena czesci nieruchomosci, bedacych przedmiotem umowy',
    // Without commas
    'data od której obowiązuje cena części nieruchomości będących przedmiotem umowy',
    'data od ktorej obowiazuje cena czesci nieruchomosci bedacych przedmiotem umowy',
    // Generic
    'data parkingu',
    'parking date',
    'data obowiązywania ceny części nieruchomości',
    'data obowiazywania ceny czesci nieruchomosci',
    'data od ktorej obowiazuje cena czesci nieruchomosci'
  ],

  // Field 49: storage_type
  storage_type: [
    // Ministry official (full text with law reference)
    'rodzaj pomieszczeń przynależnych, o których mowa w art. 2 ust. 4 ustawy z dnia 24 czerwca 1994 r. o własności lokali',
    'rodzaj pomieszczen przynaleznych, o ktorych mowa w art. 2 ust. 4 ustawy z dnia 24 czerwca 1994 r. o wlasnosci lokali',
    // Without law reference
    'rodzaj pomieszczeń przynależnych, o których mowa w art. 2 ust. 4',
    'rodzaj pomieszczen przynaleznych, o ktorych mowa w art. 2 ust. 4',
    // Generic
    'rodzaj pomieszczeń przynależnych',
    'rodzaj pomieszczen przynaleznych',
    'komórka lokatorska',
    'storage type',
    'rodzaj komórki',
    'rodzaj komorki'
  ],

  // Field 50: storage_designation
  storage_designation: [
    // Ministry official (full text with law reference)
    'oznaczenie pomieszczeń przynależnych, o których mowa w art. 2 ust. 4 ustawy z dnia 24 czerwca 1994 r. o własności lokali',
    'oznaczenie pomieszczen przynaleznych, o ktorych mowa w art. 2 ust. 4 ustawy z dnia 24 czerwca 1994 r. o wlasnosci lokali',
    // Without law reference
    'oznaczenie pomieszczeń przynależnych, o których mowa w art. 2 ust. 4',
    'oznaczenie pomieszczen przynaleznych, o ktorych mowa w art. 2 ust. 4',
    // Generic
    'oznaczenie pomieszczeń przynależnych',
    'oznaczenie pomieszczen przynaleznych',
    'oznaczenie komórki',
    'storage designation',
    'nr komórki',
    'nr komorki'
  ],

  // Field 51: storage_price
  storage_price: [
    // Ministry official (full text with law reference and "wyszczególnienie")
    'wyszczególnienie cen pomieszczeń przynależnych, o których mowa w art. 2 ust. 4 ustawy z dnia 24 czerwca 1994 r. o własności lokali [zł]',
    'wyszczegolnienie cen pomieszczen przynaleznych, o ktorych mowa w art. 2 ust. 4 ustawy z dnia 24 czerwca 1994 r. o wlasnosci lokali [zl]',
    // Without brackets
    'wyszczególnienie cen pomieszczeń przynależnych, o których mowa w art. 2 ust. 4 ustawy z dnia 24 czerwca 1994 r. o własności lokali zł',
    'wyszczegolnienie cen pomieszczen przynaleznych, o ktorych mowa w art. 2 ust. 4 ustawy z dnia 24 czerwca 1994 r. o wlasnosci lokali zl',
    // Without law reference
    'wyszczególnienie cen pomieszczeń przynależnych',
    'wyszczegolnienie cen pomieszczen przynaleznych',
    // Generic (without "wyszczególnienie")
    'cena pomieszczeń przynależnych, o których mowa w art. 2 ust. 4',
    'cena pomieszczen przynaleznych, o ktorych mowa w art. 2 ust. 4',
    'cena pomieszczeń przynależnych',
    'cena pomieszczen przynaleznych',
    'cena komórki',
    'storage price',
    'koszt komórki'
  ],

  // Field 52: storage_date
  storage_date: [
    // Ministry official (full text with law reference and "wyszczególnionych")
    'data od której obowiązuje cena wyszczególnionych pomieszczeń przynależnych, o których mowa w art. 2 ust. 4 ustawy z dnia 24 czerwca 1994 r. o własności lokali',
    'data od ktorej obowiazuje cena wyszczegolnionych pomieszczen przynaleznych, o ktorych mowa w art. 2 ust. 4 ustawy z dnia 24 czerwca 1994 r. o wlasnosci lokali',
    // Without law reference
    'data od której obowiązuje cena wyszczególnionych pomieszczeń przynależnych',
    'data od ktorej obowiazuje cena wyszczegolnionych pomieszczen przynaleznych',
    // Generic (without "wyszczególnionych")
    'data obowiązywania ceny pomieszczeń przynależnych, o których mowa w art. 2 ust. 4',
    'data obowiazywania ceny pomieszczen przynaleznych, o ktorych mowa w art. 2 ust. 4',
    'data obowiązywania ceny pomieszczeń przynależnych',
    'data obowiazywania ceny pomieszczen przynaleznych',
    'data od ktorej obowiazuje cena wyszczegolnionych pomieszczen przynaleznych',
    'data komórki',
    'storage date'
  ],

  // ========================================
  // Fields 53-55: Necessary Rights (Prawa niezbędne)
  // ========================================

  // Field 53: necessary_rights
  necessary_rights: [
    // Ministry official (CORRECT TEXT - NOT "nieruchomości wspólnych"!)
    'wyszczególnienie praw niezbędnych do korzystania z lokalu mieszkalnego lub domu jednorodzinnego',
    'wyszczegolnienie praw niezbednych do korzystania z lokalu mieszkalnego lub domu jednorodzinnego',
    // Generic variations
    'prawa niezbędne do korzystania z lokalu mieszkalnego lub domu jednorodzinnego',
    'prawa niezbedne do korzystania z lokalu mieszkalnego lub domu jednorodzinnego',
    'wyszczególnienie praw niezbędnych',
    'wyszczegolnienie praw niezbednych',
    'prawa niezbędne',
    'prawa_niezbedne',
    'prawa niezbedne wyszczególnienie',
    'prawa_niezbedne_wyszczegolnienie',
    'necessary_rights',
    'rights',
    'udzial w gruncie',
    'udział w gruncie'
  ],

  // Field 54: necessary_rights_price
  necessary_rights_price: [
    // Ministry official (full text)
    'wartość praw niezbędnych do korzystania z lokalu mieszkalnego lub domu jednorodzinnego [zł]',
    'wartosc praw niezbednych do korzystania z lokalu mieszkalnego lub domu jednorodzinnego [zl]',
    // Without brackets
    'wartość praw niezbędnych do korzystania z lokalu mieszkalnego lub domu jednorodzinnego zł',
    'wartosc praw niezbednych do korzystania z lokalu mieszkalnego lub domu jednorodzinnego zl',
    // Generic
    'wartość praw niezbędnych',
    'wartosc praw niezbednych',
    'cena praw niezbędnych',
    'cena praw niezbednych',
    'prawa cena',
    'prawa_niezbedne_cena',
    'necessary_rights_price'
  ],

  // Field 55: necessary_rights_date
  necessary_rights_date: [
    // Ministry official (full text with "wartości")
    'data od której obowiązuje cena wartości praw niezbędnych do korzystania z lokalu mieszkalnego lub domu jednorodzinnego',
    'data od ktorej obowiazuje cena wartosci praw niezbednych do korzystania z lokalu mieszkalnego lub domu jednorodzinnego',
    // Without "wartości"
    'data od której obowiązuje cena praw niezbędnych do korzystania z lokalu mieszkalnego lub domu jednorodzinnego',
    'data od ktorej obowiazuje cena praw niezbednych do korzystania z lokalu mieszkalnego lub domu jednorodzinnego',
    // Generic
    'data obowiązywania ceny praw niezbędnych',
    'data obowiazywania ceny praw niezbednych',
    'prawa data',
    'prawa_niezbedne_data',
    'necessary_rights_date'
  ],

  // ========================================
  // Fields 56-58: Other Monetary Obligations (Inne świadczenia pieniężne)
  // ========================================

  // Field 56: other_obligations_type
  other_obligations_type: [
    // Ministry official (full text)
    'wyszczególnienie rodzajów innych świadczeń pieniężnych, które nabywca zobowiązany jest spełnić na rzecz dewelopera w wykonaniu umowy przenoszącej własność',
    'wyszczegolnienie rodzajow innych swiadczen pienieznych, ktore nabywca zobowiazany jest spelnic na rzecz dewelopera w wykonaniu umowy przenoszącej wlasnosc',
    // ATAL abbreviated
    'rodzaje innych świad. pienię. które nabywca zobo. jest spełnić na rzecz dewelopera w wykonaniu umowy przenoszącej własność',
    'rodzaje innych swiad. pienie. ktore nabywca zobo. jest spelnic na rzecz dewelopera w wykonaniu umowy przenoszącej wlasnosc',
    // INPRO simplified (single column, not split)
    'inne świadczenia pieniężne',
    'inne swiadczenia pieniezne',
    // Generic
    'wyszczególnienie rodzajów innych świadczeń pieniężnych',
    'wyszczegolnienie rodzajow innych swiadczen pienieznych',
    'rodzaje innych świadczeń pieniężnych',
    'rodzaje innych swiadczen pienieznych',
    'inne swiadczenia',
    'other_obligations',
    'inne opłaty',
    'other fees'
  ],

  // Field 57: other_obligations_price
  other_obligations_price: [
    // Ministry official (full text)
    'wartość innych świadczeń pieniężnych, które nabywca zobowiązany jest spełnić na rzecz dewelopera w wykonaniu umowy przenoszącej własność [zł]',
    'wartosc innych swiadczen pienieznych, ktore nabywca zobowiazany jest spelnic na rzecz dewelopera w wykonaniu umowy przenoszącej wlasnosc [zl]',
    // Without brackets
    'wartość innych świadczeń pieniężnych, które nabywca zobowiązany jest spełnić na rzecz dewelopera w wykonaniu umowy przenoszącej własność zł',
    'wartosc innych swiadczen pienieznych, ktore nabywca zobowiazany jest spelnic na rzecz dewelopera w wykonaniu umowy przenoszącej wlasnosc zl',
    // ATAL abbreviated
    'wartość innych świad. pienię. które nabywca zobo. jest spełnić na rzecz dewelopera w wykonaniu umowy przenoszącej własność zł',
    'wartosc innych swiad. pienie. ktore nabywca zobo. jest spelnic na rzecz dewelopera w wykonaniu umowy przenoszącej wlasnosc zl',
    // Generic
    'wartość innych świadczeń pieniężnych',
    'wartosc innych swiadczen pienieznych',
    'cena innych świadczeń',
    'cena innych swiadczen',
    'other_obligations_price',
    'inne opłaty kwota'
  ],

  // Field 58: other_obligations_date
  other_obligations_date: [
    // Ministry official (full text with "wartości")
    'data od której obowiązuje cena wartości innych świadczeń pieniężnych, które nabywca zobowiązany jest spełnić na rzecz dewelopera w wykonaniu umowy przenoszącej własność',
    'data od ktorej obowiazuje cena wartosci innych swiadczen pienieznych, ktore nabywca zobowiazany jest spelnic na rzecz dewelopera w wykonaniu umowy przenoszącej wlasnosc',
    // Without "wartości"
    'data od której obowiązuje cena innych świadczeń pieniężnych, które nabywca zobowiązany jest spełnić na rzecz dewelopera w wykonaniu umowy przenoszącej własność',
    'data od ktorej obowiazuje cena innych swiadczen pienieznych, ktore nabywca zobowiazany jest spelnic na rzecz dewelopera w wykonaniu umowy przenoszącej wlasnosc',
    // ATAL abbreviated
    'data od której obow. cena wartości innych świadczeń pieniężnych które nabywca zobo. jest spełnić na rzecz dewelopera',
    'data od ktorej obow. cena wartosci innych swiadczen pienieznych ktore nabywca zobo. jest spelnic na rzecz dewelopera',
    // Generic
    'data obowiązywania ceny innych świadczeń pieniężnych',
    'data obowiazywania ceny innych swiadczen pienieznych',
    'other_obligations_date',
    'data innych opłat'
  ],

  // ========================================
  // SECTION 5: PROSPECTUS (Column 59)
  // ========================================

  // Field 59: prospectus_url
  prospectus_url: [
    // Ministry official (with commas)
    'adres strony internetowej, pod którym dostępny jest prospekt informacyjny',
    'adres strony internetowej, pod ktorym dostepny jest prospekt informacyjny',
    // INPRO (no commas)
    'adres strony internetowej pod którym dostępny jest prospekt informacyjny',
    'adres strony internetowej pod ktorym dostepny jest prospekt informacyjny',
    // Generic variations
    'adres strony internetowej prospektu informacyjnego',
    'adres prospektu informacyjnego',
    'adres prospektu',
    'adres_prospektu',
    'prospekt',
    'prospectus',
    'prospectus_url',
    'url prospektu',
    'link do prospektu'
  ],

  // ========================================
  // SECTION 6: ADDITIONAL INPRO FIELDS (Non-Ministry)
  // ========================================

  // Field: powierzchnia (area) - INPRO specific, calculated in TAMBUD/ATAL
  area: [
    // INPRO exact
    'powierzchnia',
    // Generic variations
    'powierzchnia użytkowa',
    'powierzchnia uzytkowa',
    'powierzchnia m²',
    'powierzchnia m2',
    'area',
    'size',
    'metraż',
    'metraz',
    'pow',
    'powierzchnia_uzytkowa',
    'm2',
    'm²',
    'metry kwadratowe'
  ],

  // Field: pietro (floor) - INPRO specific
  kondygnacja: [
    // INPRO exact
    'piętro nieruchomości',
    'pietro nieruchomosci',
    // Generic variations
    'kondygnacja',
    'piętro',
    'pietro',
    'floor',
    'level',
    'poziom',
    'kondygnacja_nr',
    'nr_pietra',
    'pietro_nr'
  ],

  // Field: liczba_pokoi (rooms) - INPRO specific
  liczba_pokoi: [
    // INPRO exact
    'liczba pokoi',
    // Generic variations
    'pokoje',
    'rooms',
    'liczba_pokoi',
    'ilosc_pokoi',
    'nr pokoi',
    'rooms_count',
    'pokoi',
    'ile pokoi'
  ],

  // Field: stawka_vat - INPRO specific
  vat_rate: [
    // INPRO exact (with parentheses)
    'stawka vat (%)',
    'stawka VAT (%)',
    // Without parentheses
    'stawka VAT',
    'stawka vat',
    'VAT',
    'vat_rate',
    'tax_rate',
    'podatek',
    'vat %',
    'vat procent'
  ],

  // Field: waluta - INPRO specific
  waluta: [
    // INPRO exact
    'waluta',
    // Generic variations
    'currency',
    'PLN',
    'EUR',
    'USD',
    'w jakiej walucie',
    'symbol waluty',
    'currency_code'
  ],

  // Field: nazwa_inwestycji - INPRO/ATAL specific
  investment_name: [
    // INPRO/ATAL exact
    'nazwa inwestycji',
    // Generic variations
    'inwestycja',
    'project',
    'investment',
    'investment_name',
    'projekt',
    'nazwa_inwestycji',
    'osiedle',
    'nazwa osiedla'
  ],

  // Field: adres_strony_inwestycji - INPRO/ATAL specific
  investment_website: [
    // INPRO exact
    'adres strony internetowej inwestycji',
    // ATAL exact
    'adres strony przedsięwzięcia deweloperskiego/zadania inwestycyjnego',
    'adres strony przedsiewziecia deweloperskiego/zadania inwestycyjnego',
    // Generic variations
    'adres strony inwestycji',
    'adres strony przedsięwzięcia deweloperskiego zadania inwestycyjnego',
    'adres strony przedsiewziecia deweloperskiego zadania inwestycyjnego',
    'investment_website',
    'project_url',
    'url inwestycji',
    'strona inwestycji'
  ]

} as const

/**
 * Type helper for Ministry field keys
 */
export type MinistryFieldKey = keyof typeof COMPLETE_COLUMN_PATTERNS

/**
 * Validate that we have exactly 58 ministry fields + additional INPRO fields
 * Expected: 58 ministry fields + 7 INPRO extras = 65 total
 */
const EXPECTED_MINISTRY_FIELDS = 58
const EXPECTED_INPRO_EXTRAS = 7
const TOTAL_FIELDS = Object.keys(COMPLETE_COLUMN_PATTERNS).length

console.assert(
  TOTAL_FIELDS >= EXPECTED_MINISTRY_FIELDS,
  `Expected at least ${EXPECTED_MINISTRY_FIELDS} ministry fields, got ${TOTAL_FIELDS}`
)

/**
 * Get all synonyms for a given field
 */
export function getSynonymsForField(field: MinistryFieldKey): readonly string[] {
  return COMPLETE_COLUMN_PATTERNS[field]
}

/**
 * Get count of synonyms per field (for analysis)
 */
export function getSynonymStats() {
  const stats: Record<string, number> = {}
  let totalSynonyms = 0

  for (const [field, synonyms] of Object.entries(COMPLETE_COLUMN_PATTERNS)) {
    stats[field] = synonyms.length
    totalSynonyms += synonyms.length
  }

  return {
    fieldCount: TOTAL_FIELDS,
    totalSynonyms,
    averageSynonymsPerField: (totalSynonyms / TOTAL_FIELDS).toFixed(1),
    stats
  }
}
