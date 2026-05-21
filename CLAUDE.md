# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important

Before writing any Expo or React Native code, read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ — Expo APIs change significantly between versions.

## Commands

```bash
npm run web        # Start Metro bundler and open in browser (http://localhost:8081)
npm run android    # Run on Android emulator or connected device
npm run ios        # Run on iOS simulator (macOS only)
npm start          # Start Expo dev server (choose platform interactively)
```

There is no test runner or lint script configured yet.

## Architecture

**Routing** — Expo Router (file-based). Every file under `app/` becomes a route automatically. The root `app/_layout.tsx` defines the top-level `Stack` and explicitly names each `Stack.Screen` with its header title. New screens added to `app/services/` must be registered there to get a proper title.

**Tab structure** — `app/(tabs)/` holds the four tabs: `index` (Home), `emergency`, `services`, `profile`. Tab bar config (icons, labels) lives in `app/(tabs)/_layout.tsx`.

**Service screens** — `app/services/` has one file per service. Each follows a consistent layout: large emoji icon → title → description → CTA button. The Emergency tab (`app/(tabs)/emergency.tsx`) surfaces three of these as quick-access cards.

**Theming** — `constants/Colors.ts` is the single source of truth for colors. `Colors.primary` (`#C8102E`, medical red) is the brand/CTA color. `components/Themed.tsx` exports `Text` and `View` wrappers that automatically apply light/dark colors — prefer these over raw RN primitives inside screens.

**Path alias** — `@/` maps to the repo root (configured in `tsconfig.json`). Use `@/components/...`, `@/constants/...` etc.

**New Architecture** — `newArchEnabled: true` in `app.json`. The app runs on React Native's new architecture (Fabric + JSI). Avoid libraries that are not yet compatible.

**Deep link scheme** — `humancareworldwide://` (set in `app.json`).

## Authentication

Firebase Authentication (email/password) via the Firebase JS SDK v12 (modular).

- **`lib/firebase.ts`** — Firebase app + auth initialisation. Platform-aware: `getAuth` on web, `getReactNativePersistence(AsyncStorage)` on native via dynamic `require()`. Uses `getApps()` guard to prevent double-init on hot reload.
- **`context/AuthContext.tsx`** — `AuthProvider` + `useAuth()` hook. Exposes `user`, `profile`, `loading`, `signIn`, `signUp`, `signOut`, `resetPassword`.
- **`lib/userStorage.ts`** — Extended user profile (name, phone, DOB, account type, etc.) stored in AsyncStorage under `hcw_profile_<uid>`. Firebase Auth only holds uid/email/displayName.
- **`lib/firebaseErrors.ts`** — Maps Firebase error codes to user-friendly messages.
- **Auth screens** — `app/welcome.tsx` (login), `app/register.tsx` (sign-up, three account types), `app/forgot-password.tsx`.
- **Route guard** — `RootLayoutNav` in `app/_layout.tsx` redirects logged-in users away from auth screens and unauthenticated users away from protected routes.

**Metro config** — `metro.config.js` sets `unstable_enablePackageExports: true` with browser-preferred `unstable_conditionNames` to prevent Firebase from resolving its Node.js bundle on web.

## Tele Consultation feature

Booking flow: `tele-consultation` (overview) → `tele-consultation-book` (date/time/type/duration picker) → `tele-consultation-appointments` (list) → `tele-consultation-call` (live call).

- **`lib/consultationStorage.ts`** — `Consultation` type + AsyncStorage CRUD under `hcw_consultations_<uid>`. `CHARGES` map: video ₹299/499, phone ₹199/349, house-call ₹999/1499 (15/30 min).
- **`lib/dailyConfig.ts`** — **gitignored** — contains real `DAILY_DOMAIN` and `DAILY_API_KEY`. Copy from `lib/dailyConfig.example.ts` and fill in values. Domain is `humancare`; get the API key from the Daily.co dashboard → Developers.
- **`app/services/tele-consultation-call.tsx`** — Full-screen video call. Calls `ensureRoom()` to create the Daily.co room if needed, then loads it in a `WebView` (native) or `<iframe>` (web). Overlay HUD: countdown timer (turns red at 2 min), 2-minute warning banner (Animated slide-in), End Call button with confirmation dialog. Auto-ends and marks consultation `completed` when timer hits 0.

**Camera/mic permissions** — declared in `app.json` under `ios.infoPlist` and `android.permissions`. WebView props `mediaCapturePermissionGrantType="grantIfSameHostElseDeny"` (iOS) and `onPermissionRequest` auto-grant (Android) enable camera inside the WebView.

**Expo Go limitation** — iOS Expo Go restricts WebView camera access. Full camera works in a standalone/development build. Web browser (`npm run web`) works immediately.

## Secret files (never commit)

| File | Contents | How to recreate |
|---|---|---|
| `lib/dailyConfig.ts` | Daily.co domain + API key | Copy `lib/dailyConfig.example.ts`, fill values |
| `lib/firebase.ts` | Firebase project config | Firebase Console → Project settings → Web app |
