# inMotion

A gesture-driven particle sphere that runs in the browser with your webcam. Leave a trace with your hand, and the next person who visits finds it.

**Live:** https://inmotion-plum.vercel.app

Allow camera access when asked. Everything is processed in your browser, and no video is uploaded or stored.

## How it works

- Hand tracking uses MediaPipe Hands, and the 3D scene uses Three.js.
- A single hand moves and rotates the sphere. Two hands spread apart to grow it and come together to shrink it.
- Pinch and hold to charge, then release. The particles explode across the screen, and you can draw a trace in the air with one finger.
- Hold an open palm to complete your trace, then pinch with your other hand to move it into place.
- Every completed trace is saved to a shared space, so everyone sees the traces others have left.
- The most recent trace glows and pulses until the next person leaves theirs. Older traces dim into the background so the screen doesn't get crowded.

## Project structure

- `index.html` is the whole experience: scene, hand tracking, and UI.
- `api/traces.js` is a serverless function. GET returns the saved traces, and POST adds a new one. The space keeps the latest 32 traces and drops the oldest.
- `package.json` is a minimal config for the serverless function.

## Run and deploy

The webcam only works over HTTPS (or on localhost), so deploy it somewhere that serves HTTPS, such as Vercel.

1. Push this repo to GitHub and import it in Vercel. Leave the framework as "Other" and the build settings empty.
2. In the Vercel project, open Storage, add Upstash Redis, and connect it to the project. Leave the custom prefix empty so the variables are named KV_REST_API_URL and KV_REST_API_TOKEN.
3. Redeploy so the new variables take effect.

To check it works, open /api/traces on your site. You should see a list of traces (empty at first).

Pushing to the main branch redeploys the site automatically.

## Notes

- Anyone with the link can add traces. There is no moderation or rate limiting yet.
- Traces are saved on the server, with a copy kept in each visitor's browser so the page loads quickly.
- Course project in progress: this is a minimum viable product, and more is planned.
