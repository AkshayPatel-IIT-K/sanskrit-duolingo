# Saṃskṛtam Gamified — Premium Skeleton

This is a lightweight premium-themed Vite + React starter for your Sanskrit app.
It includes:
- Component-based structure
- useTTS hook (browser SpeechSynthesis) — speaks prompt-only and options
- QuestionCard component wired to TTS
- ProgressCircle, Masthead, LessonList, ProfileModal
- Minimal animations and Material-style look (includes MUI deps in package.json)

## To run locally

1. unzip the project
2. install dependencies:
   npm install
3. run dev:
   npm run dev

## Notes
- Replace `assets/*.mp3` with real sounds.
- Add more lessons to `src/lessons/` as JSON; they auto-load.
- To integrate Google Cloud TTS later, request the serverless /api/tts code.
