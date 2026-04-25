# Yaya

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.3.1.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Running the mobile apps (Capacitor)

The Android and iOS apps share this Angular codebase via [Capacitor 7](https://capacitorjs.com/). The web build is unaffected — same source, two outputs.

### Build pipeline

- **Web (SSR):** `npm run build` → outputs to `dist/yaya/browser` + `dist/yaya/server`
- **Mobile (static SPA):** `npm run build:mobile` → outputs to `dist/yaya/browser/index.html`

The `mobile` Angular configuration disables SSR/prerendering, swaps `app.routes.server.ts` for a client-only variant via `fileReplacements`, and a post-build step copies `index.csr.html` → `index.html` (Capacitor needs `index.html`).

### Android

```bash
npm run mobile:android        # build + sync + launch on connected device/emulator
npm run cap:open:android      # open the project in Android Studio
npm run cap:sync              # build + sync without launching
```

The Android scaffold lives in `yaya/android/`. Java 17 is required (Gradle wrapper provided).

### iOS

iOS needs [CocoaPods](https://cocoapods.org/) first:

```bash
brew install cocoapods        # one-time install
npm run cap:add:ios           # scaffold yaya/ios/ (only the first time)
npm run mobile:ios            # build + sync + launch in the iOS simulator
npm run cap:open:ios          # open in Xcode
```

### Run the mobile build in a browser

The mobile bundle is just an Angular SPA, so it runs in any desktop browser:

```bash
npm start                                  # dev server with hot reload (same code)
npm run build:mobile && npx http-server dist/yaya/browser -p 8080
```

Mobile-specific chrome (bottom tab bar, status-bar styling, haptics, hardware-back) is gated on `Capacitor.isNativePlatform()` and stays hidden on web.

### Native plugins in use

`@capacitor/app`, `@capacitor/preferences`, `@capacitor/splash-screen`, `@capacitor/status-bar`, `@capacitor/haptics`, `@capacitor/share`, `@capacitor/network`. All are lazy-imported and no-op on web.

### Mobile features

- Bottom tab nav (Home / Find Help / My Hires / Account) — native only
- `/menu` screen with sign-out (the desktop toolbar is hidden on native)
- Hire request form with start date + message; POSTs to `/api/hire-requests`
- My Hires history with refresh, native share, and tap-to-call (for accepted hires)
- Write Review with interactive star picker; haptic on each tap and on submit
- Offline banner driven by `@capacitor/network`
- Auth token persisted via `@capacitor/preferences` on native, `localStorage` on web

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
