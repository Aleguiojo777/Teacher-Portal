Student Portal (mobile)

This is a minimal Expo React Native app for student login, attendance view, and notifications.

Prerequisites:
- Node.js and npm
- Expo CLI (optional but recommended): `npm install -g expo-cli`
- Android Studio / Android emulator (you said you have Android Studio)

Quick start (using Android emulator running on the same machine):

1. Open a terminal in this folder:

   cd "Student Portal"

2. Install dependencies:

   npm install

3. Start the dev server and open on Android emulator:

   npm run android

Notes:
- The app assumes the Teacher Portal backend is running on the same host as the emulator and reachable at http://10.0.2.2:3000. If your backend is reachable at a different host/IP, edit `App.js` and change `BACKEND_BASE`.
- Admins must create students with a username and password via the Teacher Portal admin interface (the backend was patched to accept and store student passwords and to expose student login/attendance/notifications endpoints).

Notifications
-------------
- This app uses local notifications via `expo-notifications` to demonstrate alerts for absences/late marks.
- On first run the app will request notification permissions. On Android emulator some notification behavior requires a physical device; scheduling local notifications in the emulator should still work for basic testing.
- Tap the bell icon in the header to open the notification list. Tapping a system notification will open the app and show the notifications list.

Testing notifications
---------------------
- Use the "Test Notify" button in the header to schedule a quick local notification for testing.
- For push notifications or custom icons on Android you will need to configure `app.json` and include an Android small icon resource when building a standalone app.

Logo
----
- To show your brand logo in the app header, provide a remote URL by editing `App.js` and setting the `LOGO_URL` constant near the top of the file. Example:

   const LOGO_URL = 'https://example.com/my-logo.png'

- If you'd rather bundle a local image inside the app, add it to an assets folder and either host it locally (serve via a URL) or replace the header code to require a static asset. If you want, I can add a bundled placeholder image for you—tell me the image file to use.
