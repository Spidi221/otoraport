# Admin Subscriptions Page - Design Documentation

## Overview

Premium admin panel for managing OTORAPORT subscriptions with sophisticated UI/UX design. This page provides comprehensive revenue analytics, failed payment tracking, and manual subscription management controls.

**Location:** `/admin/subscriptions`

**Access:** Admin-only (requires authentication + admin role check)

## Design Philosophy

- **Premium SaaS Aesthetic**: Professional, modern design matching top-tier SaaS admin panels
- **Information Hierarchy**: Clear visual hierarchy guiding admin attention to most important metrics
- **Data-Driven**: Rich visualizations for quick insights
- **Action-Oriented**: Easy access to management controls
- **Polish Language**: All UI text in Polish for target market

## Page Structure

### 1. Header Section

**Purpose:** Navigation and quick actions

**Design Elements:**
- Sticky top header with white background and subtle shadow
- Breadcrumb navigation back to dashboard
- Page title: "Panel Administracyjny"
- Action buttons:
  - Refresh data (with icon)
  - Export report (with icon)
- Clean, minimal design with ample spacing

**Color Scheme:**
- Background: `bg-white`
- Border: `border-gray-200`
- Shadow: `shadow-sm`

### 2. Revenue Dashboard (Section 1)

**Purpose:** High-level revenue metrics and trends

#### Summary Cards (4 cards)

**Layout:** Grid layout (4 columns on desktop, responsive on mobile)

**Card 1: Monthly Recurring Revenue (MRR)**
- Primary metric: Current MRR in PLN
- Trend indicator: Percentage change vs. previous month
- Icon: `TrendingUp` in emerald
- Background gradient: Emerald tones
- Typography: Large font-mono for numbers

**Card 2: Annual Recurring Revenue (ARR)**
- Primary metric: MRR × 12
- Trend indicator: Same as MRR
- Icon: `DollarSign` in blue
- Background gradient: Blue tones

**Card 3: Active Subscriptions**
- Primary metric: Count of active paying users
- Trend indicator: Growth in subscriber count
- Icon: `Users` in purple
- Background gradient: Purple tones

**Card 4: Churn Rate**
- Primary metric: Percentage (cancelled/total)
- Trend indicator: Inverted (lower is better)
- Icon: `UserMinus` in amber
- Background gradient: Amber tones
- Special styling: Red for increases, green for decreases

**Card Design Features:**
- Glassmorphism effect with gradient overlays
- Hover state: Enhanced shadow
- Smooth transitions
- Responsive padding and spacing
- Clear visual separation between metrics

#### Charts (2 charts side-by-side)

**Chart 1: MRR Trend (Line Chart)**
- Type: Recharts LineChart
- Data: Last 12 months of MRR
- X-axis: Month abbreviations (Sty, Lut, Mar, etc.)
- Y-axis: Revenue in PLN (formatted as "47k")
- Line styling:
  - Stroke: Blue (#3b82f6)
  - Width: 3px
  - Gradient fill underneath
  - Active dots on hover
- Tooltip: Custom styled with currency formatting
- Grid: Subtle dashed lines

**Chart 2: Revenue by Plan (Bar Chart)**
- Type: Recharts BarChart
- Data: Current month revenue per plan
- Bars:
  - Starter: Blue (#3b82f6)
  - Pro: Purple (#8b5cf6)
  - Enterprise: Emerald (#10b981)
- Rounded corners on bars
- Hover effects
- Legend with circular icons

**Container Design:**
- White cards with shadow-lg
- Header with title and subtitle
- Responsive: Side-by-side on desktop, stacked on mobile

### 3. Failed Payments Section

**Purpose:** Track and manage payment failures

**Header:**
- Red-orange gradient background
- Alert icon in red badge
- Title: "Nieudane Płatności"
- Count badge showing total failed payments
- Clear visual urgency

**Filters (4 controls):**
1. Search input (2 columns width):
   - Icon: Search (inside input)
   - Placeholder: "Szukaj po nazwisku lub emailu..."
   - Real-time filtering

2. Plan filter dropdown:
   - Options: All plans, Starter, Pro, Enterprise
   - Icon indicator

3. Status filter dropdown:
   - Options: All statuses, Failed, Requires payment method, Requires action
   - Color-coded badges

4. Date range filter (future enhancement)

**Table Design:**

**Columns:**
1. Klient (Customer):
   - Name (bold)
   - Email (gray, smaller)
   - Multi-line layout

2. Plan:
   - Color-coded badge
   - Starter: Blue
   - Pro: Purple
   - Enterprise: Emerald

3. Kwota (Amount):
   - Right-aligned
   - Font-mono for better readability
   - Bold styling
   - Currency formatting (PLN)

4. Powód niepowodzenia (Failure Reason):
   - Red background badge
   - Clear error message

5. Data próby (Attempted Date):
   - Formatted: "7 paź 2025, 09:15"
   - Gray text

6. Status:
   - Badge with variant:
     - Failed: Red (destructive)
     - Requires payment method: Gray (secondary)
     - Requires action: Blue (default)

7. Akcje (Actions):
   - "Ponów próbę" button
   - Refresh icon
   - Outline style

**Table Features:**
- Rounded border
- Hover effects on rows
- Gray header with semibold text
- Responsive overflow handling
- Empty state:
  - Alert icon
  - Friendly message
  - Gray background

**Pagination:**
- Page size selector: 10, 25, 50
- Previous/Next buttons
- Current page indicator
- Clean, minimal design

### 4. Active Subscriptions Section

**Purpose:** Manage all active customer subscriptions

**Header:**
- Blue-purple gradient background
- Credit card icon
- Title: "Aktywne Subskrypcje"
- Count badge

**Filters (5 controls):**
1. Search (2 columns):
   - Search by name, email, or company
   - Real-time filtering

2. Plan filter:
   - All plans or specific plan

3. Status filter:
   - Active, Trialing, Past Due

4. Sort dropdown:
   - By date, revenue, or customer name
   - Arrow icon indicator

**Table Design:**

**Columns:**
1. Klient:
   - Name (bold)
   - Email (gray)
   - Company name (smaller, lighter gray)
   - 3-line layout when company present

2. Plan:
   - Prominent badge with plan color
   - Semibold font

3. Status:
   - Active: Green badge
   - Trialing: Blue badge
   - Past Due: Red badge

4. MRR:
   - Right-aligned
   - Font-mono
   - Bold
   - Currency formatted

5. Następne rozliczenie (Next Billing):
   - Full date: "15 listopada 2025"
   - Gray text

6. Akcje (Actions):
   - Three-dot menu (MoreVertical icon)
   - Dropdown with options:
     - **Upgrade do Pro** (purple text)
     - **Upgrade do Enterprise** (emerald text)
     - **Downgrade do Starter** (blue text)
     - **Anuluj subskrypcję** (red text)
   - Conditional display based on current plan

**Table Features:**
- Same styling as Failed Payments table
- Hover states
- Responsive design
- Empty state handling

### 5. Subscription Actions Modal

**Purpose:** Manage subscription changes with confirmation

**Modal Types:**

#### Upgrade/Downgrade Modal

**Header:**
- Large icon (ArrowUpCircle for upgrade, ArrowDownCircle for downgrade)
- Bold title
- Clear description

**Customer Info Card:**
- Gray background
- Customer name, email, company
- Clean layout

**Plan Change Summary:**
- Side-by-side comparison
- Current plan → New plan
- Pricing comparison
- Visual arrow between plans
- Color-coded badges

**Effective Date Selector:**
- Dropdown: "Natychmiast" or "Przy następnym rozliczeniu"
- Clear labels

**Proration Info (if immediate):**
- Amber warning card
- Dollar sign icon
- Breakdown:
  - Price difference
  - Days until billing
  - Total charge/refund
- Bold final amount
- Color: Green for charges, Blue for refunds

**Next Billing Info (if later):**
- Blue info card
- Exact date when change takes effect
- Explanation text

**Footer:**
- Cancel button (outline)
- Confirm button (colored):
  - Upgrade: Emerald
  - Downgrade: Blue

#### Cancel Modal

**Warning Design:**
- Red alert styling
- AlertTriangle icon
- Clear warning message
- Impact summary:
  - Last day of access
  - Lost MRR amount (in red)
- Bold, attention-grabbing

**Footer:**
- Cancel button
- Confirm button (red)
- Text: "Potwierdź anulowanie"

### 6. Footer Section

**Design:**
- Centered text
- Gray subtle styling
- Shows:
  - Logged in user email
  - Last data update timestamp
- Polish date formatting

## Color Palette

### Primary Colors
- **Emerald (Revenue positive)**: `#10b981`
- **Red (Revenue negative/Alerts)**: `#ef4444`
- **Blue (Neutral/Primary)**: `#3b82f6`
- **Purple (Premium)**: `#8b5cf6`
- **Amber (Warning)**: `#f59e0b`

### Plan Colors
- **Starter**: Blue tones (`#3b82f6`)
- **Pro**: Purple tones (`#8b5cf6`)
- **Enterprise**: Emerald tones (`#10b981`)

### UI Grays
- **Background**: `#f9fafb` (gray-50)
- **Borders**: `#e5e7eb` (gray-200)
- **Text Primary**: `#111827` (gray-900)
- **Text Secondary**: `#6b7280` (gray-500)

### Status Colors
- **Active**: Emerald (`bg-emerald-100 text-emerald-700`)
- **Trialing**: Blue (`bg-blue-100 text-blue-700`)
- **Past Due**: Red (`bg-red-100 text-red-700`)
- **Failed**: Red (`bg-red-100 text-red-700`)

## Typography System

### Font Families
- **Default**: System font stack
- **Numbers/Currency**: `font-mono` for better readability

### Font Sizes
- **Hero Numbers**: `text-3xl` (30px)
- **Section Titles**: `text-xl` or `text-2xl`
- **Card Titles**: `text-lg`
- **Body Text**: `text-base` (16px)
- **Secondary Text**: `text-sm` (14px)
- **Tiny Text**: `text-xs` (12px)

### Font Weights
- **Bold Headers**: `font-bold` (700)
- **Semibold Subheads**: `font-semibold` (600)
- **Medium Labels**: `font-medium` (500)
- **Regular Body**: `font-normal` (400)

## Spacing System

### Section Gaps
- Between major sections: `space-y-8` (32px)
- Between cards in grid: `gap-6` (24px)
- Internal card spacing: `p-6` (24px)

### Responsive Design
- Desktop: Full multi-column layouts
- Tablet: 2-column layouts
- Mobile: Single column, stacked

## Interactive Elements

### Hover States
- Cards: Enhanced shadow (`shadow-xl`)
- Table rows: Light gray background (`hover:bg-gray-50`)
- Buttons: Darker background variants
- Smooth transitions: `transition-colors`, `transition-shadow`

### Loading States
- Skeleton loaders (future implementation)
- Disabled button states
- Loading spinners for async actions

### Empty States
- Friendly messages
- Helpful icons
- Gray backgrounds
- Clear call-to-action (when applicable)

## Accessibility Features

### Semantic HTML
- Proper heading hierarchy (h1 → h2 → h3)
- Table headers with scope
- Form labels associated with inputs

### Color Contrast
- All text meets WCAG AA standards
- Color not sole indicator of meaning
- Icons supplement color coding

### Keyboard Navigation
- Tab order follows visual flow
- Dropdown menus accessible
- Modal focus management
- Escape to close modals

## Responsive Breakpoints

```css
/* Mobile First */
- Base: < 640px (stacked layouts)
- sm: 640px (tablets)
- md: 768px (small laptops)
- lg: 1024px (desktops)
- xl: 1280px (large screens)
```

### Layout Adjustments
- **Summary Cards**: 1 → 2 → 4 columns
- **Charts**: Stacked → Side-by-side
- **Filters**: Stacked → Grid
- **Tables**: Horizontal scroll on mobile

## Technical Implementation

### Components Created
1. `revenue-dashboard.tsx` - Client component with Recharts
2. `failed-payments-table.tsx` - Client component with filtering
3. `subscriptions-table.tsx` - Client component with actions
4. `subscription-actions-modal.tsx` - Modal dialogs
5. `page.tsx` - Server component with admin checks

### Dependencies
- **Recharts**: Charts and visualizations
- **Lucide React**: Icons
- **Radix UI**: Dropdown, Dialog, Select components
- **Tailwind CSS**: Styling
- **Next.js 15**: Framework

### Data Flow
- Server component fetches user and checks admin access
- Mock data passed to client components (temporary)
- Future: Real API calls to Stripe and Supabase
- Client-side filtering and sorting for responsiveness

### Admin Access Control
```typescript
// Current implementation (development)
- Check if user authenticated
- Verify user exists in developers table
- Future: Add role === 'admin' check

// Production requirement
if (developer.role !== 'admin') {
  redirect('/dashboard?error=forbidden');
}
```

## Future Enhancements

### Planned Features
1. Real-time data updates (WebSocket or polling)
2. Date range filters for failed payments
3. Export to CSV/PDF functionality
4. Email notifications for failed payments
5. Bulk actions (e.g., retry all failed payments)
6. Advanced analytics (cohort analysis, LTV, etc.)
7. Customer communication tools
8. Refund processing UI
9. Subscription notes/tags
10. Activity audit log

### Performance Optimizations
1. Virtual scrolling for large tables
2. Debounced search inputs
3. Memoized chart components
4. Lazy loading for modals
5. Server-side pagination

### UX Improvements
1. Toast notifications for actions
2. Undo functionality for critical actions
3. Keyboard shortcuts
4. Column sorting and reordering
5. Saved filter presets
6. Dashboard customization

## Testing Checklist

### Visual Testing
- [ ] All components render correctly
- [ ] Colors match design system
- [ ] Typography is consistent
- [ ] Spacing is uniform
- [ ] Icons are properly sized
- [ ] Hover states work

### Responsive Testing
- [ ] Mobile (< 640px)
- [ ] Tablet (768px)
- [ ] Desktop (1024px+)
- [ ] Large screens (1440px+)

### Functional Testing
- [ ] Search filters work
- [ ] Pagination works
- [ ] Sorting works
- [ ] Modals open/close
- [ ] Dropdown menus function
- [ ] Admin access control works

### Accessibility Testing
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] Color contrast
- [ ] Focus indicators
- [ ] ARIA labels

## Design Credits

**Design Principles Inspired By:**
- Linear (clean, modern admin UI)
- Stripe Dashboard (revenue metrics)
- Vercel Analytics (chart design)
- Notion (table interactions)

**Component Library:**
- shadcn/ui (base components)
- Tailwind CSS (styling)
- Recharts (data visualization)

---

**Last Updated:** October 9, 2025
**Version:** 1.0.0
**Status:** Initial Implementation Complete (Mock Data)
