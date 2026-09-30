# SpeakFlow — Daily Speech Practice App

Speak into the app, get an instant transcript, and see feedback on your
fluency (word count, speaking pace, filler words, sentence length). Every
session is saved so you can build a daily practice streak.

**Cost to run: $0.** The app uses your browser's built-in speech recognition
(no API key) and saves data on the device (no database bill). You only start
paying if you later add cloud accounts or a paid AI grammar engine — and even
those have free tiers to begin with.

---

## Run it on your computer

You need [Node.js](https://nodejs.org) installed (any recent version).

```bash
npm install      # one time
npm run dev      # start local dev server → open the URL it prints
```

Speak, stop, and you'll see your transcript and feedback.
> Use **Chrome** or **Edge** — the free browser speech engine works best there.

---

## Deploy it FREE on Vercel

1. **Put the code on GitHub**
   - Create a free account at github.com if you don't have one.
   - Make a new empty repository (e.g. `speakflow`).
   - Push this folder to it:
     ```bash
     git init
     git add .
     git commit -m "SpeakFlow initial version"
     git branch -M main
     git remote add origin https://github.com/YOUR-USERNAME/speakflow.git
     git push -u origin main
     ```

2. **Connect Vercel**
   - Go to [vercel.com](https://vercel.com) and sign up with your GitHub account (free).
   - Click **Add New… → Project**, pick your `speakflow` repo, click **Import**.
   - Vercel auto-detects Vite. Leave everything as-is and click **Deploy**.

3. **Done.** In about a minute you get a live URL like `speakflow.vercel.app`.
   Every time you `git push`, Vercel redeploys automatically. HTTPS is included
   (the microphone requires HTTPS — Vercel gives you that for free).

> Netlify and Cloudflare Pages work the same way if you prefer them.

---

## How it's built to grow (the important part)

Three things are kept in their own files so you upgrade ONE file at a time
without touching the rest of the app:

| Want to upgrade…                | Change this file        | Cost |
|---------------------------------|-------------------------|------|
| Better transcription accuracy   | `src/lib/speech.js`     | Paid speech API (Whisper etc.), free browser version works fine to start |
| Save data across devices + login| `src/lib/storage.js`    | Supabase — free tier, then ~$25/mo at scale |
| Real AI grammar correction      | `src/lib/feedback.js`   | Claude API — pay per use, cheap for personal scale |

Each file has comments at the top showing exactly what to replace.

### When you're ready for accounts + cloud saving (Supabase)
1. Create a free project at [supabase.com](https://supabase.com).
2. `npm install @supabase/supabase-js`
3. Follow the commented example in `src/lib/storage.js` — replace the four
   function bodies with Supabase calls. Add your Supabase URL + key as Vercel
   environment variables (never hard-code them).

### When you want real grammar feedback (Claude API)
Because grammar review means sending text to a paid AI, you add a tiny
serverless function to keep your API key secret (Vercel supports these for
free). Then uncomment the `getAiFeedback` example in `src/lib/feedback.js`.
Claude is a strong fit here — it corrects grammar *and* explains how to phrase
things more naturally, which is exactly the "here's what to modify" experience
you're after.

---

## Project structure

```
speakflow/
├── index.html
├── package.json
├── vercel.json
├── vite.config.js
└── src/
    ├── main.jsx          app entry
    ├── App.jsx           UI + flow (record → transcribe → feedback → save)
    ├── styles.css
    └── lib/
        ├── speech.js     ← swap to upgrade transcription
        ├── storage.js    ← swap to add a database
        └── feedback.js   ← swap to add AI grammar review
```
