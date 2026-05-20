# Human Care Worldwide

A cross-platform mobile application for **Human Care Worldwide** — a global medical assistance provider offering 24/7 emergency and healthcare services.

Built with [Expo](https://expo.dev) (React Native) and [Expo Router](https://expo.github.io/router) for iOS, Android, and Web.

---

## Features

- **Login & Registration** — Individual, Partners (Insurance / Hospital / Corporate HR), and Corporate Employee flows
- **Guest Access** — Explore all services without an account
- **10 Medical Services** including:
  - Ground Ambulance
  - Hospital Assistance
  - Domestic & International Hospitalization Support
  - Tele Consultation & House Call
  - Home Healthcare
  - Mortal Remains Repatriation
  - Corporate Medical Solution
  - Private Charter Service
  - Rotary Wing Medical Repatriation
  - Commercial Airline Medical Escort
- **Emergency Tab** — Quick access to the 3 most critical services
- **Dark mode** support

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo SDK 54 |
| Navigation | Expo Router v6 (file-based) |
| UI | React Native 0.81 (New Architecture) |
| Language | TypeScript |
| Animations | React Native Reanimated 4 |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 18+
- [Expo Go](https://expo.dev/go) app on your iOS or Android device (for physical device testing)

### Install

```bash
git clone https://github.com/nikamrohit18/Human-Care-Worldwide.git
cd Human-Care-Worldwide
npm install
```

### Run

```bash
# Web browser
npm run web

# Android emulator / device
npm run android

# iOS simulator (macOS only)
npm run ios

# Interactive (choose platform)
npm start
```

Scan the QR code shown in the terminal with the **Expo Go** app on your phone to run on a physical device. Make sure your phone and computer are on the **same Wi-Fi network**.

---

## Project Structure

```
app/
  _layout.tsx          # Root Stack navigator & global screen config
  index.tsx            # Entry point → redirects to /welcome
  welcome.tsx          # Login / Sign-up screen
  register.tsx         # Registration screen
  forgot-password.tsx  # Password reset screen
  (tabs)/              # Tab navigator (Home, Emergency, Services, Profile)
    index.tsx          # Home tab — hero banner + services grid
    emergency.tsx      # Emergency tab — 3 quick-access service cards
    services.tsx       # Services tab — full list of all 10 services
    profile.tsx        # Profile tab
  services/            # Service detail screens (one per service)

assets/
  images/              # App logo and icons
  fonts/               # SpaceMono font

constants/
  Colors.ts            # Brand colours — primary: #C8102E (medical red)
```

---

## Deep Link Scheme

```
humancareworldwide://
```

---

## License

© Human Care Worldwide. All rights reserved.
