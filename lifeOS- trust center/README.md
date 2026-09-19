# LifeOS Trust Center

Premium LifeOS-style Trust Center with public legal pages and authenticated account controls.

## Files

frontend/
- index.html — shell
- styles.css — responsive premium UI
- app.js — routing, Google auth, LifeOS verification, data/deletion flows
- config.js — Firebase web config + backend URL
- legal-content.js — legal page content

functions/
- index.js — Firebase Functions backend
- package.json — backend dependencies

firebase.json — optional Firebase Hosting + Functions configuration
.gitignore — prevents secrets from being committed

## Logo

Put the existing LifeOS `logo.png` beside `index.html` in `frontend/`.
The website intentionally uses `./logo.png`.

## Important architecture

Google authentication alone does NOT prove that someone is a LifeOS user.

The backend verifies the Firebase UID against:

`lifeosUsers/{uid}`

Only real LifeOS accounts should create/update that registry document. Do not expose Firestore user records directly to the browser.

## Setup

1. Put the existing `logo.png` in `frontend/`.
2. Fill `frontend/config.js` with the Firebase Web App config.
3. Enable Google sign-in in Firebase Authentication.
4. Deploy `functions/` and set the exact GitHub Pages origin in `TRUST_CENTER_ORIGIN`.
5. Put the deployed `/account` function URL into `API_BASE_URL`.
6. Make the LifeOS app/backend maintain `lifeosUsers/{uid}` for real users.
7. Replace legal placeholders with verified production data flows and your real support/grievance contact.
8. Deploy the frontend to GitHub Pages or Firebase Hosting.

## Deletion

This template intentionally does NOT claim that an account is deleted merely because a button was pressed.

Before production, connect `delete-request` to the real LifeOS deletion workflow so that every applicable server-side store is deleted and any legitimate retention exceptions are handled and disclosed. If important LifeOS data is local-only in Android Room, keep the app's local purge path and define how an external deletion request is completed.

Firebase also requires recent authentication for sensitive account deletion operations.

## No fake data

There are no demo users, fake verification responses, fake deletion success messages, or manually entered authenticated emails in this implementation.

## Legal

The legal pages are deliberately conservative. Replace every `REPLACE BEFORE PUBLICATION` item and verify the final wording against the production app, Firebase/Gemini/payment/analytics configuration and actual data flows before publishing.
