# 🧪 OTORAPORT v2 - Comprehensive Test Plan

**Generated:** 2025-10-06
**Application:** OTORAPORT v2 - Real Estate Compliance SaaS
**Test Coverage:** All critical functions and user flows

---

## 📋 Test Categories

### 1. ✅ Build & Compilation Tests
- [ ] `npm run build` - Production build succeeds
- [ ] `npm run lint` - ESLint passes (0 errors, 0 warnings)
- [ ] TypeScript compilation - No type errors
- [ ] Bundle size analysis - Check for bloat

### 2. 🔐 Authentication & Authorization Tests

#### 2.1 User Registration
- [ ] POST `/api/auth/signup` - Valid registration
- [ ] Email validation works
- [ ] Password strength requirements enforced
- [ ] NIP validation (10 digits)
- [ ] Duplicate email rejection
- [ ] Developer profile creation in DB
- [ ] RLS policies prevent data leakage

#### 2.2 User Login
- [ ] POST `/api/auth/signin` - Valid credentials
- [ ] Invalid credentials rejected
- [ ] Session cookie created
- [ ] Redirect to dashboard after login
- [ ] OAuth Google login works
- [ ] OAuth callback handles tokens

#### 2.3 Session Management
- [ ] Protected routes redirect to signin
- [ ] Session persists across page reloads
- [ ] Logout clears session
- [ ] Expired sessions handled properly

#### 2.4 Password Reset
- [ ] Forgot password form accessible
- [ ] Reset email sent
- [ ] Reset token validation
- [ ] New password update works

### 3. 📤 File Upload & Parsing Tests

#### 3.1 CSV Upload
- [ ] POST `/api/upload` - CSV file accepted
- [ ] Small CSV (<100 rows) parses correctly
- [ ] Large CSV (1000+ rows) parses without freezing UI
- [ ] Web Worker parsing works
- [ ] Invalid CSV format rejected
- [ ] Missing required columns detected
- [ ] Polish characters (ą, ć, ę, ł, etc.) preserved
- [ ] File size limit enforced (10MB)

#### 3.2 Excel Upload
- [ ] XLSX file accepted and parsed
- [ ] Multiple sheets handled
- [ ] Excel-specific formatting preserved
- [ ] Date formats converted correctly

#### 3.3 Data Validation
- [ ] Required fields validated (address, city, area, price)
- [ ] Numeric fields type-checked
- [ ] Invalid rows skipped with error report
- [ ] Duplicate detection works
- [ ] Smart column detection works

#### 3.4 Parsed Data Storage
- [ ] POST `/api/upload-parsed` - Saves to Supabase
- [ ] Developer ID association works
- [ ] RLS prevents cross-developer data access
- [ ] Timestamps added correctly
- [ ] Project association works

### 4. 📊 Dashboard Tests

#### 4.1 Properties Display
- [ ] GET `/api/properties` - Returns developer's properties
- [ ] Pagination works (page size, offset)
- [ ] Sorting works (by date, price, etc.)
- [ ] Filtering works (by project, city, status)
- [ ] Search works
- [ ] Properties table renders correctly
- [ ] Empty state shown when no properties

#### 4.2 Statistics
- [ ] Total properties count accurate
- [ ] Monthly revenue calculated correctly
- [ ] Compliance status shown
- [ ] Charts render without errors

#### 4.3 Upload Widget
- [ ] Drag & drop works
- [ ] File selection dialog works
- [ ] Upload progress shown
- [ ] Success message displayed
- [ ] Error messages clear and helpful
- [ ] Recent uploads list updates

### 5. 🏛️ Ministry Compliance Tests

#### 5.1 XML Generation
- [ ] GET `/api/public/{clientId}/data.xml` - Returns valid XML
- [ ] All properties included
- [ ] Required XML schema followed
- [ ] Polish characters encoded correctly
- [ ] Date format: YYYY-MM-DD
- [ ] Price format: decimal with 2 places

#### 5.2 CSV Generation
- [ ] GET `/api/public/{clientId}/data.csv` - Returns valid CSV
- [ ] Headers match ministry requirements
- [ ] Encoding: UTF-8 with BOM
- [ ] Delimiter: semicolon (;)
- [ ] No missing fields

#### 5.3 MD5 Checksum
- [ ] GET `/api/public/{clientId}/data.md5` - Returns correct hash
- [ ] MD5 matches CSV content exactly
- [ ] File format: `hash  filename`

#### 5.4 Public Access
- [ ] Endpoints accessible without authentication
- [ ] clientId validated
- [ ] Rate limiting prevents abuse
- [ ] CORS headers correct for ministry access

### 6. 💳 Stripe Subscription Tests

#### 6.1 Checkout Session
- [ ] POST `/api/stripe/create-checkout-session` - Creates session
- [ ] Redirect to Stripe Checkout works
- [ ] Plan selection (Basic/Pro/Enterprise) works
- [ ] Pricing correct for each plan
- [ ] Success URL callback works
- [ ] Cancel URL callback works

#### 6.2 Webhook Processing
- [ ] POST `/api/stripe/webhook` - Signature verified
- [ ] `checkout.session.completed` event processed
- [ ] `customer.subscription.created` updates DB
- [ ] `customer.subscription.updated` updates status
- [ ] `customer.subscription.deleted` cancels subscription
- [ ] `invoice.payment_succeeded` recorded
- [ ] `invoice.payment_failed` handled

#### 6.3 Customer Portal
- [ ] POST `/api/stripe/create-portal-session` - Creates session
- [ ] Redirect to Stripe Portal works
- [ ] User can update payment method
- [ ] User can cancel subscription
- [ ] User can view invoices

#### 6.4 Subscription Status
- [ ] Active subscription grants access
- [ ] Expired subscription restricts features
- [ ] Trial period works
- [ ] Subscription upgrade/downgrade works

### 7. 📧 Email Notification Tests

#### 7.1 Welcome Email
- [ ] Sent on registration
- [ ] Correct recipient
- [ ] Professional formatting
- [ ] Links work

#### 7.2 Upload Confirmation
- [ ] Sent after successful upload
- [ ] Property count accurate
- [ ] Summary correct

#### 7.3 Compliance Notifications
- [ ] Sent when ministry data accessed
- [ ] Daily summary works
- [ ] Unsubscribe link works

#### 7.4 Payment Emails
- [ ] Invoice sent on payment success
- [ ] Payment failed notification sent
- [ ] Subscription expiry warning sent

### 8. 🛡️ Security Tests

#### 8.1 Row Level Security (RLS)
- [ ] Developers can only see own properties
- [ ] Developers can only see own projects
- [ ] Admin can see all data
- [ ] Cross-tenant data leakage prevented

#### 8.2 Input Validation
- [ ] SQL injection attempts blocked
- [ ] XSS attempts sanitized
- [ ] File upload malicious payloads rejected
- [ ] API parameter validation works

#### 8.3 Rate Limiting
- [ ] API endpoints rate limited
- [ ] Public endpoints rate limited
- [ ] Excessive requests return 429
- [ ] Rate limit headers present

#### 8.4 Authentication Security
- [ ] JWT tokens validated
- [ ] Session hijacking prevented
- [ ] CSRF protection works
- [ ] Secure cookies (httpOnly, secure)

### 9. 🤖 Chatbot Tests

#### 9.1 Help System
- [ ] POST `/api/chatbot` - Returns relevant help
- [ ] Context-aware responses
- [ ] Polish language support
- [ ] Suggested actions included
- [ ] Security questions blocked

#### 9.2 Integration
- [ ] HelpOverlay component opens
- [ ] Chat history persists in session
- [ ] Contextual help resources shown
- [ ] Guided tours available

### 10. 👨‍💼 Admin Panel Tests

#### 10.1 Dashboard
- [ ] System stats load
- [ ] Developer list shown
- [ ] Revenue charts render
- [ ] Logs displayed
- [ ] Compliance data accurate

#### 10.2 Management
- [ ] Admin can view all developers
- [ ] Admin can approve/reject developers
- [ ] Admin can view all properties
- [ ] Admin actions logged

### 11. 🌐 Frontend Tests

#### 11.1 Landing Page
- [ ] Renders without errors
- [ ] CTA buttons work
- [ ] Responsive design works
- [ ] Images load
- [ ] Links work

#### 11.2 Responsive Design
- [ ] Mobile view works (< 768px)
- [ ] Tablet view works (768px - 1024px)
- [ ] Desktop view works (> 1024px)
- [ ] Touch interactions work on mobile

#### 11.3 Performance
- [ ] First Contentful Paint < 2s
- [ ] Largest Contentful Paint < 3s
- [ ] Time to Interactive < 4s
- [ ] No layout shifts (CLS < 0.1)

### 12. 🔗 API Integration Tests

#### 12.1 Health Check
- [ ] GET `/api/health` - Returns 200 OK
- [ ] Status: "healthy"
- [ ] Uptime shown
- [ ] Version shown

#### 12.2 Support
- [ ] POST `/api/support` - Submits ticket
- [ ] Email sent to support team
- [ ] User receives confirmation

#### 12.3 Unsubscribe
- [ ] GET `/api/unsubscribe` - Updates preferences
- [ ] Token validated
- [ ] Email preferences updated
- [ ] Confirmation shown

### 13. 🗄️ Database Tests

#### 13.1 Supabase Connection
- [ ] Database connection works
- [ ] Connection pooling works
- [ ] Queries timeout after 10s
- [ ] Error handling works

#### 13.2 Migrations
- [ ] All migrations applied
- [ ] Schema matches generated types
- [ ] Indexes created
- [ ] Foreign keys enforced

#### 13.3 Data Integrity
- [ ] No orphaned records
- [ ] Referential integrity maintained
- [ ] Timestamps accurate
- [ ] Soft deletes work (if applicable)

---

## 🎯 Test Execution Priority

### P0 (Critical - Must Pass)
1. Build & compilation
2. Authentication flow
3. File upload & parsing
4. Ministry XML/CSV/MD5 generation
5. RLS security

### P1 (High - Should Pass)
6. Dashboard display
7. Stripe subscription flow
8. API endpoints
9. Email notifications

### P2 (Medium - Nice to Have)
10. Admin panel
11. Chatbot
12. Performance metrics
13. Responsive design

---

## 📝 Test Results Template

```
## Test Results - [Date]

### Summary
- Total Tests: X
- Passed: Y
- Failed: Z
- Skipped: W
- Success Rate: Y/X %

### Failed Tests
1. [Test Name] - [Error Details]
2. [Test Name] - [Error Details]

### Notes
- [Additional observations]
```
