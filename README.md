# EC-AI

An extracurricular activity tracker for high school students. Students swipe through opportunities matched to their profile, log activities and hours, and get AI-written summaries, all in one app for iOS, Android and iPad.

## Features

- **Opportunity Match**: a swipe deck of opportunities ranked for the student. Swipe right to save, left to skip.
- **Saved Opportunities**: saved opportunities with full details and AI-written reasons to apply.
- **Track Activities**: the student's activities, with logged hours and AI-written summaries.
- **Add Activity**: add an activity with its role, grades and time commitment.
- **Profile**: edit the profile, export activities as a PDF by email, manage notifications and the subscription.

## Tech Stack

| Category           | Library                                                                |
| ------------------ | ---------------------------------------------------------------------- |
| Framework          | Expo SDK 55, React Native 0.83.4, React 19                             |
| Routing            | expo-router (file-based, including the API routes)                     |
| Styling            | NativeWind v2 (Tailwind CSS)                                           |
| Auth               | Clerk (`@clerk/clerk-expo` in the app, `@clerk/backend` on the server) |
| Database           | Neon serverless Postgres (`@neondatabase/serverless`)                  |
| Server cache       | Upstash Redis (REST API)                                               |
| AI                 | OpenAI chat completions with structured output (`gpt-6-luna`)          |
| Subscriptions      | RevenueCat (`react-native-purchases` + `react-native-purchases-ui` v8) |
| Ads                | Google AdMob (`react-native-google-mobile-ads`)                        |
| Email              | Resend                                                                 |
| Push notifications | `expo-notifications` and the Expo push service                         |
| Swipe deck         | `react-native-deck-swiper`                                             |
| PDF generation     | PDFKit                                                                 |
| Hosting            | EAS Hosting for the API, EAS Build for the apps                        |
| Tests              | Jest with `jest-expo`                                                  |

New Architecture is enabled (`newArchEnabled: true`).

## Architecture

The app and its backend live in one repo. Screens call the API routes over HTTPS with a Clerk bearer token. The routes run on EAS Hosting and are the only code that talks to these services:

| Service       | Used for                                |
| ------------- | --------------------------------------- |
| Neon Postgres | User data, opportunities and swipes     |
| Upstash Redis | Cached responses                        |
| OpenAI        | Reasons to apply and activity summaries |
| Resend        | Emails                                  |
| Expo push     | Weekly alerts                           |

Every route verifies the Clerk token and takes the user id from it, so a request can only read or change its own user's data. The two exceptions are `getactivitytypes`, which is public lookup data, and `sendpersonalizedalerts`, which a scheduled job calls with a shared secret.

## Project Structure

```
app/
  _layout.tsx              # Root layout (fonts, auth provider)
  index.tsx                # Entry route: sign-in, onboarding or the app
  (auth)/                  # Welcome, sign-in, sign-up, profile setup
  (root)/(tabs)/           # The five main tabs
  (api)/                   # 32 API routes (+api.ts), run on the server
components/                # Shared UI components
lib/                       # Shared logic with no UI
__tests__/                 # Jest tests for lib/ and the API routes
docs/                      # Reference docs (database schema)
scripts/                   # One-off tools, such as the opportunities import
.eas/workflows/            # Scheduled EAS workflows
assets/                    # Images and fonts
```

Inside `lib/`, the server-only modules are `db`, `serverAuth`, `serverCache`, `openai`, `resend`, `recommendationScore`, `profileValidation` and `pushNotifications.server`. The rest are used by the screens.

## Getting Started

### Prerequisites

- Node.js 18 or newer
- iOS: Xcode with a simulator, or a physical device
- Android: Android Studio with an emulator, or a physical device

### Environment Variables

Create a `.env` file in the project root:

```env
# Used by the app
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=
EXPO_PUBLIC_APPLE_API_KEY=
EXPO_PUBLIC_ANDROID_API_KEY=

# Used by the API routes
CLERK_SECRET_KEY=
DATABASE_URL=
OPENAI_API_KEY=
RESEND_API_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
PUSH_CRON_SECRET=
```

The two RevenueCat keys are the public SDK keys for each platform. The cache is optional: without the two Upstash variables, every request reads from the database.

### Install & Run

```bash
npm install
npx expo start
```

Then press `i` for the iOS simulator or `a` for the Android emulator. The app uses native modules, so it needs a development build and does not run in Expo Go.

```bash
npx expo run:ios
npx expo run:android
```

## How It Works

### Recommendations

`getrecommendations` scores each opportunity against the student's profile, from 0 to 100. The scoring is a fixed set of weights in `lib/recommendationScore.ts`, not a model:

| Factor          | Points |
| --------------- | ------ |
| Career interest | 35     |
| Weekly time     | 20     |
| Leadership      | 15     |
| Selectivity     | 15     |
| Grade           | 10     |
| Travel          | 5      |

A factor with missing data earns partial credit, so an incomplete listing is not buried.

Each request returns a batch of up to 120. Opportunities the student has not swiped come first, ranked by score. Ones they already swiped follow, least recently swiped first, so a skipped card only returns once nothing new is left. Saved opportunities are never returned. The app loads the next batch when the deck runs out.

### Caching

There are two layers.

- **Server** (`lib/serverCache.ts`): Upstash Redis, read through `getOrSetServerCache`. If Redis is down the request still succeeds by loading from the source. Keys carry a version, so changing a prompt or a response shape does not reuse old entries.
- **App** (`lib/fetch.ts`): an in-memory cache for the session, with a 60 second lifetime for user data. Screens clear the keys they change.

| Server cache    | Lifetime   | Shared across users                 |
| --------------- | ---------- | ----------------------------------- |
| Recommendations | 10 minutes | No. Cleared on swipe, save, profile |
| AI reasons      | 14 days    | Yes, one per opportunity            |
| AI summaries    | 3 days     | No. The key includes the text       |
| Dropdown data   | 24 hours   | Yes                                 |

### AI features

Two routes call OpenAI through `lib/openai.ts`: `getaireasons` (three reasons to apply to an opportunity) and `getaidescription` (a 150 character activity summary). Both use structured output with a JSON schema and return plain strings to the app.

The prompts leave out blank fields and tell the model to use only the facts it was given, so it does not invent numbers or details.

### Notifications

Free users get two local weekly reminders scheduled on the device. Premium users get personalized push alerts instead.

`.eas/workflows/send-personalized-alerts.yml` runs weekly and calls `sendpersonalizedalerts` in small batches. For each user it picks the best opportunity they have not been notified about, weighted towards fields they have saved or liked.

### Premium and ads

RevenueCat provides one entitlement, `premium`. Free users can add up to 10 activities and see an ad as every third card in the swipe deck. Premium removes the ads and unlocks AI reasons, AI summaries and the PDF export.

## API Routes

All routes live under `app/(api)/` and follow Expo Router's `+api.ts` convention. They are `POST` unless noted, and need a Clerk bearer token unless noted.

### Opportunities

| Route                    | Description                                             |
| ------------------------ | ------------------------------------------------------- |
| `getrecommendations`     | Ranked opportunities for the swipe deck                 |
| `getsavedopportunities`  | The student's saved opportunities                       |
| `addsavedopportunity`    | Save an opportunity                                     |
| `deletesavedopportunity` | Remove a saved opportunity                              |
| `logswipe`               | Record a swipe, which moves the card to the back        |
| `reportopportunity`      | Report an opportunity to the admin                      |
| `getopportunities`       | Every unsaved opportunity (not used by the current app) |

### AI

| Route              | Description                                          |
| ------------------ | ---------------------------------------------------- |
| `getaireasons`     | Three reasons to apply to an opportunity             |
| `getaidescription` | A short summary of one of the student's activities   |
| `getaisuggested`   | Model-picked top three (not used by the current app) |

### Activities

| Route               | Description                               |
| ------------------- | ----------------------------------------- |
| `getactivities`     | The student's activities                  |
| `adduseractivity`   | Add an activity                           |
| `alteractivity`     | Update an activity                        |
| `deleteactivity`    | Delete an activity (`DELETE`)             |
| `updatedescription` | Update an activity's description          |
| `getactivitynames`  | Names and ids of the student's activities |
| `loghours`          | Log hours for an activity                 |
| `getactivitylogs`   | The hour logs for one activity            |
| `getloggedhours`    | Total hours and the three latest logs     |
| `getactivitytypes`  | Activity type options (`GET`, public)     |
| `fetchdropdowns`    | Options for the onboarding dropdowns      |
| `questions`         | Onboarding questions and options (`GET`)  |

### User

| Route         | Description                                      |
| ------------- | ------------------------------------------------ |
| `user`        | Create the user's row after sign-up              |
| `getuserdata` | The student's profile                            |
| `userdata`    | Update the profile, with number validation       |
| `deleteuser`  | Delete the account (`DELETE`)                    |
| `exportdata`  | Email the admin a request for the student's data |

### Push Notifications

| Route                     | Description                                         |
| ------------------------- | --------------------------------------------------- |
| `registerpush`            | Register a device push token                        |
| `notificationpreferences` | Turn push alerts on or off                          |
| `sendpersonalizedalerts`  | Send weekly alerts (shared secret, no bearer token) |

### Reports

| Route                     | Description                           |
| ------------------------- | ------------------------------------- |
| `generate-activities-pdf` | Build the activities PDF and email it |
| `send-activities-email`   | Stub kept for older app versions      |

Installed app versions keep calling these routes after a deploy, so a route's response fields should not change shape.

## Database

The schema is documented in [docs/database.md](docs/database.md). The repo has no migrations, so update that page when a table changes.

To load opportunities from a JSON file:

```bash
npm run import:opportunities -- path/to/file.json           # dry run
npm run import:opportunities -- path/to/file.json --apply   # write
```

## Testing

```bash
npm run test:ci   # run once
npm test          # watch mode
```

Tests live in `__tests__/` and need no network or database. They cover:

- **`lib/`**: recommendation scoring and ranking, the swipe deck layout, profile validation, both caches, database retries, the OpenAI client, token checks, email sending and push alert selection.
- **API routes**: `userdata`, `getrecommendations`, `logswipe`, the two AI routes, `sendpersonalizedalerts` and the routes that send email.

The screens are not covered by tests.

## Linting

```bash
npm run lint
```

This runs ESLint with the Expo and Prettier rules over `app`, `components`, `constants`, `lib` and `__tests__`.

## Code Comments

Comments explain why code is the way it is. The code itself shows what it does.

- Write a comment when it adds something the code cannot say: a reason, a constraint, or a warning about code that looks removable.
- Do not restate the line below it.
- Use `/** ... */` above an exported function or component when its purpose is not clear from its name and types. Start with a verb. Leave out types, which TypeScript already shows.
- Use `//` for notes inside a function.
- Keep it to one short line where possible. Use several `//` lines for a longer note.
- No section dividers, decoration or emoji.

These follow the [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html#comments-documentation) and Stack Overflow's [best practices for writing code comments](https://stackoverflow.blog/2021/12/23/best-practices-for-writing-code-comments/).

## Deployment

The API routes deploy to EAS Hosting:

```bash
npx expo export --platform web
npx eas deploy --prod
```

The apps are built with EAS Build:

```bash
npx eas build --platform ios
npx eas build --platform android
```

The server's secrets are stored as EAS environment variables in the `production` environment. The EAS project ID is `a31952ea-e220-4629-8d9e-7efbbb3c8b30`.
