# Deutsch B2 Beruf — v6.0 Release Candidate

## Release status
This repository contains a mobile-first learning app with vocabulary study, flashcards, grammar, articles, example sentences, and a separate 211-verb conjugation trainer. The release is a **candidate**, not a verified paid product.

## Implemented
- Minimalist, accessible responsive interface; horizontal mobile navigation instead of multi-row menu
- Four concise home shortcuts routing to existing Vocabulary, Verbs, Grammar, and Practice tabs
- One-at-a-time verb cards with 211 bilingual examples, past forms, optional conjugation tables, quizzes and local mastery tracking
- Existing vocabulary import/export, bookmarks, spaced repetition, Google Sheet refresh, and cloud-account functionality kept intact
- Theme-aware dark mode and a direct light/dark button tied to existing appearance settings
- Keyboard access, visible focus, reduced-motion support and flashcard shortcuts
- Backup shortcut in settings triggers the app's existing CSV export
- Web app manifest and scalable branded icon (no service worker / offline guarantee)
- Product copy avoids fabricated exam scores, streaks, subscriptions or endorsements

## Static release checks
- Syntax checks for app JavaScript modules
- All local index.html asset references exist in the repository
- No duplicate static HTML IDs
- 211 sample sentences, no duplicate sentence keys
- Existing localStorage keys have not been migrated or reset

## Required before selling / advertising
1. Confirm successful GitHub Pages deployment and test all workflows on real iPhone Safari, Android Chrome and desktop browsers, including reload and backup/recovery.
2. Audit Supabase row-level security, authentication, rate limits, account deletion, data export and server-side permissions. Do not assume safe data isolation without checking backend policies.
3. Publish appropriate commercial legal notices including an Impressum and GDPR-compliant privacy notice that accurately identifies the operator, data recipients, retention, legal bases and contact channels; review applicable consumer laws.
4. Choose and integrate a real payment provider (for example, Stripe or an app-store billing system), then implement server-verified entitlements, receipts, refunds, cancellations, tax/VAT and terms. No payment service or subscription is currently connected.
5. Verify all conjugations, grammar explanations, examples and imported vocabulary manually with a qualified German speaker/editor before positioning the content as exam-preparation material.
6. Run a documented WCAG accessibility audit and check screen-reader, color-contrast, zoom and keyboard flows.
7. Conduct privacy/security and cross-device sync tests, including failure recovery and browser-storage clearing. Offer a clear deletion mechanism for cloud-stored data before public paid launch.
8. Confirm rights/licences to all content, artwork, voice features and any external learning material.
9. Add user support, a contact channel, error monitoring with consent controls where applicable, and a transparent pricing/free-tier policy.
10. For app stores, separately complete Android/iOS packaging, listing details, disclosures and store review.

## Monetization approach
Launch a free beta first. Only activate a premium tier after payment, backend authorization, privacy and legal controls have been tested. Do not display fake premium status, fake purchases, inflated progress or invented exam affiliations.

## Known limits
- Install metadata exists; offline access is not guaranteed.
- Current verb data may contain conjugation mistakes and needs linguistic review.
- A successful repository commit is **not** proof of live GitHub Pages publication.
- No billing, ads, official exam certification, or production security audit is included.
