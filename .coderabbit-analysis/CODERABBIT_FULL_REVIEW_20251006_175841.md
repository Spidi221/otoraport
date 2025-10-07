Starting CodeRabbit review in plain text mode...

Connecting to review service
Setting up
Analyzing
Reviewing

============================================================================
File: src/lib/performance.ts
Line: 451 to 453
Type: potential_issue

Comment:
Utrata funkcjonalności: metoda nie może czyścić cache bez parametru paths.

Usunięcie parametru paths sprawia, że niemożliwe jest określenie, które ścieżki mają być wyczyszczone z cache Cloudflare. Obecna implementacja niczego nie robi (tylko zwraca true), co może prowadzić do nieświeżych danych w CDN.



Należy przywrócić parametr paths lub uzyskać listę ścieżek w inny sposób. Jeśli zamierzone jest czyszczenie całego cache, dodaj wyraźny komentarz i właściwą implementację:

-  private static async purgeCloudflare(): Promise {
-    // Implement Cloudflare cache purge
+  private static async purgeCloudflare(paths: string[]): Promise {
+    // TODO: Implement Cloudflare cache purge API call for paths
+    // Example: POST to https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache
+    console.log('Purging Cloudflare cache for paths:', paths);
     return true;
   }

Prompt for AI Agent:
In src/lib/performance.ts around lines 451-453, the purgeCloudflare method currently has no way to know which URLs to purge and just returns true; restore the API to accept a paths: string[] parameter (or alternatively retrieve the list of paths internally) and implement the Cloudflare purge call: validate paths is non-empty, call the Cloudflare API endpoint (or use existing Cloudflare client) with {files: paths} and handle errors (return false or throw on failure), or if the intent is to purge everything replace with a clear implementation that calls the Cloudflare purge_everything option and add a clear comment about that behavior.



============================================================================
File: src/lib/bulk-operations.ts
Line: 79 to 83
Type: potential_issue

Comment:
Krytyczna niezgodność typów między deklaracją a użyciem.

Interfejs BulkExportOptions (linie 79-83) nie zgadza się z typem parametru w metodzie bulkExportData (linie 216-221):

1. W bulkExportData: includeProjects i includeAnalytics są wymagane (boolean)
2. W BulkExportOptions: są opcjonalne (boolean?)
3. W bulkExportData: istnieje pole dateRange, którego brakuje w BulkExportOptions
4. Pole dateRange nie jest nigdzie używane w implementacji

To spowoduje błąd kompilacji TypeScript w linii 254, gdzie options jest przekazywane do processBulkExport.


Zastosuj tę poprawkę, aby ujednolicić typy:

  async bulkExportData(developerId: string, options: {
-    format: 'csv' | 'xlsx' | 'json'
-    includeProjects: boolean
-    includeAnalytics: boolean
-    dateRange?: { from: string, to: string }
-  }): Promise {
+    format: 'csv' | 'xlsx' | 'json' | 'xml'
+    includeProjects?: boolean
+    includeAnalytics?: boolean
+  }): Promise {


Lub alternatywnie, użyj bezpośrednio typu BulkExportOptions:

-  async bulkExportData(developerId: string, options: {
-    format: 'csv' | 'xlsx' | 'json'
-    includeProjects: boolean
-    includeAnalytics: boolean
-    dateRange?: { from: string, to: string }
-  }): Promise {
+  async bulkExportData(developerId: string, options: BulkExportOptions): Promise {



Also applies to: 216-221, 458-458

Prompt for AI Agent:
In src/lib/bulk-operations.ts around lines 79-83 and 216-221 (also impacting calls at 254 and 458), the BulkExportOptions interface and bulkExportData parameter types disagree: includeProjects/includeAnalytics are optional in the interface but required in bulkExportData, and bulkExportData defines an unused dateRange field missing from the interface. Fix by making the types consistent — remove the unused dateRange from bulkExportData and adjust bulkExportData to accept BulkExportOptions (with includeProjects and includeAnalytics either made required in the interface or made optional in the function signature to match usage), then update any call sites (line 254 and 458) to pass a value that matches the unified BulkExportOptions type.



============================================================================
File: .coderabbit-analysis/eslint-full-report.txt
Line: 16 to 60
Type: refactor_suggestion

Comment:
Rozważ usunięcie typów any z głównych modułów API.

Raport ESLint pokazuje pozostałe błędy @typescript-eslint/no-explicit-any w kluczowych plikach routingu API:
- src/app/api/properties/route.ts (linie 58, 110)
- src/app/api/stripe/create-checkout-session/route.ts (linia 130)
- src/app/api/stripe/webhook/route.ts (linie 46, 74)

Zastąpienie any typem unknown wraz z odpowiednią walidacją poprawiłoby bezpieczeństwo typów w zgodzie ze wzorcem stosowanym w tym PR.




============================================================================
File: .coderabbit-analysis/eslint-full-report.txt
Line: 73 to 94
Type: potential_issue

Comment:
Napraw niezaescapowane cudzysłowy w stronach publicznych.

Pliki src/app/page.tsx i src/app/privacy/page.tsx zawierają niezaescapowane znaki cudzysłowu ("), które powinny zostać zastąpione encjami HTML (&quot;, &ldquo;, &#34;, lub &rdquo;) zgodnie z zasadami React.



Zastosuj automatyczne poprawki ESLint:
npx eslint --fix src/app/page.tsx src/app/privacy/page.tsx src/app/terms/page.tsx

Prompt for AI Agent:
.coderabbit-analysis/eslint-full-report.txt lines 73-94: several JSX text nodes in src/app/page.tsx and src/app/privacy/page.tsx (and referenced src/app/terms/page.tsx) contain unescaped double quotes causing react/no-unescaped-entities errors; fix by replacing " with an HTML entity (e.g., &quot; or &#34;) in those literal strings or run the automated ESLint fixer and commit the results: npx eslint --fix src/app/page.tsx src/app/privacy/page.tsx src/app/terms/page.tsx, review the changed lines to ensure quotes in JSX text are now entities, and push the updated files.



============================================================================
File: .coderabbit-analysis/eslint-full-report.txt
Line: 148 to 150
Type: potential_issue

Comment:
Błąd parsowania w error-boundary.tsx.

Ten błąd parsowania koreluje z błędami TypeScript w pliku .coderabbit-analysis/typescript-errors.txt. Plik src/components/error-boundary.tsx zawiera błędy składni, które blokują kompilację.




============================================================================
File: .coderabbit-analysis/typescript-errors.txt
Line: 1 to 108
Type: potential_issue

Comment:
Krytyczne błędy składni blokują kompilację

108 błędów parsowania w src/components/error-boundary.tsx (Invalid character, Unterminated string literal, brakujące identyfikatory) – napraw je przed merge.




============================================================================
File: src/lib/performance.ts
Line: 456 to 458
Type: potential_issue

Comment:
Utrata funkcjonalności: metoda nie może czyścić cache bez parametru paths.

Podobnie jak w przypadku purgeCloudflare, usunięcie parametru paths sprawia, że niemożliwe jest określenie, które ścieżki mają być wyczyszczone z cache Vercel.



Należy przywrócić parametr paths:

-  private static async purgeVercel(): Promise {
-    // Implement Vercel cache purge
+  private static async purgeVercel(paths: string[]): Promise {
+    // TODO: Implement Vercel cache purge API call for paths
+    // Example: POST to https://api.vercel.com/v1/purge with paths in body
+    console.log('Purging Vercel cache for paths:', paths);
     return true;
   }

Prompt for AI Agent:
In src/lib/performance.ts around lines 456 to 458, the purgeVercel method was changed to have no parameters which removes the ability to specify which paths to purge; restore a parameter paths: string[] similar to purgeCloudflare, update the method signature to async purgeVercel(paths: string[]): Promise, validate that paths is provided and non-empty, use those paths when calling the Vercel cache purge API (or iterate and call per-path), return true only on successful purge and false or throw on failure, and update all callers/tests to pass the paths array accordingly.



============================================================================
File: .coderabbit-analysis/typescript-errors.txt
Line: 112 to 146
Type: potential_issue

Comment:
Krytyczne błędy w src/types/supabase-generated.ts  
Plik zawiera liczne błędy parsowania (TS1434, TS1005) – wygeneruj typy ponownie:  
npx supabase gen types typescript --project-id  > src/types/supabase-generated.ts

Prompt for AI Agent:
In .coderabbit-analysis/typescript-errors.txt around lines 112 to 146, the generated file src/types/supabase-generated.ts contains parse errors (TS1434, TS1005) from a bad or stale generation; regenerate the Supabase TypeScript types using the Supabase CLI (run npx supabase gen types typescript --project-id  and redirect the output to src/types/supabase-generated.ts, replacing ), verify the file compiles, and commit the updated src/types/supabase-generated.ts to the repo.



============================================================================
File: src/components/help/GuidedTour.tsx
Line: 78 to 97
Type: potential_issue

Comment:
Usuń odwołanie do completeTour przed inicjalizacją

W pierwszym renderze komponentu useCallback musi odczytać wszystkie zależności. W tym miejscu completeTour i nextStep nie są jeszcze zainicjalizowane (ciągle w TDZ), co kończy się ReferenceError: Cannot access 'completeTour' before initialization. Przenieś definicje completeTour/nextStep powyżej completeCurrentStep albo rozbij zależność (np. użyj useRef, wywołuj completeTour wewnątrz setTimeout po ustawieniu handlerów). Bez tego komponent zgłosi wyjątek przy każdym uruchomieniu.

Prompt for AI Agent:
In src/components/help/GuidedTour.tsx around lines 78 to 97, completeCurrentStep captures completeTour and nextStep before they're initialized, causing a TDZ ReferenceError; fix by ensuring completeTour and nextStep are defined before this useCallback (move their declarations above completeCurrentStep) or remove them from the callback dependencies and call them via stable refs (useRef to store the handlers and call ref.current() inside the setTimeout) so the callback no longer accesses uninitialized bindings.



============================================================================
File: src/components/help/GuidedTour.tsx
Line: 38 to 58
Type: potential_issue

Comment:
Zachowaj referencję handlera wymaganego działania

W cleanupHighlight zdejmujesz listener przy pomocy handleRequiredActionRef.current, ale ten ref jest na bieżąco nadpisywany nowym callbackiem przy każdej zmianie kroku. Gdy przechodzimy dalej, próbujesz usunąć listener inną referencją niż ta, którą dodałeś — stary handler zostaje na elemencie, co powoduje wielokrotne wywołania i wycieki. Przechowuj użyty handler w osobnym ref (np. attachedActionHandlerRef) i korzystaj z niego przy add/removeEventListener, a po sprzątaniu zeruj referencję.

Prompt for AI Agent:
In src/components/help/GuidedTour.tsx around lines 38 to 58, the cleanup removes the current handleRequiredActionRef.current which may differ from the handler actually attached earlier; create a new ref (e.g., attachedActionHandlerRef) to store the exact function you pass to addEventListener when attaching the click handler, use attachedActionHandlerRef.current when removing the listener in cleanupHighlight, and after successful removal set attachedActionHandlerRef.current = null to avoid stale references and double handlers.



Review completed ✔
