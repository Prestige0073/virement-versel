# 📋 TODO - Phase 2 & Au-delà

**Status**: Planning  
**Priority**: HIGH  
**Assignee**: GitHub Copilot

---

## 🔴 URGENT - Avant Phase 2

- [ ] **npm install final** - Résoudre les timeouts
  - Options:
    1. Retry with `npm install --legacy-peer-deps`
    2. Use yarn: `yarn install`
    3. Install packages manually:
       - `npm install react-router-dom`
       - `npm install react-hot-toast`
       - `npm install jspdf @react-pdf/renderer`
  - Priority: **CRITICAL** - Phase 2 needs React Router
  - Effort: 30 min

- [ ] **Test dev server**
  - Command: `npm run dev`
  - Verify: http://localhost:5173 loads
  - Check: No errors in console
  - Priority: **CRITICAL**
  - Effort: 15 min

---

## 🟠 Phase 2 - Authentification (2-3 jours)

### Authentication System
- [ ] Create AuthContext
- [ ] Implement useAuth() hook
- [ ] Supabase Auth integration
- [ ] Sign-up handler
  - [ ] Email validation
  - [ ] Password requirements
  - [ ] Error handling
- [ ] Sign-in handler
  - [ ] Email/password validation
  - [ ] Token management
  - [ ] Session persistence
- [ ] JWT token handling
- [ ] Password recovery flow
- [ ] Logout functionality
- [ ] Session refresh logic

### UI Components
- [ ] Update LoginPage with real form
- [ ] Update SignupPage with real form
- [ ] Create PasswordRecoveryPage
- [ ] Add loading states
- [ ] Add error messages
- [ ] Toast notifications for success/errors

### Testing
- [ ] Unit tests for AuthContext
- [ ] Test signup flow
- [ ] Test login flow
- [ ] Test token refresh
- [ ] Test logout
- [ ] Mock Supabase calls

### Security
- [ ] Audit password handling
- [ ] Verify HTTPS requirements
- [ ] Check CORS configuration
- [ ] Test rate limiting (prepare)
- [ ] Security audit report

---

## 🟡 Phase 3 - Paiement Mobile Money (2 jours)

### Payment Integration
- [ ] Choose provider (FedaPay/Kkiapay/CinetPay)
- [ ] Integrate API
- [ ] Create payment page component
- [ ] Implement payment handler
- [ ] Handle payment success
- [ ] Handle payment failure
- [ ] Webhook integration for confirmations

### Database
- [ ] Create payments table (if not exists)
- [ ] Update bank_accounts with payment status
- [ ] Add payment history tracking
- [ ] Audit logging for payments

### Testing
- [ ] Test payment flow
- [ ] Mock provider API
- [ ] Test error scenarios
- [ ] Test webhook handling

---

## 🟡 Phase 4 - CRUD Comptes Bancaires (2-3 jours)

### Form Components
- [ ] Create BankAccountForm
- [ ] Input fields for all bank details
- [ ] IBAN validation
- [ ] Form validation rules
- [ ] Error messages

### Logo Upload
- [ ] Integrate Supabase Storage
- [ ] Create upload component
- [ ] Handle file upload
- [ ] Store file URL in DB
- [ ] Display uploaded logo

### CRUD Operations
- [ ] Create account endpoint
- [ ] Read account endpoint
- [ ] Update account endpoint
- [ ] Delete account endpoint
- [ ] List all user accounts

### Testing
- [ ] Test create account
- [ ] Test update account
- [ ] Test delete account
- [ ] Test logo upload
- [ ] Test form validation

---

## 🟡 Phase 5 - Configuration Étapes (2 jours)

### Step Configuration UI
- [ ] Create StepConfigForm
- [ ] Add step type selector
- [ ] Input for custom labels
- [ ] Input for unlock codes
- [ ] Drag & drop ordering
- [ ] Add/remove steps

### Encryption
- [ ] Implement code encryption (TweetNaCl)
- [ ] Generate encryption keys
- [ ] Encrypt codes before storage
- [ ] Decrypt codes for validation

### Database
- [ ] Implement step CRUD
- [ ] Store encrypted codes safely
- [ ] Handle step ordering

### Testing
- [ ] Test encryption/decryption
- [ ] Test step ordering
- [ ] Test form validation
- [ ] Test code storage

---

## 🟡 Phase 6 - Génération Lien (1-2 jours)

### Share Link Generation
- [ ] Generate unique slugs
- [ ] Create password generation
- [ ] Hash passwords with bcryptjs
- [ ] Set expiration dates
- [ ] Create share_links records

### UI Components
- [ ] Create LinkGenerationModal
- [ ] Display generated link
- [ ] Show password
- [ ] Copy to clipboard button
- [ ] Expiration settings

### Testing
- [ ] Test unique slug generation
- [ ] Test password hashing
- [ ] Test link expiration
- [ ] Test access control

---

## 🟡 Phase 7 - Espace Client Login (1-2 jours)

### Client Space Routes
- [ ] Create /client/:slug route
- [ ] Create /client/:slug/home route
- [ ] Create /client/:slug/transfer route
- [ ] Create /client/:slug/transfer/:id/step/:n routes
- [ ] Create /client/:slug/transfer/:id/success route

### Client Authentication
- [ ] Password verification page
- [ ] Rate limiting on attempts
- [ ] Session management for client
- [ ] Logout functionality

### Dashboard Components
- [ ] Display account balance
- [ ] Show account details
- [ ] Display transfer history
- [ ] New transfer button

### Testing
- [ ] Test client login
- [ ] Test rate limiting
- [ ] Test session persistence
- [ ] Test dashboard display

---

## 🟡 Phase 8 - Formulaire Virement (2-3 jours)

### Transfer Form
- [ ] Beneficiary name input
- [ ] IBAN/BIC validation
- [ ] Amount input
- [ ] Motif selection
- [ ] Form validation
- [ ] Confirm button

### Multi-Step Process
- [ ] Get steps from config
- [ ] Display step 1 interruption
- [ ] Request code button
- [ ] Code input field
- [ ] Validation logic
- [ ] Progress indicator

### Database
- [ ] Create transfer record
- [ ] Create step attempts records
- [ ] Update transfer status

### Testing
- [ ] Test form validation
- [ ] Test step progression
- [ ] Test code validation
- [ ] Test transfer creation

---

## 🟡 Phase 9 - Temps Réel (2-3 jours)

### Supabase Realtime
- [ ] Setup Realtime subscriptions
- [ ] Listen to realtime_events
- [ ] Publish events on actions
- [ ] Dashboard notifications

### Owner Dashboard
- [ ] Real-time client connection notifications
- [ ] Transfer started notifications
- [ ] Code requested notifications (with approve button)
- [ ] Step completion notifications
- [ ] Transfer done notifications

### Client Updates
- [ ] Real-time balance updates
- [ ] Code unlock notifications
- [ ] Step progression notifications

### Testing
- [ ] Test event publishing
- [ ] Test subscriptions
- [ ] Test real-time updates
- [ ] Test concurrent operations

---

## 🟡 Phase 10 - PDF Generation (1-2 jours)

### Receipt Template
- [ ] Create PDF template
- [ ] Add bank logo
- [ ] Add bank details
- [ ] Add transaction details
- [ ] Add amount & currency
- [ ] Add date/time
- [ ] Add reference number
- [ ] Add beneficiary info

### PDF Generation
- [ ] Implement jsPDF
- [ ] Generate PDF dynamically
- [ ] Style receipt professionally
- [ ] Add signatures/stamps

### Storage
- [ ] Store PDF in Supabase Storage
- [ ] Generate download link
- [ ] Display PDF link in success page

### Testing
- [ ] Test PDF generation
- [ ] Test PDF styling
- [ ] Test file storage
- [ ] Test download functionality

---

## 🟡 Phase 11 - Internationalization (1-2 jours)

### i18n Setup
- [ ] Configure i18next
- [ ] Create translation files (FR, EN)
- [ ] Add language switcher
- [ ] Persist language preference

### Translations
- [ ] Translate all UI text
- [ ] Translate form labels
- [ ] Translate messages
- [ ] Translate error messages
- [ ] Translate notifications

### Testing
- [ ] Test language switching
- [ ] Test all translations present
- [ ] Test RTL support (if needed)

---

## 🔴 Phase 12 - Tests & Déploiement (3-4 jours)

### Unit Tests
- [ ] Create test suite
- [ ] Test all utilities
- [ ] Test components
- [ ] Test hooks
- [ ] Aim for 80%+ coverage

### Integration Tests
- [ ] Test full auth flow
- [ ] Test payment flow
- [ ] Test transfer flow
- [ ] Test real-time updates

### E2E Tests
- [ ] Setup Playwright
- [ ] Test complete user journey
- [ ] Test error scenarios
- [ ] Test performance

### Security Audit
- [ ] Penetration testing
- [ ] Code security review
- [ ] Dependencies audit
- [ ] OWASP checklist

### Performance
- [ ] Lighthouse audit
- [ ] Bundle size analysis
- [ ] Load time testing
- [ ] Database query optimization

### Deployment
- [ ] Configure Vercel
- [ ] Setup environment variables
- [ ] Configure custom domain
- [ ] Setup monitoring
- [ ] Setup error tracking
- [ ] Enable analytics

---

## 📊 Timeline Estimate

| Phase | Estimate | Status |
|-------|----------|--------|
| Phase 1 | ✅ Done | Completed |
| Phase 2 | 2-3 days | 📋 Ready |
| Phase 3 | 2 days | 📋 Queued |
| Phase 4 | 2-3 days | 📋 Queued |
| Phase 5 | 2 days | 📋 Queued |
| Phase 6 | 1-2 days | 📋 Queued |
| Phase 7 | 1-2 days | 📋 Queued |
| Phase 8 | 2-3 days | 📋 Queued |
| Phase 9 | 2-3 days | 📋 Queued |
| Phase 10 | 1-2 days | 📋 Queued |
| Phase 11 | 1-2 days | 📋 Queued |
| Phase 12 | 3-4 days | 📋 Queued |
| **TOTAL** | **~22-30 days** | 📋 |

---

## 🎯 Quality Gates

### Before Each Phase:
- [ ] Phase completed review
- [ ] Tests passing (min 80% coverage)
- [ ] Audit completed
- [ ] Documentation updated
- [ ] All TODOs resolved

### Before Production:
- [ ] All 12 phases completed
- [ ] Security audit passed
- [ ] Performance audit passed
- [ ] Load testing passed
- [ ] User acceptance testing
- [ ] Final approval

---

## 📞 Notes

- Update this file as tasks are completed
- Mark ✅ when done, 🔴 when critical, 🟠 when urgent
- Keep dates and effort estimates updated
- Reference AUDIT_PHASE_1.md for guidelines
- Follow git workflow (branches, commits, PRs)

---

**Last Updated**: 3 mai 2026  
**Next Review**: After Phase 2 starts  
**Maintained By**: GitHub Copilot
