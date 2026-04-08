# EC-AI

An AI-powered extracurricular activity tracker for students. Discover opportunities, log activities, track hours, and get AI-driven recommendations — all in one app.

## Tech Stack

| Category      | Library                                               |
| ------------- | ----------------------------------------------------- |
| Framework     | Expo SDK 55, React Native 0.83.4, React 19            |
| Routing       | expo-router v5 (file-based)                           |
| Styling       | NativeWind v2 (Tailwind CSS)                          |
| Auth          | Clerk (`@clerk/clerk-expo`)                           |
| Database      | Neon serverless Postgres (`@neondatabase/serverless`) |
| Subscriptions | RevenueCat (`react-native-purchases` v8)              |
| Ads           | Google AdMob (`react-native-google-mobile-ads`)       |
| Email         | Resend                                                |
| File uploads  | UploadThing                                           |

New Architecture is enabled (`newArchEnabled: true`).

## Features

- **Opportunity Match** — swipe-deck interface for discovering extracurricular opportunities with AI-generated match reasons
- **Track Activities** — log and manage your extracurricular activities
- **Add Activity** — add new activities with descriptions and metadata
- **Saved Opportunities** — bookmark opportunities for later
- **Profile** — manage your account, export data as PDF, and email activity reports

## Project Structure

```
app/
  _layout.tsx              # Root layout (fonts, auth provider)
  index.tsx                # Entry redirect
  (auth)/                  # Auth screens (welcome, sign-in, sign-up, profile-setup)
  (root)/
    (tabs)/                # Main 5-tab navigation
      opportunity_match.tsx
      track_activities.tsx
      add_activity.tsx
      saved_opportunities.tsx
      profile.tsx
    _layout.tsx
  (api)/                   # 29 API route handlers (+api.ts)
components/                # Shared UI components
assets/                    # Images, fonts
```

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- iOS: Xcode + iOS Simulator, or physical device
- Android: Android Studio + emulator, or physical device

### Environment Variables

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=
DATABASE_URL=
REVENUECAT_IOS_KEY=
REVENUECAT_ANDROID_KEY=
RESEND_API_KEY=
UPLOADTHING_TOKEN=
ANTHROPIC_API_KEY=
```

### Install & Run

```bash
npm install
npx expo start
```

Then press `i` for iOS simulator, `a` for Android emulator, or scan the QR code with Expo Go.

### Build for Device

```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
```

### EAS Build

```bash
npx eas build --platform ios
npx eas build --platform android
```

The EAS project ID is `a31952ea-e220-4629-8d9e-7efbbb3c8b30`.

## API Routes

All API routes live under `app/(api)/` and follow Expo Router's `+api.ts` convention. They run as server functions and connect to the Neon database.

Key endpoints:

- `getrecommendations` — AI-powered activity recommendations
- `getopportunities` — fetch and filter opportunities
- `logswipe` — record swipe interactions for ML feedback
- `generate-activities-pdf` — generate a PDF report of logged activities
- `send-activities-email` — email activity report via Resend
- `exportdata` — export user data

## Linting

```bash
npm run lint
```
