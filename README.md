# inMotion

Gesture-driven particle sphere (webcam + MediaPipe Hands). One static page plus one
serverless function that stores traces in Redis so every visitor shares the same space.

- `index.html` - the experience
- `api/traces.js` - GET lists traces, POST adds one (capped at 32, oldest dropped)

## Deploy
1. Push to GitHub, import the repo in Vercel.
2. In the Vercel project: Storage / Marketplace -> add Upstash Redis and connect it to the project
   (this sets the env vars automatically). Redeploy.
