# Saṃskṛtam Gamified — Full Premium (Option C)

This is a full premium skeleton of your Sanskrit learning app.
Features included:
- Vite + React + React Router
- Component-based structure
- Lessons auto-loader (src/lessons)
- Browser SpeechSynthesis TTS hook (src/hooks/useTTS.js)
- XP and streak system (localStorage)
- Review mode (simple flashcards)
- Confetti utility and offline caching patterns
- Placeholder sound files in /assets (replace with real mp3s)
- Ready for future Google Cloud TTS integration (server-side)

## Quick start (Mac M1)
1. unzip the project
2. install dependencies:
   npm install
3. run dev:
   npm run dev

## Deploy to Vercel
1. Create a GitHub repo and push this project.
2. Connect repo to Vercel.
3. Vercel will run `npm install` and `npm run build`.

## Switching to Google Cloud TTS later
- Implement a serverless endpoint (Vercel Serverless Function, Netlify Function, or Cloud Function)
- Endpoint accepts text → returns an mp3 URL
- Update `src/hooks/useTTS.js` to call `fetchCloudTTS(text)` and play the returned mp3 when available (fallback to browser TTS)
- I can generate the serverless function code when you want.

## Notes
- Replace `/assets/*.mp3` with real SFX.
- Add more lesson JSON files under `src/lessons/` (they auto-load).
- If build fails on Vercel, ensure package.json includes `@vitejs/plugin-react` and `vite` in devDependencies (this project already does).
