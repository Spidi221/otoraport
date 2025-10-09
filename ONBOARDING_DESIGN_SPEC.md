# Onboarding Wizard - Design Specification

## Visual Design System

### Color Palette

```css
Primary (Blue):     #3b82f6  /* Buttons, active states */
Success (Green):    #10b981  /* Completed, checkmarks */
Warning (Amber):    #f59e0b  /* Optional steps, warnings */
Error (Red):        #ef4444  /* Validation errors */
Info (Blue-50):     #eff6ff  /* Help panels */

Neutrals:
- Gray-50:  #f9fafb  /* Backgrounds */
- Gray-100: #f3f4f6  /* Card backgrounds */
- Gray-200: #e5e7eb  /* Borders */
- Gray-500: #6b7280  /* Secondary text */
- Gray-600: #4b5563  /* Tertiary text */
- Gray-900: #111827  /* Primary text */
```

### Typography Scale

```css
/* Headlines */
h1: 3xl (30px) - 4xl (36px), font-bold, gray-900
h2: 2xl (24px), font-bold, gray-900
h3: xl (20px), font-semibold, gray-900

/* Body */
Subtitle: base (16px), gray-600
Body: sm (14px), gray-700
Help text: xs (12px), gray-500

/* Code */
URLs/Code: xs (12px), font-mono, gray-700
```

### Spacing System

```css
/* Container widths */
Step 1-3, 6: max-w-2xl (672px)
Step 5:      max-w-3xl (768px)
Step 4:      max-w-4xl (896px)

/* Internal spacing */
Card padding:     p-6 (24px) to p-8 (32px)
Form fields:      space-y-6 (24px between fields)
Buttons:          gap-3 (12px)
Section margin:   mb-6 to mb-8 (24px-32px)
```

## Step-by-Step Visual Breakdown

### Progress Indicator (All Steps)

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│    ●━━━━━━●━━━━━━●━━━━━━○━━━━━━○━━━━━━○                │
│    ✓      ✓      ✓      4      5      6                │
│  Welcome Logo   CSV   Verify Endpoints Done            │
│                                                         │
└─────────────────────────────────────────────────────────┘

Legend:
● (filled blue) = Completed or current
○ (empty gray)  = Not yet started
✓ (checkmark)   = Completed
━━━━━━          = Progress line (blue if passed, gray if not)
```

### Step 1: Welcome & Company Info

```
┌──────────────────────────────────────────────────────────┐
│                 Witamy w OTORAPORT! 🎉                   │
│      Zacznijmy od kilku podstawowych informacji         │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │                                                 │    │
│  │  🏢 Nazwa firmy *                              │    │
│  │  [_____________________________________]        │    │
│  │                                                 │    │
│  │  📄 NIP (opcjonalne)                           │    │
│  │  [___-___-__-__] Format: XXX-XXX-XX-XX        │    │
│  │                                                 │    │
│  │  📞 Telefon (opcjonalne)                       │    │
│  │  [+48 ___ ___ ___]                            │    │
│  │                                                 │    │
│  │  📍 Adres (opcjonalne)                         │    │
│  │  [________________________________]            │    │
│  │  [________________________________]            │    │
│  │  [________________________________]            │    │
│  │                                                 │    │
│  │                              [ Dalej → ]       │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│    Te informacje pomogą nam lepiej dostosować...        │
└──────────────────────────────────────────────────────────┘
```

### Step 2: Logo Upload

```
┌──────────────────────────────────────────────────────────┐
│              Dodaj logo swojej firmy                     │
│   Logo będzie wyświetlane na Twojej publicznej stronie │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓    │    │
│  │  ┃                                          ┃    │    │
│  │  ┃         ☁️                               ┃    │    │
│  │  ┃    UPLOAD                                ┃    │    │
│  │  ┃                                          ┃    │    │
│  │  ┃  Przeciągnij logo tutaj lub kliknij     ┃    │    │
│  │  ┃  PNG, JPG, SVG (maksymalnie 2MB)        ┃    │    │
│  │  ┃                                          ┃    │    │
│  │  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛    │    │
│  │                                                 │    │
│  │  [ ← Wstecz ]  [ Pomiń ten krok ]  [ Dalej →] │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│    Możesz pominąć ten krok i dodać logo później...     │
└──────────────────────────────────────────────────────────┘

After upload:
┌──────────────────────────────────────────────────────────┐
│  │  ╔═══════════════════════════════════════════╗    │    │
│  │  ║                                           ║    │    │
│  │  ║        ┌──────────────┐                  ║    │    │
│  │  ║        │              │                  ║    │    │
│  │  ║        │  [LOGO IMG]  │                  ║    │    │
│  │  ║        │              │                  ║    │    │
│  │  ║        └──────────────┘                  ║    │    │
│  │  ║                                           ║    │    │
│  │  ║       📄 logo.png • 450 KB               ║    │    │
│  │  ║                                           ║    │    │
│  │  ╚═══════════════════════════════════════════╝    │    │
│  │                                                 │    │
│  │  [ 📤 Zmień ]           [ ✕ Usuń ]            │    │
└──────────────────────────────────────────────────────────┘
```

### Step 3: CSV Upload

```
┌──────────────────────────────────────────────────────────┐
│            Prześlij dane nieruchomości                   │
│       Wgraj plik CSV z danymi Twoich mieszkań           │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  ℹ️ Jak przygotować plik CSV?          [ ▼ ]  │    │
│  └────────────────────────────────────────────────┘    │
│  (Expanded help panel shows here)                       │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓    │    │
│  │  ┃                                          ┃    │    │
│  │  ┃         ☁️                               ┃    │    │
│  │  ┃    UPLOAD                                ┃    │    │
│  │  ┃                                          ┃    │    │
│  │  ┃  Przeciągnij plik CSV tutaj             ┃    │    │
│  │  ┃  CSV (maksymalnie 10MB)                 ┃    │    │
│  │  ┃                                          ┃    │    │
│  │  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛    │    │
│  │                                                 │    │
│  │  [ ← Wstecz ]  [ Pomiń ten krok ]  [ Dalej →] │    │
│  └────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘

After upload:
┌──────────────────────────────────────────────────────────┐
│  │  ╔═══════════════════════════════════════════╗    │    │
│  │  ║  📊  dane-mieszkania.csv                  ║    │    │
│  │  ║      2.3 MB                               ║    │    │
│  │  ║                                           ║    │    │
│  │  ║  ✅ Wykryto 45 mieszkań                  ║    │    │
│  │  ╚═══════════════════════════════════════════╝    │    │
└──────────────────────────────────────────────────────────┘
```

### Step 4: Data Verification

```
┌──────────────────────────────────────────────────────────┐
│              Zweryfikuj swoje dane                       │
│           Sprawdź czy wszystko wygląda dobrze           │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  📊  Wszystkich: 45  ✅ Poprawnych: 43         │    │
│  │                      ⚠️ Z błędami: 2           │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  Podgląd danych        [Zobacz wszystkie (45)] │    │
│  │  ┌──┬────────┬──────┬─────────┬─────────┐     │    │
│  │  │# │ Nazwa  │Pokoje│Powierzch│  Cena   │     │    │
│  │  ├──┼────────┼──────┼─────────┼─────────┤     │    │
│  │  │1 │Apart..│  2   │  45.5   │ 450000  │     │    │
│  │  │2 │Mieszk.│  3   │  67.2   │ 620000  │     │    │
│  │  │3 │Studio │  1   │  32.0   │ 320000  │     │    │
│  │  └──┴────────┴──────┴─────────┴─────────┘     │    │
│  │                                                 │    │
│  │  [ ← Popraw plik ]              [ Dalej → ]   │    │
│  └────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

### Step 5: Endpoint Testing

```
┌──────────────────────────────────────────────────────────┐
│         Twoje endpointy są gotowe! 🎉                   │
│        Sprawdź czy wszystko działa poprawnie            │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  📄 Endpoint XML dla Ministerstwa              │    │
│  │     Format XML zgodny z wymaganiami...         │    │
│  │                                                 │    │
│  │  ╔══════════════════════════════════════════╗  │    │
│  │  ║ https://otoraport.pl/api/public/...xml ║  │    │
│  │  ╚══════════════════════════════════════════╝  │    │
│  │                                                 │    │
│  │  [ Testuj ]  [ 🔗 Otwórz ]    ✅ HTTP 200     │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  📊 Endpoint CSV                                │    │
│  │  (Similar card structure)                       │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  🔐 MD5 Checksum                                │    │
│  │  (Similar card structure)                       │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  Przetestuj wszystkie endpointy                │    │
│  │                      [ Testuj wszystkie ]       │    │
│  │  ✅ Wszystkie endpointy działają poprawnie!    │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  [ ← Wstecz ]                       [ Dalej → ]        │
└──────────────────────────────────────────────────────────┘
```

### Step 6: Completion

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                    ╔═══════╗                            │
│                    ║   ✓   ║  (bouncing animation)      │
│                    ╚═══════╝                            │
│                                                          │
│                    Gotowe! 🎉                           │
│       Twoje konto jest skonfigurowane i gotowe         │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  ✨ Witamy w OTORAPORT!                        │    │
│  │                                                 │    │
│  │  Pomyślnie ukończyłeś konfigurację konta...   │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│                    Co dalej?                            │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  ✅ 🏠 Dashboard                                │    │
│  │     Zarządzaj nieruchomościami i statystyki    │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  ✅ 🔗 Endpointy                                │    │
│  │     Udostępnij dane Ministerstwu               │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  ✅ ⚙️ Ustawienia                               │    │
│  │     Dostosuj swój profil                       │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │                                                 │    │
│  │   Zacznij zarządzać swoimi nieruchomościami   │    │
│  │                                                 │    │
│  │       [  🏠 Przejdź do dashboardu  ]          │    │
│  │            (large, prominent button)           │    │
│  │                                                 │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  Dokumentacja • Pomoc techniczna • FAQ                 │
└──────────────────────────────────────────────────────────┘
```

## Interactive Elements

### Buttons

```css
/* Primary Button (Next, Submit) */
Background: #3b82f6 (blue-600)
Text: white
Padding: 12px 24px
Border-radius: 6px
Hover: Scale 1.02, darker blue
Focus: Ring 2px blue

/* Secondary Button (Back) */
Background: white
Border: 1px #e5e7eb (gray-200)
Text: #111827 (gray-900)
Hover: bg-gray-50

/* Ghost Button (Skip) */
Background: transparent
Text: #6b7280 (gray-500)
Hover: bg-gray-100
```

### Form Inputs

```css
/* Default state */
Border: 1px #e5e7eb (gray-200)
Background: white
Padding: 10px 12px
Border-radius: 6px
Focus: Ring 2px blue, border blue

/* Error state */
Border: 1px #ef4444 (red-500)
Background: #fef2f2 (red-50)
Focus: Ring 2px red

/* Disabled state */
Background: #f3f4f6 (gray-100)
Text: #9ca3af (gray-400)
Cursor: not-allowed
```

### File Upload Zones

```css
/* Default drag zone */
Border: 2px dashed #e5e7eb (gray-200)
Background: transparent
Padding: 48px
Border-radius: 8px
Cursor: pointer
Hover: Border blue-400, bg-blue-50/50

/* Dragging state */
Border: 2px dashed #3b82f6 (blue-500)
Background: #eff6ff (blue-50)

/* Error state */
Border: 2px dashed #fca5a5 (red-300)
Background: #fef2f2 (red-50)
```

## Animations

### Transitions

```css
/* Button hover */
transition: all 200ms ease

/* Progress bar fill */
transition: width 500ms ease-out

/* Step changes */
transition: opacity 300ms ease-in-out

/* File upload hover */
transition: border-color 200ms, background 200ms
```

### Keyframe Animations

```css
/* Success checkmark bounce */
@keyframes bounce-slow {
  0%, 100%: translateY(0)
  50%: translateY(-10px)
}
animation: bounce-slow 2s infinite

/* Loading spinner */
@keyframes spin {
  to: rotate(360deg)
}
animation: spin 1s linear infinite
```

## Responsive Breakpoints

### Mobile (< 768px)

- Stack all elements vertically
- Full-width containers
- Smaller text sizes (h1: 2xl instead of 3xl)
- Progress indicator: Show "Krok X/Y" text only
- Hide long URLs, show "..." with scroll
- Touch-friendly button sizes (min 44px height)

### Tablet (768px - 1024px)

- Maintain centered containers
- 2-column grid for endpoint cards
- Full progress indicator
- Standard button sizes

### Desktop (> 1024px)

- Max container widths
- 3-column grid possible for endpoint cards
- Full feature set
- Hover effects enabled

## Accessibility Features

### Keyboard Navigation

- Tab order follows visual flow
- Focus indicators visible (2px ring)
- Skip links for screen readers
- Escape closes modals/help panels
- Enter submits forms

### Screen Reader Support

```html
<!-- Progress indicator -->
<div role="progressbar" aria-valuenow="3" aria-valuemin="1" aria-valuemax="6">

<!-- File upload -->
<div role="button" aria-label="Upload logo file">

<!-- Endpoint test status -->
<div aria-live="polite" aria-atomic="true">
  <span aria-label="XML endpoint test: Success, HTTP 200">
```

### Color Contrast

All text meets WCAG AA standards:
- Regular text: 4.5:1 minimum
- Large text (18px+): 3:1 minimum
- Interactive elements: Clear non-color indicators

## Print Styles

Not applicable - this is an interactive wizard that shouldn't be printed.

---

**Design Philosophy:**

1. **Clarity Over Cleverness** - Every element has a clear purpose
2. **Progressive Disclosure** - Information revealed when needed
3. **Forgiving Design** - Easy to go back, skip, or correct mistakes
4. **Contextual Help** - Guidance available at every step
5. **Celebratory UX** - Positive reinforcement throughout
6. **Professional Polish** - Enterprise-grade visual quality
7. **Mobile-First** - Works beautifully on all devices

This design creates a **premium onboarding experience** that makes users feel confident, supported, and excited to use OTORAPORT.
