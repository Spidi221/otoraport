# OTORAPORT Onboarding Wizard

A beautiful, multi-step onboarding wizard for OTORAPORT that guides new Polish real estate developers through initial account setup.

## Overview

The onboarding wizard consists of 6 steps (with conditional logic):

1. **Welcome & Company Info** - Basic company information
2. **Logo Upload** - Optional logo upload
3. **CSV Upload** - Optional property data upload
4. **Data Verification** - Conditional (only if CSV uploaded)
5. **Endpoint Testing** - Test ministry API endpoints
6. **Completion** - Success celebration and next steps

## Features

### User Experience
- **Progress Indicator** - Clear visual progress with step numbers
- **Skip Logic** - Optional steps can be skipped intelligently
- **State Persistence** - Progress saved to localStorage and backend
- **Validation** - Real-time inline validation with helpful errors
- **Polish Language** - All text in Polish for target audience
- **Responsive Design** - Works beautifully on all screen sizes
- **Accessibility** - Keyboard navigation, ARIA labels, proper focus management

### Technical Features
- **TypeScript** - Fully typed with Zod schemas
- **Client Components** - React Server Components + Client Components architecture
- **State Management** - Custom hook (`useOnboardingWizard`)
- **File Upload** - Drag & drop with validation
- **CSV Parsing** - Client-side parsing with PapaParse
- **Backend Integration** - API routes for progress tracking
- **Database Persistence** - Supabase RLS-protected tables

## File Structure

```
src/components/onboarding/
├── onboarding-wizard.tsx       # Main wizard controller
├── progress-indicator.tsx      # Step progress component
├── step-welcome.tsx           # Step 1: Company info
├── step-logo.tsx              # Step 2: Logo upload
├── step-csv.tsx               # Step 3: CSV upload
├── step-verification.tsx      # Step 4: Data verification
├── step-endpoints.tsx         # Step 5: Endpoint testing
├── step-completion.tsx        # Step 6: Completion
└── README.md                  # This file

src/hooks/
└── use-onboarding-wizard.ts   # State management hook

src/app/onboarding/
└── page.tsx                   # Main onboarding page (server component)

src/app/api/onboarding/
└── progress/route.ts          # API route for progress tracking

supabase/migrations/
└── 20251009_add_onboarding_progress.sql  # Database schema
```

## State Management

The `useOnboardingWizard` hook manages all wizard state:

```typescript
interface OnboardingState {
  currentStep: number;              // Current step (1-6)
  completedSteps: number[];         // Completed step numbers
  skippedSteps: number[];          // Skipped step numbers
  companyInfo: CompanyInfo;        // Company data from Step 1
  logo: LogoData;                  // Logo data from Step 2
  csv: CSVData;                    // CSV data from Step 3
  endpointTests: EndpointTests;    // Test results from Step 5
}
```

### Key Functions

- `nextStep()` - Advance to next step with skip logic
- `prevStep()` - Go back one step
- `skipStep()` - Skip current step and advance
- `updateCompanyInfo(data)` - Update company info
- `updateLogo(data)` - Update logo data
- `updateCSV(data)` - Update CSV data
- `testEndpoint(endpoint, clientId)` - Test single endpoint
- `testAllEndpoints(clientId)` - Test all endpoints at once
- `completeOnboarding()` - Mark onboarding complete

## Step Details

### Step 1: Welcome & Company Info

**Required Fields:**
- Company name (min 2 chars, max 100 chars)

**Optional Fields:**
- NIP (Polish tax ID, validated format: XXX-XXX-XX-XX)
- Phone (Polish format: +48 XXX XXX XXX)
- Address (textarea, max 500 chars)

**Validation:**
- Real-time validation with Zod schemas
- Inline error messages
- Auto-formatting for NIP and phone

### Step 2: Logo Upload

**Features:**
- Drag & drop or click to upload
- Supported formats: PNG, JPG, SVG
- Max file size: 2MB
- Image preview
- Change/remove uploaded logo
- Can be skipped

**Validation:**
- File type checking
- File size validation
- Clear error messages

### Step 3: CSV Upload

**Features:**
- Drag & drop or click to upload
- Collapsible help panel with:
  - Required columns list
  - Sample CSV download
  - Formatting tips
- Real-time CSV parsing
- Row count display
- Error/warning detection
- Can be skipped

**Required Columns:**
- nazwa (name)
- pokoje (rooms)
- powierzchnia (area)
- cena (price)
- status (status)

**Validation:**
- CSV format validation
- Column presence checking
- Empty field detection
- Max file size: 10MB

### Step 4: Data Verification

**Conditional:** Only shows if CSV was uploaded in Step 3

**Features:**
- Summary card with statistics:
  - Total properties
  - Valid properties
  - Properties with errors
- Preview table (first 10 rows)
- "See all" option for full data
- Error highlighting:
  - Red background for rows with errors
  - Red cells for empty required fields
- Warning display
- Option to go back and fix CSV

### Step 5: Endpoint Testing

**Features:**
- Three endpoint cards:
  1. XML Endpoint (Ministry format)
  2. CSV Endpoint
  3. MD5 Checksum
- Each card has:
  - Full URL display
  - Copy button
  - Test button
  - Status indicator (idle/loading/success/error)
  - Open in new tab link
- "Test all" button to test all endpoints at once
- Visual feedback:
  - Green for success (HTTP 200)
  - Red for errors
  - Loading spinners

### Step 6: Completion

**Features:**
- Success animation (bouncing checkmark)
- Celebration message
- "What's Next" section with 3 cards:
  - Dashboard overview
  - Endpoints information
  - Settings customization
- Large CTA button to dashboard
- Additional resources links:
  - Documentation
  - Support
  - FAQ

## Database Schema

### `onboarding_progress` Table

```sql
CREATE TABLE onboarding_progress (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  current_step INTEGER NOT NULL DEFAULT 1,
  completed_steps INTEGER[] NOT NULL DEFAULT '{}',
  skipped_steps INTEGER[] NOT NULL DEFAULT '{}',
  has_logo BOOLEAN NOT NULL DEFAULT false,
  has_csv BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

### `profiles` Table Updates

New columns added:
- `onboarding_completed` (BOOLEAN)
- `company_name` (TEXT)
- `tax_id` (TEXT)
- `phone` (TEXT)
- `address` (TEXT)
- `logo_url` (TEXT)

## API Routes

### POST `/api/onboarding/progress`

Save onboarding progress.

**Request Body:**
```json
{
  "step": 3,
  "completed_steps": [1, 2],
  "skipped_steps": [],
  "data": {
    "company_info": {
      "company_name": "Example Sp. z o.o.",
      "tax_id": "123-456-78-90"
    },
    "has_logo": true,
    "has_csv": false
  },
  "timestamp": "2025-10-09T12:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Progress saved successfully"
}
```

### GET `/api/onboarding/progress`

Retrieve current onboarding progress.

**Response:**
```json
{
  "current_step": 3,
  "completed_steps": [1, 2],
  "skipped_steps": [],
  "has_logo": true,
  "has_csv": false,
  "updated_at": "2025-10-09T12:00:00Z"
}
```

## Skip Logic

The wizard implements intelligent skip logic:

1. **Skipping Step 2 (Logo)**: Goes directly to Step 3 (CSV)
2. **Skipping Step 3 (CSV)**: Goes directly to Step 5 (Endpoints), skipping Step 4 (Verification)
3. **Step 4 (Verification)**: Only accessible if Step 3 was completed (not skipped)

## LocalStorage Persistence

The wizard saves state to localStorage on every change:

**Key:** `otoraport_onboarding_state`

**Data:**
- Current step
- Completed steps
- Skipped steps
- Company info
- Logo URL (not file object)
- CSV metadata (not file object)

This allows users to:
- Refresh the page without losing progress
- Close browser and resume later
- Continue from any device (when combined with backend sync)

## Styling & Design

### Color Palette

- **Primary**: Blue (#3b82f6) - CTAs, active states
- **Success**: Green (#10b981) - Completed steps, success indicators
- **Warning**: Amber (#f59e0b) - Optional steps, warnings
- **Error**: Red (#ef4444) - Validation errors, failures
- **Neutral**: Grays - Text, borders, backgrounds

### Typography

- **Headlines**: `font-bold text-2xl` to `text-4xl`
- **Subtitles**: `text-base text-gray-600`
- **Form Labels**: `text-sm font-medium`
- **Help Text**: `text-sm text-gray-500`
- **Code/URLs**: `font-mono text-xs`

### Animations

- **Step Transitions**: Fade in/out (handled by React)
- **Progress Bar**: Smooth width transition (500ms ease-out)
- **Button Hovers**: Scale and color transitions
- **File Upload**: Border color and background transitions
- **Success Icon**: Slow bounce animation (2s infinite)

### Responsive Breakpoints

- **Mobile**: Stack all elements vertically
- **Tablet**: 2-column grid for endpoint cards
- **Desktop**: Centered content with max-w-2xl/3xl/4xl containers

## Usage Example

```tsx
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard';

export default function OnboardingPage() {
  const userId = 'user-uuid';
  const clientId = 'client-uuid';

  return (
    <OnboardingWizard
      userId={userId}
      clientId={clientId}
    />
  );
}
```

## Testing

### Manual Testing Checklist

- [ ] Step 1: Validate all fields with correct/incorrect data
- [ ] Step 1: Test NIP auto-formatting
- [ ] Step 1: Test phone auto-formatting
- [ ] Step 2: Upload valid/invalid logo files
- [ ] Step 2: Test drag & drop
- [ ] Step 2: Skip logo step
- [ ] Step 3: Upload valid/invalid CSV files
- [ ] Step 3: Download sample CSV
- [ ] Step 3: Skip CSV step (verify Step 4 is skipped)
- [ ] Step 4: Verify error highlighting
- [ ] Step 4: Test "see all" functionality
- [ ] Step 5: Test individual endpoints
- [ ] Step 5: Test "test all" functionality
- [ ] Step 5: Test copy buttons
- [ ] Step 6: Verify dashboard redirect
- [ ] Progress: Refresh page and verify state persists
- [ ] Navigation: Test back button on all steps
- [ ] Responsive: Test on mobile, tablet, desktop

### Development Mode

The wizard includes a debug panel in development mode (bottom-right corner) showing:
- Current step
- Completed steps
- Skipped steps
- User ID
- Client ID

To disable: Check `process.env.NODE_ENV === 'development'`

## Future Enhancements

### Potential Features
- [ ] Multi-language support (English, German)
- [ ] CSV column mapping tool
- [ ] Bulk data import from other formats (Excel, JSON)
- [ ] Video tutorials embedded in help panels
- [ ] Interactive tooltips and guided tours
- [ ] Analytics tracking for step completion rates
- [ ] A/B testing different onboarding flows
- [ ] Email reminders for incomplete onboarding
- [ ] Progressive disclosure of advanced features

### Technical Improvements
- [ ] Real file upload to Supabase Storage
- [ ] Server-side CSV parsing for large files
- [ ] Streaming upload progress
- [ ] Background job for data processing
- [ ] WebSocket for real-time endpoint testing
- [ ] Optimistic UI updates
- [ ] Error boundary for each step
- [ ] Automated testing with Playwright

## Accessibility

The wizard follows WCAG 2.1 Level AA standards:

- **Keyboard Navigation**: All interactive elements accessible via keyboard
- **Focus Management**: Clear focus indicators, logical tab order
- **Screen Readers**: Proper ARIA labels and landmarks
- **Color Contrast**: All text meets minimum contrast ratios
- **Error Messaging**: Clear, descriptive error messages
- **Form Labels**: All inputs have associated labels

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

Proprietary - OTORAPORT © 2025
