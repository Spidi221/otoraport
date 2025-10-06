// Smart CSV/Excel parser with intelligent column mapping for Polish real estate data
// Updated for Ministry Schema 1.13 compliance (all 58 required fields)
import * as XLSX from 'xlsx';

interface ColumnMapping {
  // Basic property info
  property_number: string[]
  property_type: string[]
  area: string[]
  kondygnacja: string[]
  liczba_pokoi: string[]
  
  // Additional areas
  powierzchnia_balkon: string[]
  powierzchnia_taras: string[]
  powierzchnia_loggia: string[]
  powierzchnia_ogrod: string[]
  
  // Prices
  price_per_m2: string[]
  total_price: string[]
  final_price: string[]
  cena_za_m2_poczatkowa: string[]
  cena_bazowa_poczatkowa: string[]
  
  // Location
  wojewodztwo: string[]
  powiat: string[]
  gmina: string[]
  miejscowosc: string[]
  ulica: string[]
  numer_nieruchomosci: string[]
  kod_pocztowy: string[]
  
  // Dates
  data_pierwszej_oferty: string[]
  data_pierwszej_sprzedazy: string[]
  price_valid_from: string[]
  price_valid_to: string[]
  data_rezerwacji: string[]
  data_sprzedazy: string[]
  
  // Parking and storage
  parking_space: string[]
  parking_price: string[]
  miejsca_postojowe_nr: string[]
  miejsca_postojowe_ceny: string[]
  komorki_nr: string[]
  komorki_ceny: string[]
  
  // Status
  status: string[]
  status_dostepnosci: string[]
  
  // Building compliance (58 field compliance)
  construction_year: string[]
  building_permit_number: string[]
  energy_class: string[]
  certyfikat_energetyczny: string[]
  additional_costs: string[]
  vat_rate: string[]
  legal_status: string[]

  // NEW MINISTRY FIELDS (missing from original)
  rok_budowy: string[]
  klasa_energetyczna: string[]
  system_grzewczy: string[]
  standard_wykonczenia: string[]
  typ_budynku: string[]
  rodzaj_wlasnosci: string[]
  dostep_dla_niepelnosprawnych: string[]
  powierzchnia_piwnica: string[]
  powierzchnia_strych: string[]
  powierzchnia_garaz: string[]
  ekspozycja: string[]
  nr_ksiegi_wieczystej: string[]

  // Permit details
  nr_pozwolenia_budowlanego: string[]
  data_wydania_pozwolenia: string[]
  organ_wydajacy_pozwolenie: string[]
  nr_decyzji_uzytkowej: string[]
  data_decyzji_uzytkowej: string[]

  // Enhanced developer data
  forma_prawna: string[]
  adres_siedziby: string[]
  strona_internetowa: string[]
  osoba_kontaktowa: string[]
  
  // Developer info
  developer_name: string[]
  company_name: string[]
  nip: string[]
  phone: string[]
  email: string[]
  
  // Investment info
  investment_name: string[]
  investment_address: string[]
  investment_city: string[]

  // Additional ministry fields
  budynek: string[]
  klatka: string[]
  stan_wykonczenia: string[]
  rok_budowy: string[]
  technologia_budowy: string[]
  powierzchnia_calkowita: string[]
  powierzchnia_piwnicy: string[]
  powierzchnia_strychu: string[]
  miejsca_postojowe_liczba: string[]
  miejsca_postojowe_rodzaj: string[]
  komorki_lokatorskie_liczba: string[]
  komorki_lokatorskie_powierzchnie: string[]
  winda: string[]
  klimatyzacja: string[]
  ogrzewanie: string[]
  dostep_dla_niepelnosprawnych: string[]
  ekspozycja: string[]
  widok_z_okien: string[]
  data_rezerwacji: string[]
  data_sprzedazy: string[]
  data_przekazania: string[]
  forma_wlasnosci: string[]
  ksiega_wieczysta: string[]
  udzial_w_gruncie: string[]
  waluta: string[]
}

// Polish real estate field variations - COMPLETE 58+ field mapping
export const COLUMN_PATTERNS: ColumnMapping = {
  // Basic property info
  property_number: [
    // INPRO FORMAT (highest priority - exact match required)
    'nr nieruchomości nadany przez dewelopera',
    'nr nieruchomosci nadany przez dewelopera',
    // MINISTRY OFFICIAL NAMES:
    'nr lokalu lub domu jednorodzinnego nadany przez dewelopera',
    'oznaczenie lokalu nadane przez dewelopera',
    // GENERIC NAMES (lower priority)
    'nr lokalu', 'numer lokalu', 'nr mieszkania', 'numer mieszkania',
    'lokal', 'mieszkanie', 'property_number', 'apartment_number',
    'nr_lokalu', 'numer_lokalu', 'mieszkanie_nr',
    // FALLBACK (avoid these if better match exists)
    'nr' // Too generic, only as last resort
  ],
  property_type: [
    'typ', 'typ lokalu', 'typ mieszkania', 'rodzaj', 'property_type',
    'type', 'kategoria', 'typ_lokalu', 'rodzaj_lokalu'
  ],
  
  // Prices
  price_per_m2: [
    // INPRO FORMAT (highest priority)
    'cena za m2 nieruchomości',
    'cena za m2 nieruchomosci',
    // MINISTRY OFFICIAL NAMES (ze spacją!):
    'cena m 2 powierzchni użytkowej lokalu mieszkalnego / domu jednorodzinnego [zł]',
    'cena metra kwadratowego powierzchni użytkowej',
    // GENERIC NAMES
    'cena za m²', 'cena za m2', 'cena m2', 'cena m²', 'cena/m2', 'cena/m²',
    'cena za m 2', 'cena m 2', 'cena/m 2', // warianty ze spacją
    'price_per_m2', 'price_per_sqm', 'cena_za_m2', 'cena_m2', 'cena za metr'
  ],
  total_price: [
    // INPRO FORMAT (highest priority)
    'cena nieruchomości',
    'cena nieruchomosci',
    // MINISTRY OFFICIAL NAMES:
    'cena lokalu mieszkalnego lub domu jednorodzinnego będących przedmiotem umowy stanowiąca iloczyn ceny m2 oraz powierzchni [zł]',
    'cena będąca iloczynem powierzchni oraz metrażu',
    // GENERIC NAMES
    'cena całkowita', 'cena calkowita', 'cena', 'cena brutto', 'cena bazowa',
    'total_price', 'price', 'cena_calkowita', 'cena_bazowa', 'cena_brutto'
  ],
  final_price: [
    'cena finalna', 'cena końcowa', 'cena ostateczna', 'final_price',
    'cena_finalna', 'cena_koncowa', 'cena_ostateczna',
    // MINISTRY OFFICIAL NAMES:
    'cena lokalu mieszkalnego lub domu jednorodzinnego uwzględniająca cenę lokalu stanowiącą iloczyn powierzchni oraz metrażu i innych składowych ceny, o których mowa w art. 19a ust. 1 pkt 1), 2) lub 3) [zł]',
    'cena uwzględniająca wszystkie składowe'
  ],

  // Areas and spaces
  // ⚠️ UWAGA: Ministerstwo NIE MA kolumny "Powierzchnia" w CSV!
  // Powierzchnia obliczana: area = total_price / price_per_m2 (kolumna 40 / kolumna 38)
  // Parser akceptuje surface area TYLKO jeśli user ma ją w swoim CSV
  area: [
    'powierzchnia', 'powierzchnia użytkowa', 'powierzchnia m²', 'powierzchnia m2',
    'area', 'size', 'metraż', 'pow', 'powierzchnia_uzytkowa', 'm2', 'm²'
    // ❌ USUNIĘTO nieistniejące oficjalne nazwy ministerstwa
    // Ministerstwo: kolumna NIE ISTNIEJE, trzeba obliczyć!
  ],
  powierzchnia_balkon: [
    'balkon', 'powierzchnia balkonu', 'balcony', 'powierzchnia_balkon',
    'pow balkonu', 'balkon m2', 'balkon m²'
  ],
  powierzchnia_taras: [
    'taras', 'powierzchnia tarasu', 'terrace', 'powierzchnia_taras',
    'pow tarasu', 'taras m2', 'taras m²'
  ],
  powierzchnia_loggia: [
    'loggia', 'powierzchnia loggii', 'powierzchnia_loggia',
    'pow loggii', 'loggia m2', 'loggia m²'
  ],
  powierzchnia_ogrod: [
    'ogród', 'ogrod', 'powierzchnia ogrodu', 'garden', 'powierzchnia_ogrod',
    'pow ogrodu', 'ogród m2', 'ogród m²'
  ],
  
  // Property details
  kondygnacja: [
    'kondygnacja', 'piętro', 'pietro', 'floor', 'level',
    'poziom', 'kondygnacja_nr', 'nr_pietra'
  ],
  liczba_pokoi: [
    'pokoje', 'liczba pokoi', 'rooms', 'liczba_pokoi', 'ilosc_pokoi',
    'nr pokoi', 'rooms_count', 'pokoi'
    // ❌ USUNIĘTO nieistniejącą nazwę ministerstwa
    // Ministerstwo: kolumna "Liczba pokoi" NIE ISTNIEJE w schemacie 58 kolumn!
    // Parser akceptuje rooms TYLKO jeśli user ma tę kolumnę w swoim CSV
  ],
  
  // Location fields
  wojewodztwo: [
    'województwo', 'wojewodztwo', 'voivodeship', 'region',
    'woj', 'woj.', 'province',
    // MINISTRY OFFICIAL NAMES:
    'województwo lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego',
    'województwo adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera'
  ],
  powiat: [
    'powiat', 'county', 'district', 'pow', 'pow.',
    // MINISTRY OFFICIAL NAMES:
    'powiat lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego',
    'powiat adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera'
  ],
  gmina: [
    'gmina', 'municipality', 'commune', 'gm', 'gm.',
    // MINISTRY OFFICIAL NAMES:
    'gmina lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego',
    'gmina adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera'
  ],
  miejscowosc: [
    'miejscowość', 'miejscowosc', 'miasto', 'city', 'town',
    'locality', 'place',
    // MINISTRY OFFICIAL NAMES:
    'miejscowość lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego',
    'miejscowość adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera'
  ],
  ulica: [
    'ulica', 'ul', 'ul.', 'street', 'adres', 'address',
    // MINISTRY OFFICIAL NAMES:
    'ulica lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego',
    'ulica adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera'
  ],
  numer_nieruchomosci: [
    'numer nieruchomości', 'nr nieruchomości', 'numer_nieruchomosci',
    'nr budynku', 'building_number', 'house_number'
  ],
  kod_pocztowy: [
    'kod pocztowy', 'kod_pocztowy', 'postal_code', 'zip_code',
    'zip', 'postal'
  ],
  
  // Price history and dates
  cena_za_m2_poczatkowa: [
    'cena początkowa za m²', 'cena startowa m2', 'initial_price_m2',
    'cena_za_m2_poczatkowa', 'first_price_m2'
  ],
  cena_bazowa_poczatkowa: [
    'cena bazowa początkowa', 'cena startowa', 'initial_price',
    'cena_bazowa_poczatkowa', 'starting_price'
  ],
  data_pierwszej_oferty: [
    'data pierwszej oferty', 'first_offer_date', 'offer_date',
    'data_pierwszej_oferty', 'data oferty'
  ],
  data_pierwszej_sprzedazy: [
    'data pierwszej sprzedaży', 'first_sale_date', 'sale_date',
    'data_pierwszej_sprzedazy', 'data sprzedaży'
  ],
  price_valid_from: [
    'data od', 'obowiązuje od', 'price_valid_from', 'valid_from',
    'cena od', 'od kiedy',
    // MINISTRY OFFICIAL NAMES:
    'data od której cena obowiązuje cena m 2 powierzchni użytkowej lokalu mieszkalnego / domu jednorodzinnego',
    'data od której obowiązuje cena lokalu mieszkalnego lub domu jednorodzinnego uwzględniająca cenę lokalu stanowiącą iloczyn powierzchni oraz metrażu i innych składowych ceny, o których mowa w art. 19a ust. 1 pkt 1), 2) lub 3)',
    'data od której cena obowiązuje'
  ],
  price_valid_to: [
    'data do', 'obowiązuje do', 'price_valid_to', 'valid_to',
    'cena do', 'do kiedy'
  ],
  
  // Parking and storage
  parking_space: [
    'parking', 'miejsce parkingowe', 'garaż', 'parking space', 'parking_space',
    'miejsce_parkingowe', 'mp', 'parking_spot', 'garage',
    // MINISTRY OFFICIAL NAMES:
    'nr przypisanego miejsca parkingowego / garażu [1]',
    'numer miejsca parkingowego garażu'
  ],
  parking_price: [
    'cena parkingu', 'cena garażu', 'parking price', 'parking_price',
    'cena_parkingu', 'cena_garazu', 'parking_cost',
    // MINISTRY OFFICIAL NAMES:
    'cena przypisanego miejsca parkingowego / garażu [1]',
    'cena miejsca parkingowego garażu'
  ],
  miejsca_postojowe_nr: [
    'nr miejsc parkingowych', 'parking_numbers', 'parking_spaces',
    'miejsca_postojowe_nr', 'numery parkingów',
    // MINISTRY OFFICIAL NAMES:
    'nr przypisanego miejsca parkingowego / garażu [1]'
  ],
  miejsca_postojowe_ceny: [
    'ceny miejsc parkingowych', 'parking_prices', 'parking_costs',
    'miejsca_postojowe_ceny', 'ceny parkingów',
    // MINISTRY OFFICIAL NAMES:
    'cena przypisanego miejsca parkingowego / garażu [1]'
  ],
  komorki_nr: [
    'nr komórek', 'storage_numbers', 'komorki_nr',
    'numery komórek', 'storage_rooms'
  ],
  komorki_ceny: [
    'ceny komórek', 'storage_prices', 'komorki_ceny',
    'ceny pomieszczeń', 'storage_costs'
  ],
  
  // Status and availability
  status: [
    'status', 'dostępność', 'stan', 'availability', 'dostepnosc',
    'stan_sprzedaży', 'stan_sprzedazy'
  ],
  status_dostepnosci: [
    'status dostępności', 'availability_status', 'dostępny',
    'status_dostepnosci', 'current_status'
  ],
  data_rezerwacji: [
    'data rezerwacji', 'reservation_date', 'data_rezerwacji',
    'zarezerwowano', 'reserved_date'
  ],
  data_sprzedazy: [
    'data sprzedaży', 'sale_date', 'data_sprzedazy',
    'sprzedano', 'sold_date'
  ],
  
  // Building compliance (expanded for Ministry Schema 1.13)
  construction_year: [
    'rok budowy', 'construction_year', 'year_built',
    'rok_budowy', 'built_year'
  ],
  building_permit_number: [
    'nr pozwolenia na budowę', 'pozwolenie budowlane', 'building_permit',
    'building_permit_number', 'permit_number'
  ],
  energy_class: [
    'klasa energetyczna', 'energy_class', 'energy_rating',
    'efektywność energetyczna', 'energia'
  ],
  certyfikat_energetyczny: [
    'certyfikat energetyczny', 'energy_certificate',
    'certyfikat_energetyczny', 'certificate'
  ],

  // NEW MINISTRY-SPECIFIC FIELDS
  rok_budowy: [
    'rok budowy', 'rok zakończenia budowy', 'year_built', 'construction_year',
    'data oddania', 'rok_budowy', 'year_of_construction'
  ],
  klasa_energetyczna: [
    'klasa energetyczna', 'energy_class', 'certyfikat energetyczny',
    'energy_rating', 'klasa_energetyczna', 'efektywność'
  ],
  system_grzewczy: [
    'system grzewczy', 'ogrzewanie', 'heating_system', 'grzewczy',
    'system_grzewczy', 'typ ogrzewania'
  ],
  standard_wykonczenia: [
    'standard wykończenia', 'standard', 'wykończenie', 'finishing_standard',
    'standard_wykonczenia', 'stan wykończenia'
  ],
  typ_budynku: [
    'typ budynku', 'rodzaj budynku', 'building_type', 'typ_budynku',
    'kategoria budynku', 'forma zabudowy'
  ],
  rodzaj_wlasnosci: [
    'rodzaj własności', 'własność', 'prawo własności', 'ownership_type',
    'rodzaj_wlasnosci', 'status prawny'
  ],
  dostep_dla_niepelnosprawnych: [
    'dostęp dla niepełnosprawnych', 'niepełnosprawni', 'accessibility',
    'dostep_dla_niepelnosprawnych', 'przystosowanie'
  ],
  powierzchnia_piwnica: [
    'piwnica', 'powierzchnia piwnicy', 'basement', 'powierzchnia_piwnica',
    'piwnica m2', 'pomieszczenie piwniczna'
  ],
  powierzchnia_strych: [
    'strych', 'powierzchnia strychu', 'attic', 'powierzchnia_strych',
    'strych m2', 'poddasze'
  ],
  powierzchnia_garaz: [
    'garaż', 'powierzchnia garażu', 'garage', 'powierzchnia_garaz',
    'garaż m2', 'garaż wewnętrzny'
  ],
  ekspozycja: [
    'ekspozycja', 'strony świata', 'orientation', 'nasłonecznienie',
    'kierunki świata', 'exposure'
  ],
  nr_ksiegi_wieczystej: [
    'księga wieczysta', 'nr księgi', 'land_registry', 'nr_ksiegi_wieczystej',
    'numer księgi wieczystej'
  ],

  // Building permits (Ministry required)
  nr_pozwolenia_budowlanego: [
    'nr pozwolenia na budowę', 'pozwolenie budowlane', 'building_permit',
    'nr_pozwolenia_budowlanego', 'permit_number'
  ],
  data_wydania_pozwolenia: [
    'data pozwolenia', 'data wydania pozwolenia', 'permit_date',
    'data_wydania_pozwolenia', 'kiedy wydane pozwolenie'
  ],
  organ_wydajacy_pozwolenie: [
    'organ wydający', 'urząd', 'building_authority', 'organ_wydajacy_pozwolenie',
    'kto wydał pozwolenie'
  ],
  nr_decyzji_uzytkowej: [
    'decyzja użytkowa', 'pozwolenie na użytkowanie', 'occupancy_permit',
    'nr_decyzji_uzytkowej', 'użytkowanie'
  ],
  data_decyzji_uzytkowej: [
    'data decyzji użytkowej', 'kiedy użytkowanie', 'occupancy_date',
    'data_decyzji_uzytkowej', 'data oddania do użytku'
  ],
  
  // Additional costs and legal
  additional_costs: [
    'koszty dodatkowe', 'additional_costs', 'extra_costs',
    'opłaty dodatkowe', 'fees'
  ],
  vat_rate: [
    'stawka VAT', 'VAT', 'vat_rate', 'tax_rate',
    'podatek', 'vat %'
  ],
  legal_status: [
    'status prawny', 'legal_status', 'ownership',
    'własność', 'prawo własności'
  ],
  
  // Developer info (Ministry compliance enhanced)
  developer_name: [
    'deweloper', 'nazwa dewelopera', 'developer', 'developer_name',
    'firma', 'nazwa_dewelopera',
    // MINISTRY OFFICIAL NAMES:
    'nazwa dewelopera'
  ],
  company_name: [
    'nazwa firmy', 'company', 'company_name', 'nazwa_firmy',
    'firma', 'spółka', 'spolka',
    // MINISTRY OFFICIAL NAMES:
    'nazwa dewelopera'
  ],
  nip: [
    'nip', 'nr nip', 'numer nip', 'tax_id', 'vat_id', 'nr_nip',
    // MINISTRY OFFICIAL NAMES:
    'nr nip'
  ],
  phone: [
    'telefon', 'tel', 'phone', 'numer telefonu', 'kontakt',
    'tel.', 'telefon_kontaktowy', 'numer_telefonu'
  ],
  email: [
    'email', 'e-mail', 'mail', 'adres email', 'contact_email',
    'email_kontaktowy', 'adres_email'
  ],

  // Enhanced developer fields (Ministry required)
  forma_prawna: [
    'forma prawna', 'typ spółki', 'legal_form', 'forma_prawna',
    'rodzaj działalności', 'status prawny firmy',
    // MINISTRY OFFICIAL NAMES:
    'forma prawna dewelopera'
  ],
  adres_siedziby: [
    'adres siedziby', 'siedziba', 'headquarters_address', 'adres_siedziby',
    'adres firmy', 'adres główny'
  ],
  strona_internetowa: [
    'strona internetowa', 'www', 'website', 'strona_internetowa',
    'adres www', 'portal'
  ],
  osoba_kontaktowa: [
    'osoba kontaktowa', 'kontakt', 'contact_person', 'osoba_kontaktowa',
    'przedstawiciel', 'odpowiedzialny'
  ],
  
  // Investment info
  investment_name: [
    'inwestycja', 'nazwa inwestycji', 'project', 'investment',
    'investment_name', 'projekt', 'nazwa_inwestycji', 'osiedle'
  ],
  investment_address: [
    'adres', 'adres inwestycji', 'address',
    'investment_address', 'adres_inwestycji', 'lokalizacja'
  ],
  investment_city: [
    'miasto', 'miejscowość', 'city', 'town', 'gmina',
    'miejscowosc', 'investment_city'
  ],

  // Additional Ministry-required fields
  budynek: [
    'budynek', 'numer budynku', 'building', 'building_number',
    'nr budynku', 'budynek_nr'
  ],
  klatka: [
    'klatka', 'klatka schodowa', 'staircase', 'nr klatki',
    'klatka_schodowa', 'entrance'
  ],
  stan_wykonczenia: [
    'stan wykończenia', 'wykończenie', 'finishing', 'standard',
    'stan_wykonczenia', 'stan wykończenia'
  ],
  technologia_budowy: [
    'technologia budowy', 'konstrukcja', 'building_technology',
    'technologia_budowy', 'typ konstrukcji'
  ],
  powierzchnia_calkowita: [
    'powierzchnia całkowita', 'pow całkowita', 'total_area',
    'powierzchnia_calkowita', 'całkowita m2'
  ],
  powierzchnia_piwnicy: [
    'powierzchnia piwnicy', 'piwnica m2', 'basement_area',
    'powierzchnia_piwnicy', 'piwnica'
  ],
  powierzchnia_strychu: [
    'powierzchnia strychu', 'strych m2', 'attic_area',
    'powierzchnia_strychu', 'poddasze'
  ],
  miejsca_postojowe_liczba: [
    'liczba miejsc parkingowych', 'liczba parkingów', 'parking_count',
    'miejsca_postojowe_liczba', 'ile parkingów'
  ],
  miejsca_postojowe_rodzaj: [
    'rodzaj parkingu', 'typ parkingu', 'parking_type',
    'miejsca_postojowe_rodzaj', 'typ miejsc parkingowych'
  ],
  komorki_lokatorskie_liczba: [
    'liczba komórek', 'ile komórek', 'storage_count',
    'komorki_lokatorskie_liczba', 'liczba pomieszczeń'
  ],
  komorki_lokatorskie_powierzchnie: [
    'powierzchnie komórek', 'komórki m2', 'storage_areas',
    'komorki_lokatorskie_powierzchnie', 'powierzchnia komórek'
  ],
  winda: [
    'winda', 'elevator', 'lift', 'dostęp windą',
    'czy winda', 'wind'
  ],
  klimatyzacja: [
    'klimatyzacja', 'klima', 'air_conditioning', 'AC',
    'czy klimatyzacja', 'klimatyzowana'
  ],
  ogrzewanie: [
    'ogrzewanie', 'heating', 'system grzewczy', 'typ ogrzewania',
    'źródło ciepła', 'heating_type'
  ],
  dostep_dla_niepelnosprawnych: [
    'dostęp dla niepełnosprawnych', 'niepełnosprawni', 'accessibility',
    'dostep_dla_niepelnosprawnych', 'przystosowanie'
  ],
  ekspozycja: [
    'ekspozycja', 'strony świata', 'orientation', 'nasłonecznienie',
    'kierunki świata', 'exposure'
  ],
  widok_z_okien: [
    'widok z okien', 'widok', 'view', 'panorama',
    'widok_z_okien', 'na co widok'
  ],
  data_rezerwacji: [
    'data rezerwacji', 'rezerwacja', 'reserved_date',
    'data_rezerwacji', 'zarezerwowano'
  ],
  data_sprzedazy: [
    'data sprzedaży', 'sprzedaż', 'sale_date',
    'data_sprzedazy', 'sprzedano'
  ],
  data_przekazania: [
    'data przekazania', 'przekazanie', 'handover_date',
    'data_przekazania', 'oddano'
  ],
  forma_wlasnosci: [
    'forma własności', 'typ własności', 'ownership_type',
    'forma_wlasnosci', 'własność'
  ],
  ksiega_wieczysta: [
    'księga wieczysta', 'nr księgi', 'land_registry',
    'ksiega_wieczysta', 'numer księgi wieczystej'
  ],
  udzial_w_gruncie: [
    'udział w gruncie', 'udział gruntu', 'land_share',
    'udzial_w_gruncie', 'procent gruntu'
  ],
  waluta: [
    'waluta', 'currency', 'PLN', 'EUR', 'USD',
    'w jakiej walucie', 'symbol waluty'
  ]
}

export interface RowValidationStats {
  tooFewColumns: number
  emptyRows: number
  soldProperties: number
  invalidCriticalData: number
  successfullyParsed: number
  details: {
    rowNumber: number
    reason: string
    columnCount?: number
  }[]
}

export interface SmartParseResult {
  success: boolean
  data: ParsedProperty[]
  mappings: { [key: string]: string }
  errors: string[]
  suggestions: { [key: string]: string[] }
  confidence: number
  totalRows: number
  validRows: number
  validationStats?: RowValidationStats
  detectedFormat?: 'ministerial' | 'inpro' | 'custom'
  formatConfidence?: number
  formatDetails?: string
}

export interface ParsedProperty {
  // Basic property data
  property_number?: string
  property_type?: string
  price_per_m2?: number
  total_price?: number
  final_price?: number
  area?: number
  parking_space?: string
  parking_price?: number
  status?: string

  // Ministry Schema 1.13 required fields
  wojewodztwo?: string
  powiat?: string
  gmina?: string
  miejscowosc?: string
  ulica?: string
  numer_nieruchomosci?: string
  kod_pocztowy?: string
  liczba_pokoi?: number
  kondygnacja?: number
  powierzchnia_balkon?: number
  powierzchnia_taras?: number
  powierzchnia_loggia?: number
  powierzchnia_ogrod?: number
  construction_year?: number
  energy_class?: string
  data_pierwszej_oferty?: string

  // Always include raw_data for fallback
  raw_data: { [key: string]: any }
}

export interface DeveloperInfo {
  developer_name?: string
  company_name?: string
  nip?: string
  phone?: string
  email?: string
  investment_name?: string
  investment_address?: string
  investment_city?: string
}

/**
 * Smart CSV parser with fuzzy matching and intelligent column detection
 */
export class SmartCSVParser {
  private csvContent: string
  private headers: string[] = []
  private rows: string[][] = []
  private mappings: { [key: string]: string } = {}
  private confidence: number = 0
  private validationStats: RowValidationStats = {
    tooFewColumns: 0,
    emptyRows: 0,
    soldProperties: 0,
    invalidCriticalData: 0,
    successfullyParsed: 0,
    details: []
  }

  constructor(csvContent: string) {
    this.csvContent = csvContent
    this.parseCSV()
  }

  private parseCSV() {
    const lines = this.csvContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)

    if (lines.length === 0) {
      throw new Error('Plik CSV jest pusty')
    }

    // Detect separator by analyzing the entire file
    const separator = this.detectSeparator(lines)
    console.log(`🔍 PARSER: Detected separator: "${separator}" (${separator === ';' ? 'semicolon' : 'comma'})`)

    // Parse header
    this.headers = this.parseCSVLine(lines[0], separator)
    console.log(`📊 PARSER: Header has ${this.headers.length} columns`)
    console.log(`📊 PARSER: First 5 headers:`, this.headers.slice(0, 5))

    // Parse data rows
    this.rows = lines.slice(1).map((line, idx) => {
      const parsed = this.parseCSVLine(line, separator)
      if (idx < 3) { // Log first 3 data rows
        console.log(`📊 PARSER: Row ${idx + 2} has ${parsed.length} columns. First 3 values:`, parsed.slice(0, 3))
      }
      return parsed
    })
  }

  /**
   * Detect CSV separator by analyzing the entire file
   * Returns the most common separator (comma or semicolon) found outside quoted fields
   */
  private detectSeparator(lines: string[]): ',' | ';' {
    const separatorCounts = { ',': 0, ';': 0 }

    // Analyze first 10 lines (or all if fewer) to detect separator
    const sampleSize = Math.min(10, lines.length)

    for (let lineIdx = 0; lineIdx < sampleSize; lineIdx++) {
      const line = lines[lineIdx]
      let inQuotes = false

      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        const nextChar = line[i + 1]

        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            i++ // Skip escaped quote
          } else {
            inQuotes = !inQuotes
          }
        } else if (!inQuotes) {
          if (char === ',') separatorCounts[',']++
          if (char === ';') separatorCounts[';']++
        }
      }
    }

    // Return the separator with higher count (default to semicolon for Polish CSVs)
    return separatorCounts[';'] >= separatorCounts[','] ? ';' : ','
  }

  private parseCSVLine(line: string, separator: string): string[] {
    // RFC 4180 compliant CSV parser - handles quoted fields, escaped quotes, and commas
    const result: string[] = []
    let current = ''
    let inQuotes = false
    let i = 0

    while (i < line.length) {
      const char = line[i]
      const nextChar = line[i + 1]

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote ("") inside quoted field
          current += '"'
          i++ // Skip next quote
        } else {
          // Toggle quote state (don't add quote to output)
          inQuotes = !inQuotes
        }
      } else if (char === separator && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
      i++
    }

    result.push(current.trim())
    return result
  }

  /**
   * Detect CSV format type (ministerial/INPRO/custom) based on column signatures
   */
  private detectFormat(): { format: 'ministerial' | 'inpro' | 'custom', confidence: number, details: string } {
    // MINISTERIAL FORMAT SIGNATURE: Official government schema columns (58 fields)
    // UNIQUE fields that differentiate from INPRO
    const ministerialSignatures = [
      'Nr lokalu lub domu jednorodzinnego nadany przez dewelopera',
      'Cena m 2 powierzchni użytkowej lokalu mieszkalnego / domu jednorodzinnego [zł]',
      'Cena lokalu mieszkalnego lub domu jednorodzinnego będących przedmiotem umowy stanowiąca iloczyn ceny m2 oraz powierzchni [zł]',
      'Nazwa dewelopera', // First column in ministerial schema
      'Forma prawna dewelopera', // Second column in ministerial schema
      'Rodzaj nieruchomości: lokal mieszkalny, dom jednorodzinny' // Exact ministerial wording
    ]

    // INPRO FORMAT SIGNATURE: Developer software export (40+ columns with ministerial compliance)
    // UNIQUE fields that differentiate from ministerial
    const inproSignatures = [
      'Id nieruchomości', // UNIQUE to INPRO (ministerial doesn't have this)
      'Adres strony internetowej dewelopera',
      'Adres strony internetowej inwestycji',
      'Nr nieruchomości nadany przez dewelopera', // INPRO-specific wording
      'Inne świadczenia pieniężne',
      'Data od której obowiązuje cena za m2 nieruchomości', // INPRO-specific date format
      'Data od której obowiązuje cena nieruchomości'
    ]

    // CUSTOM FORMAT: Simple Polish/English column names
    const customSignatures = [
      'nr lokalu', 'numer lokalu', 'apartment',
      'powierzchnia', 'area', 'metraz',
      'cena', 'price', 'cena całkowita',
      'status', 'dostępność', 'availability'
    ]

    let ministerialScore = 0
    let inproScore = 0
    let customScore = 0

    const normalizedHeaders = this.headers.map(h => h.toLowerCase().trim())

    // Score MINISTERIAL format
    ministerialSignatures.forEach(sig => {
      const normalized = sig.toLowerCase().trim()
      if (normalizedHeaders.some(h => h.includes(normalized) || normalized.includes(h))) {
        ministerialScore++
      }
    })

    // Score INPRO format
    inproSignatures.forEach(sig => {
      const normalized = sig.toLowerCase().trim()
      if (normalizedHeaders.some(h => h.includes(normalized) || normalized.includes(h))) {
        inproScore++
      }
    })

    // Score CUSTOM format (simpler columns)
    customSignatures.forEach(sig => {
      if (normalizedHeaders.some(h => h === sig || h.includes(sig))) {
        customScore++
      }
    })

    // Determine format based on highest score
    const ministerialConfidence = (ministerialScore / ministerialSignatures.length) * 100
    const inproConfidence = (inproScore / inproSignatures.length) * 100
    const customConfidence = (customScore / customSignatures.length) * 100

    // Priority detection:
    // 1. Check for unique MINISTERIAL markers first (official government schema)
    // 2. Then check for unique INPRO markers
    // 3. Fallback to custom format

    if (ministerialScore >= 4) {
      // Strong ministerial signature (4+ unique fields including "Nazwa dewelopera", "Forma prawna")
      return {
        format: 'ministerial',
        confidence: Math.min(ministerialConfidence, 95),
        details: `Ministry Schema 1.13 compliant format (${ministerialScore}/${ministerialSignatures.length} official columns found)`
      }
    } else if (inproScore >= 4) {
      // Strong INPRO signature (4+ unique fields including "Id nieruchomości")
      return {
        format: 'inpro',
        confidence: Math.min(inproConfidence, 95),
        details: `INPRO developer software export detected (${inproScore}/${inproSignatures.length} signature columns found)`
      }
    } else if (ministerialScore >= 2 && inproScore < 2) {
      // Weak ministerial signature but clearly not INPRO
      return {
        format: 'ministerial',
        confidence: Math.min(ministerialConfidence, 75),
        details: `Likely Ministry format (${ministerialScore}/${ministerialSignatures.length} official columns found)`
      }
    } else if (inproScore >= 2) {
      // Weak INPRO signature
      return {
        format: 'inpro',
        confidence: Math.min(inproConfidence, 75),
        details: `Likely INPRO format (${inproScore}/${inproSignatures.length} signature columns found)`
      }
    } else {
      // Custom format
      return {
        format: 'custom',
        confidence: Math.max(customConfidence, 50), // At least 50% for any valid CSV
        details: `Custom developer export (${customScore}/${customSignatures.length} common field patterns found)`
      }
    }
  }

  /**
   * Intelligent column mapping using fuzzy string matching
   */
  public analyzeColumns(): SmartParseResult {
    const mappings: { [key: string]: string } = {}
    const suggestions: { [key: string]: string[] } = {}
    const errors: string[] = []

    // Detect format type
    const formatDetection = this.detectFormat()
    console.log(`🔍 PARSER: Format detected - ${formatDetection.format.toUpperCase()} (${formatDetection.confidence.toFixed(1)}% confidence)`)
    console.log(`📋 PARSER: ${formatDetection.details}`)

    // Normalize headers for comparison
    const normalizedHeaders = this.headers.map(header =>
      header.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    )

    let totalConfidence = 0
    let mappedCount = 0

    // Try to map each required field
    for (const [fieldName, patterns] of Object.entries(COLUMN_PATTERNS)) {
      const matches: Array<{header: string, score: number}> = []

      // Score each header against patterns
      normalizedHeaders.forEach((normalizedHeader, index) => {
        const originalHeader = this.headers[index]
        
        for (const pattern of patterns) {
          const score = this.fuzzyMatch(normalizedHeader, pattern.toLowerCase())
          if (score > 0.6) { // Confidence threshold
            matches.push({ header: originalHeader, score })
          }
        }
      })

      // Sort by best match
      matches.sort((a, b) => b.score - a.score)

      if (matches.length > 0) {
        mappings[fieldName] = matches[0].header
        totalConfidence += matches[0].score
        mappedCount++

        // Add alternative suggestions
        if (matches.length > 1) {
          suggestions[fieldName] = matches.slice(1, 4).map(m => m.header)
        }
      } else {
        errors.push(`Nie znaleziono kolumny dla: ${fieldName}`)
        // Suggest closest matches
        const closest = this.findClosestMatch(fieldName, normalizedHeaders)
        if (closest.length > 0) {
          suggestions[fieldName] = closest
        }
      }
    }

    const confidence = mappedCount > 0 ? totalConfidence / mappedCount : 0
    this.mappings = mappings
    this.confidence = confidence

    // Parse data using discovered mappings
    const data = this.parseData()

    // Count valid rows - any row with meaningful data
    const validRowsCount = data.filter(row => {
      const hasPropertyNumber = !!row.property_number
      const hasPricePerM2 = !!row.price_per_m2
      const hasTotalPrice = !!row.total_price
      const hasRawPropertyNumber = !!row.raw_data?.["Nr lokalu lub domu jednorodzinnego nadany przez dewelopera"]
      const hasAnyData = Object.keys(row.raw_data || {}).length > 0

      return hasPropertyNumber || hasPricePerM2 || hasTotalPrice || hasRawPropertyNumber || hasAnyData
    }).length

    console.log(`📊 PARSER: validRows calculation: ${validRowsCount}/${data.length} rows have data`)

    return {
      success: Object.keys(mappings).length >= 3, // Need at least 3 key fields
      data,
      mappings,
      errors,
      suggestions,
      confidence,
      totalRows: this.rows.length,
      validRows: validRowsCount,
      validationStats: this.validationStats,
      detectedFormat: formatDetection.format,
      formatConfidence: formatDetection.confidence,
      formatDetails: formatDetection.details
    }
  }

  /**
   * Fuzzy string matching for column detection
   */
  private fuzzyMatch(str1: string, str2: string): number {
    // Exact match
    if (str1 === str2) return 1.0

    // Contains match
    if (str1.includes(str2) || str2.includes(str1)) {
      return 0.9
    }

    // Levenshtein distance normalized
    const distance = this.levenshteinDistance(str1, str2)
    const maxLength = Math.max(str1.length, str2.length)
    return 1 - (distance / maxLength)
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array.from({ length: str2.length + 1 }, (_, i) => [i])
    matrix[0] = Array.from({ length: str1.length + 1 }, (_, i) => i)

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2[i - 1] === str1[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          )
        }
      }
    }
    
    return matrix[str2.length][str1.length]
  }

  private findClosestMatch(fieldName: string, headers: string[]): string[] {
    return headers
      .map(header => ({
        header: this.headers[headers.indexOf(header)],
        score: this.fuzzyMatch(fieldName.toLowerCase(), header)
      }))
      .filter(match => match.score > 0.3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(match => match.header)
  }

  /**
   * Detect property status for INPRO format
   * INPRO convention: "X" in price field means sold
   */
  private detectINPROStatus(row: any, rawData: { [key: string]: any }): 'available' | 'sold' | 'reserved' | undefined {
    // Check explicit status field first
    const statusField = rawData['Status'] || rawData['status'] || rawData['Status dostępności']
    if (statusField) {
      const statusLower = String(statusField).toLowerCase()
      if (/sprzeda/i.test(statusLower) || /sold/i.test(statusLower)) return 'sold'
      if (/rezerwa/i.test(statusLower) || /reserved/i.test(statusLower)) return 'reserved'
      if (/dostępn/i.test(statusLower) || /available/i.test(statusLower)) return 'available'
    }

    // INPRO CONVENTION: "X" marker in price fields means sold
    const pricePerM2Field = rawData['Cena za m2 nieruchomości'] || rawData['Cena za m2 nieruchomosci']
    const totalPriceField = rawData['Cena nieruchomości'] || rawData['Cena nieruchomosci']

    if (pricePerM2Field === 'X' || totalPriceField === 'X') {
      return 'sold'
    }

    // If prices are valid numbers, property is available
    if (pricePerM2Field && !isNaN(Number(pricePerM2Field))) {
      return 'available'
    }

    return undefined
  }

  /**
   * Parse actual data using discovered column mappings
   */
  private parseData(): ParsedProperty[] {
    const results: ParsedProperty[] = []

    // Initialize validation statistics
    this.validationStats = {
      tooFewColumns: 0,
      emptyRows: 0,
      soldProperties: 0,
      invalidCriticalData: 0,
      successfullyParsed: 0,
      details: []
    }

    console.log(`🔍 PARSER: parseData() - Processing ${this.rows.length} rows, headers: ${this.headers.length} columns`)

    for (let i = 0; i < this.rows.length; i++) {
      const row = this.rows[i]
      const rowNumber = i + 2 // +2 because: +1 for header, +1 for 1-based indexing

      // VALIDATION 1: Check for completely empty rows
      const hasAnyContent = row.some(cell => cell && cell.trim().length > 0)
      if (!hasAnyContent) {
        this.validationStats.emptyRows++
        this.validationStats.details.push({
          rowNumber,
          reason: 'Empty row (all cells are empty or whitespace)'
        })
        console.log(`⚠️ PARSER: Skipping row ${rowNumber} - completely empty`)
        continue
      }

      // VALIDATION 2: Check column count (must have at least 50% of expected columns)
      if (row.length < this.headers.length * 0.5) {
        this.validationStats.tooFewColumns++
        this.validationStats.details.push({
          rowNumber,
          reason: 'Insufficient columns',
          columnCount: row.length
        })
        console.log(`⚠️ PARSER: Skipping row ${rowNumber} - has ${row.length} columns, expected ${this.headers.length} (less than 50%)`)
        continue
      }

      console.log(`✅ PARSER: Processing row ${rowNumber} - ${row.length} columns (${this.headers.length} expected)`)

      const property: ParsedProperty = {
        raw_data: {}
      }

      // Build raw data object - only map columns that exist in this row
      this.headers.forEach((header, index) => {
        if (index < row.length) {
          property.raw_data[header] = row[index] || ''
        }
      })

      // 🚫 FILTER ON UPLOAD: Skip sold properties (ministry compliance)
      // Check columns 39, 41, 43 (price fields) for "X", "x", or "#VALUE!" markers
      const pricePerM2Header = this.mappings['price_per_m2']
      const totalPriceHeader = this.mappings['total_price']
      const finalPriceHeader = this.mappings['final_price']

      let isSold = false

      // Check price_per_m2 (column 39)
      if (pricePerM2Header) {
        const idx = this.headers.indexOf(pricePerM2Header)
        if (idx !== -1 && idx < row.length) {
          const value = String(row[idx] || '').trim().toUpperCase()
          if (value === 'X' || value === '#VALUE!') {
            isSold = true
          }
        }
      }

      // Check total_price/base_price (column 41)
      if (totalPriceHeader && !isSold) {
        const idx = this.headers.indexOf(totalPriceHeader)
        if (idx !== -1 && idx < row.length) {
          const value = String(row[idx] || '').trim().toUpperCase()
          if (value === 'X' || value === '#VALUE!') {
            isSold = true
          }
        }
      }

      // Check final_price (column 43)
      if (finalPriceHeader && !isSold) {
        const idx = this.headers.indexOf(finalPriceHeader)
        if (idx !== -1 && idx < row.length) {
          const value = String(row[idx] || '').trim().toUpperCase()
          if (value === 'X' || value === '#VALUE!') {
            isSold = true
          }
        }
      }

      // VALIDATION 3: Skip sold properties entirely
      if (isSold) {
        this.validationStats.soldProperties++
        this.validationStats.details.push({
          rowNumber,
          reason: `Sold property (detected "X" or "#VALUE!" marker in price fields)`
        })
        console.log(`🚫 PARSER: Skipping sold property at row ${rowNumber} (apartment: ${property.raw_data[this.mappings['property_number'] || ''] || 'unknown'})`)
        continue
      }

      // Map known fields
      for (const [fieldName, headerName] of Object.entries(this.mappings)) {
        const headerIndex = this.headers.indexOf(headerName)
        if (headerIndex !== -1 && headerIndex < row.length) {
          const value = row[headerIndex]?.trim()

          if (value) {
            switch (fieldName) {
              case 'price_per_m2':
              case 'total_price':
              case 'final_price':
              case 'area':
              case 'parking_price':
                // INPRO FIX: Skip parsing if value is "X" (sold marker)
                if (value === 'X') {
                  console.log(`🔍 PARSER: Detected "X" marker in ${fieldName} - property likely sold`)
                  break
                }
                // Parse numbers, handle Polish number format
                const numValue = this.parseNumber(value)
                if (numValue !== null) {
                  ;(property as any)[fieldName] = numValue
                }
                break

              default:
                // String fields
                ;(property as any)[fieldName] = value
            }
          }
        }
      }

      // INPRO FIX: Detect status using INPRO conventions (must be after raw_data is built)
      const detectedStatus = this.detectINPROStatus(row, property.raw_data)
      if (detectedStatus && !property.status) {
        property.status = detectedStatus
        console.log(`🔍 PARSER: Auto-detected status for property ${property.property_number || 'unknown'}: ${detectedStatus}`)
      }

      // MINISTRY CSV FIX: Calculate area if missing (area = total_price / price_per_m2)
      if (!property.area && property.total_price && property.price_per_m2 && property.price_per_m2 > 0) {
        property.area = Math.round((property.total_price / property.price_per_m2) * 100) / 100
      }

      // MINISTRY CSV FIX: Calculate price_per_m2 if missing
      if (!property.price_per_m2 && property.total_price && property.area && property.area > 0) {
        property.price_per_m2 = Math.round((property.total_price / property.area) * 100) / 100
      }

      // MINISTRY CSV FIX: Calculate total_price if missing
      if (!property.total_price && property.price_per_m2 && property.area && property.area > 0) {
        property.total_price = Math.round(property.price_per_m2 * property.area * 100) / 100
      }

      // VALIDATION 4: Check critical fields before including
      // At least ONE of: property_number, area, or price must be valid
      const hasPropertyNumber = property.property_number && property.property_number.trim().length > 0
      const hasValidArea = property.area && property.area > 0
      const hasValidPrice = (property.price_per_m2 && property.price_per_m2 > 0) ||
                           (property.total_price && property.total_price > 0) ||
                           (property.final_price && property.final_price > 0)

      if (!hasPropertyNumber && !hasValidArea && !hasValidPrice) {
        this.validationStats.invalidCriticalData++
        this.validationStats.details.push({
          rowNumber,
          reason: 'Missing all critical data (no property number, area, or price)'
        })
        console.log(`⚠️ PARSER: Skipping row ${rowNumber} - missing all critical data (property_number, area, price)`)
        continue
      }

      // Row is valid - include it in results
      if (Object.keys(property.raw_data).length > 0) {
        this.validationStats.successfullyParsed++
        results.push(property)
      }
    }

    console.log(`📊 PARSER: Validation summary - Total: ${this.rows.length}, Parsed: ${this.validationStats.successfullyParsed}, Skipped: ${this.validationStats.tooFewColumns + this.validationStats.emptyRows + this.validationStats.soldProperties + this.validationStats.invalidCriticalData}`)
    console.log(`📊 PARSER: Skip reasons - Empty: ${this.validationStats.emptyRows}, Too few columns: ${this.validationStats.tooFewColumns}, Sold: ${this.validationStats.soldProperties}, Invalid data: ${this.validationStats.invalidCriticalData}`)

    return results
  }

  private parseNumber(value: string): number | null {
    if (!value) return null

    // Handle Polish number format (spaces as thousands separator, comma as decimal)
    const cleaned = value
      .replace(/[^\d,.-]/g, '') // Remove everything except digits, comma, dot, dash
      .replace(/\s+/g, '') // Remove spaces
      .replace(',', '.') // Convert comma to dot

    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? null : parsed
  }

  /**
   * Extract developer information from the data
   */
  public extractDeveloperInfo(): DeveloperInfo {
    const developerInfo: DeveloperInfo = {}

    // Look for developer info in first few rows or in consistent fields
    for (const row of this.rows.slice(0, 5)) {
      for (const [fieldName, headerName] of Object.entries(this.mappings)) {
        const headerIndex = this.headers.indexOf(headerName)
        if (headerIndex !== -1 && headerIndex < row.length) {
          const value = row[headerIndex]?.trim()

          if (value && ['developer_name', 'company_name', 'nip', 'phone', 'email', 'investment_name', 'investment_address', 'investment_city'].includes(fieldName)) {
            if (!(fieldName in developerInfo) || !developerInfo[fieldName as keyof DeveloperInfo]) {
              ;(developerInfo as any)[fieldName] = value
            }
          }
        }
      }
    }

    return developerInfo
  }

  /**
   * Extract project name from filename
   */
  public static extractProjectName(filename: string): string {
    // Remove file extension
    let name = filename
      .replace(/\.csv$/i, '')
      .replace(/\.xlsx$/i, '')
      .replace(/\.xls$/i, '')

    // Remove common prefixes
    name = name
      .replace(/^Ceny-ofertowe-mieszkan-dewelopera-/i, '')
      .replace(/^Wzorcowy_zakres_danych_dotyczących_cen_mieszkań/i, 'Ministerstwo')
      .replace(/^dane-/i, '')
      .replace(/^data-/i, '')
      .replace(/^export-/i, '')
      .replace(/^raport-/i, '')

    // Replace separators with spaces
    name = name
      .replace(/[-_]/g, ' ')
      .trim()

    // If name is empty or too generic (just date or numbers), use date-based default
    if (!name || name.length < 3 || /^\d{4}[-\s]\d{2}[-\s]\d{2}$/.test(name)) {
      const date = new Date().toISOString().split('T')[0]
      name = `Import z ${date}`
    } else {
      // Capitalize first letter of each word
      name = name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
    }

    return name
  }

  /**
   * Get column mapping suggestions for user review
   */
  public getColumnSuggestions(): { [key: string]: { current: string | null, suggestions: string[] } } {
    const result: { [key: string]: { current: string | null, suggestions: string[] } } = {}

    for (const fieldName of Object.keys(COLUMN_PATTERNS)) {
      result[fieldName] = {
        current: this.mappings[fieldName] || null,
        suggestions: this.findClosestMatch(fieldName, this.headers.map(h => h.toLowerCase()))
      }
    }

    return result
  }
}

/**
 * Main entry point for smart CSV parsing
 */
export function parseCSVSmart(csvContent: string): SmartParseResult {
  try {
    const parser = new SmartCSVParser(csvContent)
    return parser.analyzeColumns()
  } catch (error) {
    return {
      success: false,
      data: [],
      mappings: {},
      errors: [error instanceof Error ? error.message : 'Unknown parsing error'],
      suggestions: {},
      confidence: 0,
      totalRows: 0,
      validRows: 0
    }
  }
}

/**
 * Validate parsed data against Ministry Schema 1.13 requirements (58 fields)
 */
export function validateMinistryCompliance(data: ParsedProperty[]): {
  valid: boolean
  errors: string[]
  warnings: string[]
  complianceScore: number
  totalRequiredFields: number
  missingCriticalFields: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []
  const missingCriticalFields: string[] = []

  if (data.length === 0) {
    errors.push('Brak danych nieruchomości do przetworzenia')
    return {
      valid: false,
      errors,
      warnings,
      complianceScore: 0,
      totalRequiredFields: 58,
      missingCriticalFields: ['property_data']
    }
  }

  // MINISTRY CRITICAL FIELDS (must have for Schema 1.13 compliance)
  const criticalFields = [
    'property_number',    // numer_lokalu
    'total_price',        // cena_calkowita
    'area',              // powierzchnia_uzytkowa
    'price_per_m2',      // cena_za_m2
    'wojewodztwo',       // REQUIRED by Ministry
    'powiat',            // REQUIRED by Ministry
    'gmina'              // REQUIRED by Ministry
  ]

  // MINISTRY RECOMMENDED FIELDS (should have for better compliance)
  const recommendedFields = [
    'property_type',      // typ_lokalu
    'status',            // status_sprzedazy
    'miejscowosc',       // miejscowosc
    'ulica',            // ulica
    'kod_pocztowy',     // kod_pocztowy
    'liczba_pokoi',     // liczba_pokoi
    'kondygnacja',      // pietro/kondygnacja
    'construction_year', // rok_budowy
    'energy_class',     // klasa_energetyczna
    'data_pierwszej_oferty', // data_pierwszej_publikacji
  ]

  let complianceScore = 0
  const totalRequiredFields = 58

  // Check critical fields
  for (const field of criticalFields) {
    const hasField = data.some(item => item[field as keyof ParsedProperty])
    if (hasField) {
      complianceScore += 3 // Critical fields worth more points
    } else {
      errors.push(`KRYTYCZNE: Brak wymaganego pola '${field}'`)
      missingCriticalFields.push(field)
    }
  }

  // Check recommended fields
  for (const field of recommendedFields) {
    const hasField = data.some(item => item[field as keyof ParsedProperty])
    if (hasField) {
      complianceScore += 2
    } else {
      warnings.push(`Zalecane: Brak pola '${field}'`)
    }
  }

  // Data quality checks
  const withoutNumbers = data.filter(item => !item.property_number).length
  if (withoutNumbers > data.length * 0.1) {
    warnings.push(`${withoutNumbers} mieszkań bez numeru lokalu (${Math.round(withoutNumbers/data.length*100)}%)`)
  }

  const withoutPrices = data.filter(item => !item.total_price || !item.price_per_m2).length
  if (withoutPrices > 0) {
    errors.push(`${withoutPrices} mieszkań bez kompletnych danych cenowych`)
  }

  const withoutLocation = data.filter(item =>
    !item.raw_data?.wojewodztwo && !item.raw_data?.powiat && !item.raw_data?.gmina
  ).length
  if (withoutLocation > 0) {
    errors.push(`${withoutLocation} mieszkań bez wymaganych danych lokalizacji (województwo/powiat/gmina)`)
  }

  // Additional Ministry validation
  const invalidPrices = data.filter(item =>
    (item.price_per_m2 && item.price_per_m2 <= 0) ||
    (item.total_price && item.total_price <= 0)
  ).length
  if (invalidPrices > 0) {
    errors.push(`${invalidPrices} mieszkań z nieprawidłowymi cenami (≤ 0)`)
  }

  const invalidAreas = data.filter(item => item.area && item.area <= 0).length
  if (invalidAreas > 0) {
    errors.push(`${invalidAreas} mieszkań z nieprawidłową powierzchnią (≤ 0)`)
  }

  // Calculate percentage compliance
  const maxScore = (criticalFields.length * 3) + (recommendedFields.length * 2)
  const compliancePercentage = Math.round((complianceScore / maxScore) * 100)

  // Ministry compliance threshold: 77% (45/58 fields)
  const isCompliant = errors.length === 0 && compliancePercentage >= 77

  if (!isCompliant && errors.length === 0) {
    warnings.push(`Zgodność Ministerstwa: ${compliancePercentage}% (wymagane: 77%)`)
  }

  return {
    valid: isCompliant,
    errors,
    warnings,
    complianceScore: compliancePercentage,
    totalRequiredFields,
    missingCriticalFields
  }
}

/**
 * Parse Excel file using XLSX library
 */
export function parseExcelFile(buffer: Buffer, sheetName?: string): SmartParseResult {
  try {
    // Read Excel workbook
    const workbook = XLSX.read(buffer, { 
      type: 'buffer',
      cellDates: true,
      cellNF: false,
      cellText: false
    })
    
    // Get first sheet or specified sheet
    const sheet = sheetName && workbook.Sheets[sheetName] 
      ? workbook.Sheets[sheetName]
      : workbook.Sheets[workbook.SheetNames[0]]
    
    if (!sheet) {
      return {
        success: false,
        data: [],
        mappings: {},
        errors: ['Nie znaleziono arkusza w pliku Excel'],
        suggestions: {},
        confidence: 0,
        totalRows: 0,
        validRows: 0
      }
    }
    
    // Convert to array of arrays (like CSV)
    const jsonData = XLSX.utils.sheet_to_json(sheet, { 
      header: 1,
      defval: '',
      blankrows: false
    }) as string[][]
    
    // Convert to CSV-like format for existing parser
    const csvContent = convertExcelArrayToCSV(jsonData)
    
    // Use existing smart CSV parser
    return parseCSVSmart(csvContent)
    
  } catch (error) {
    return {
      success: false,
      data: [],
      mappings: {},
      errors: [error instanceof Error ? error.message : 'Błąd parsowania Excel'],
      suggestions: {},
      confidence: 0,
      totalRows: 0,
      validRows: 0
    }
  }
}

/**
 * Parse Excel from File object (for web upload)
 */
export async function parseExcelFileFromBlob(file: File, sheetName?: string): Promise<SmartParseResult> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    return parseExcelFile(buffer, sheetName)
  } catch (error) {
    return {
      success: false,
      data: [],
      mappings: {},
      errors: [error instanceof Error ? error.message : 'Błąd odczytu pliku Excel'],
      suggestions: {},
      confidence: 0,
      totalRows: 0,
      validRows: 0
    }
  }
}

/**
 * Get available sheet names from Excel file
 */
export function getExcelSheetNames(buffer: Buffer): string[] {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    return workbook.SheetNames
  } catch {
    return []
  }
}

/**
 * Convert Excel array data to CSV format string
 */
function convertExcelArrayToCSV(data: string[][]): string {
  if (data.length === 0) return ''
  
  // Escape and quote fields as needed
  const escapedData = data.map(row => 
    row.map(cell => {
      const cellStr = String(cell || '').trim()
      
      // Quote if contains comma, quotes, or newlines
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`
      }
      
      return cellStr
    }).join(',')
  )
  
  return escapedData.join('\n')
}

/**
 * Unified parser function that handles both CSV and Excel files
 */
export function parsePropertyFile(
  content: string | Buffer, 
  filename: string,
  sheetName?: string
): SmartParseResult {
  const isExcel = /\.(xlsx?|xlsm)$/i.test(filename)
  
  if (isExcel && Buffer.isBuffer(content)) {
    return parseExcelFile(content, sheetName)
  } else if (typeof content === 'string') {
    return parseCSVSmart(content)
  } else {
    return {
      success: false,
      data: [],
      mappings: {},
      errors: ['Nieobsługiwany typ pliku lub błędne dane wejściowe'],
      suggestions: {},
      confidence: 0,
      totalRows: 0,
      validRows: 0
    }
  }
}