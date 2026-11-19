# Med-Co web client

Run `npm ci` and `npm run dev` from the client directory. Vite serves the app at `http://localhost:5180`. On Windows environments that restrict child processes, use `npm run dev -- --configLoader native`.

Med-Co starts in simulation mode. The browser profile maintains its own seeded wearable stream and displays the last 60 minutes. The feed generates one sample per minute, with steps accumulated since midnight in Asia/Kolkata. The caretaker controls apply drill readings to the current minute and display alerts in the app.

Optional local environment variables in `.env.local`:

- `VITE_PROFILE_NAME` sets the displayed profile name and the name used by MediVox.
- `VITE_GEMINI_API_KEY` enables open-ended Gemini answers with the current wearable snapshot and recent conversation. Quick wearable answers run locally. Vite exposes `VITE_*` variables to the client, so use a development key for this setup.
- `VITE_GEMINI_MODEL` optionally overrides the default Gemini model.
- `VITE_WEARABLE_MODE=watch` switches the client to the existing wearable backend. Set `VITE_WEARABLE_API_URL` if it runs somewhere other than `http://localhost:8011`.

Health Records, Medications, Appointments, and Settings save data in the current browser. Risk Analysis, What-If Simulator, Recommendations, Reports, and Devices & Sync share the running wearable feed. Reports exports the filtered wearable samples as a CSV.

### Phone notifications

Run `npm ci` and `npm start` in `server/notifications` using Node.js 22.13 or later. Vite forwards `/api/notifications` to the relay on port 8012. In production, serve the client over HTTPS and forward the same route to this relay behind your reverse proxy. Set `MED_CO_PUSH_CONTACT` to your operator contact and keep the relay state directory on persistent storage so browser subscriptions and VAPID keys survive restarts. The default directory is `server/instance/notifications`.

In Settings, use **Enable on this device** to receive pushes here, or **Create phone pairing link** to opt the current browser into sending alerts and pair another device. Open the private link on the phone, enable notifications there, then use **Send test push**. Install the web app to the Home Screen on iPhone before enabling push. A loopback address works only on the same device.

The root `render.yaml` serves the built frontend and notification relay together on one HTTPS origin and uses Postgres for pairings, delivery deduplication, and the VAPID key. The demo Blueprint uses free resources. Render's free web service can sleep, and its free Postgres instance expires after 30 days. Wearable demo data originates in the open browser. The optional physical-watch backend runs separately.

Automatic checks run while the source Med-Co tab is running. Anomaly notifications use the existing wearable alert rules. Medication reminders are sent 15 minutes after the scheduled time when the dose is still unlogged, using India Standard Time. Push messages contain only the notification category. Real and simulated anomaly messages use different wording.

## Vite template reference

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
