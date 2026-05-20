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
