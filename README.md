# EC-AI

An AI-powered extracurricular activity tracker for students. Discover opportunities, log activities, track hours, and get AI-driven recommendations — all in one app.

## Tech Stack

| Category           | Library                                                                |
| ------------------ | ---------------------------------------------------------------------- |
| Framework          | Expo SDK 55, React Native 0.83.4, React 19                             |
| Routing            | expo-router (SDK 55, file-based)                                       |
| Styling            | NativeWind v2 (Tailwind CSS)                                           |
| Auth               | Clerk (`@clerk/clerk-expo`)                                            |
| Database           | Neon serverless Postgres (`@neondatabase/serverless`)                  |
| Subscriptions      | RevenueCat (`react-native-purchases` + `react-native-purchases-ui` v8) |
| Ads                | Google AdMob (`react-native-google-mobile-ads`)                        |
| Email              | Resend                                                                 |
| File uploads       | UploadThing                                                            |
| Push notifications | `expo-notifications`                                                   |
| Biometric auth     | `expo-local-authentication`                                            |
| Swipe deck         | `react-native-deck-swiper`                                             |
| PDF generation     | PDFKit                                                                 |

New Architecture is enabled (`newArchEnabled: true`).

## Features

- **Opportunity Match** — swipe-deck interface for discovering extracurricular opportunities with AI-generated match reasons
- **Track Activities** — log and manage your extracurricular activities with hour tracking
- **Add Activity** — add new activities with descriptions and metadata
- **Saved Opportunities** — bookmark opportunities for later
- **Profile** — manage your account, export data as PDF, email activity reports, and configure notifications

## Project Structure

```
app/
  _layout.tsx              # Root layout (fonts, auth provider)
  index.tsx                # Entry redirect
  +not-found.tsx           # 404 screen
  (auth)/                  # Auth screens (welcome, sign-in, sign-up, profile-setup)
  (root)/
    (tabs)/                # Main 5-tab navigation
      opportunity_match.tsx
      track_activities.tsx
      add_activity.tsx
      saved_opportunities.tsx
      profile.tsx
    _layout.tsx
  (api)/                   # 32 API route handlers (+api.ts)
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
EXPO_PUBLIC_APPLE_API_KEY=
EXPO_PUBLIC_ANDROID_API_KEY=
CLERK_SECRET_KEY=
DATABASE_URL=
RESEND_API_KEY=
ADMIN_EMAIL=
UPLOADTHING_TOKEN=
OPENAI_API_KEY=
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

### AI

| Route                | Description                                   |
| -------------------- | --------------------------------------------- |
| `getrecommendations` | AI-powered activity recommendations           |
| `getaireasons`       | AI-generated match reasons for opportunities  |
| `getaidescription`   | AI-generated activity descriptions            |
| `getaisuggested`     | AI-suggested activities based on user profile |

### Opportunities

| Route                    | Description                               |
| ------------------------ | ----------------------------------------- |
| `getopportunities`       | Fetch and filter opportunities            |
| `getsavedopportunities`  | Fetch saved/bookmarked opportunities      |
| `addsavedopportunity`    | Save an opportunity                       |
| `deletesavedopportunity` | Remove a saved opportunity                |
| `logswipe`               | Record swipe interactions for ML feedback |
| `reportopportunity`      | Report an opportunity                     |

### Activities

| Route               | Description                 |
| ------------------- | --------------------------- |
| `getactivities`     | Fetch user activities       |
| `adduseractivity`   | Add a new activity          |
| `alteractivity`     | Update an existing activity |
| `deleteactivity`    | Delete an activity          |
| `getactivitylogs`   | Fetch activity log entries  |
| `loghours`          | Log hours for an activity   |
| `getloggedhours`    | Fetch logged hours          |
| `getactivitynames`  | Fetch activity name list    |
| `getactivitytypes`  | Fetch activity type options |
| `fetchdropdowns`    | Fetch dropdown options      |
| `updatedescription` | Update activity description |

### User

| Route         | Description                |
| ------------- | -------------------------- |
| `user`        | Create/fetch user record   |
| `getuserdata` | Fetch user profile data    |
| `userdata`    | Update user data           |
| `deleteuser`  | Delete user account        |
| `exportdata`  | Export all user data       |
| `questions`   | Fetch onboarding questions |

### Push Notifications

| Route                     | Description                            |
| ------------------------- | -------------------------------------- |
| `registerpush`            | Register a device push token           |
| `notificationpreferences` | Get/update notification preferences    |
| `sendpersonalizedalerts`  | Send personalized push alerts to users |

### Reports

| Route                     | Description                                |
| ------------------------- | ------------------------------------------ |
| `generate-activities-pdf` | Generate a PDF report of logged activities |
| `send-activities-email`   | Email activity report via Resend           |

## Linting

```bash
npm run lint
```
