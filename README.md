# CrashCourse⚡

Turn chaotic YouTube playlists into structured learning paths with progress tracking, AI quizzes, streaks, XP, and gamified milestones.

Built because my “Watch Later” playlist was becoming a graveyard of unfinished tutorials 💀

---
## Screenshots
<img width="1918" height="950" alt="Screenshot 2026-05-24 221759" src="https://github.com/user-attachments/assets/b4d3c38f-a0b4-4501-9cf9-be244ebb058c" />


<img width="1914" height="951" alt="Screenshot 2026-05-24 221842" src="https://github.com/user-attachments/assets/6e4fc9e9-201c-4d79-9e5b-3e2bdb90b9a3" />


<img width="1919" height="937" alt="Screenshot 2026-05-24 221835" src="https://github.com/user-attachments/assets/dc4b6bff-637b-49b5-846d-2b2d03387051" />




## Features

- 📎 Import YouTube playlists as full courses
- ✏️ Manual lesson/course creation
- 🗓️ Timeline-based lesson flow with deadlines
- 🧠 AI-generated quizzes after each lesson
- 🔒 Sequential lesson unlock system
- 🏆 Gamified badges & achievements
- ⚡ XP + leveling system
- 🔥 Daily streak tracking
- 💾 LocalStorage support (no backend required)
- 🎯 Custom learning pace selection

---

## Tech Stack

- HTML
- CSS
- JavaScript
- Groq API
- YouTube Data API v3

---

# Setup

## 1. Clone the Repository

```bash
git clone <repo-url>
cd crashcourse
```

---

## 2. Create `config.js`

Create a file named `config.js` in the root folder.

```js
const CONFIG = {
  GROQ_API_KEY: "your_groq_api_key",
  YOUTUBE_API_KEY: "your_youtube_api_key",

  GROQ_MODEL: "llama3-8b-8192",
  QUIZ_QUESTIONS: 4,
  DAYS_PER_LESSON: 2
};
```

---

## 3. Run the App

You can simply open:

```bash
index.html
```

Or run a local server:

```bash
python3 -m http.server 8080
```

Then open:

```bash
http://localhost:8080
```

---

# API Keys

## Groq API Key

Used for AI-generated quizzes.

Get it from:

```bash
https://console.groq.com/keys
```

---

## YouTube Data API Key

Used for playlist importing.

Steps:
1. Create a Google Cloud project
2. Enable YouTube Data API v3
3. Generate an API key

```bash
https://console.cloud.google.com/
```

> Manual course mode works without YouTube API.

---

# File Structure

```bash
crashcourse/
│
├── index.html
├── config.js
│
├── css/
│   └── style.css
│
└── js/
    ├── app.js
    ├── storage.js
    ├── badges.js
    ├── youtube.js
    └── quiz.js
```

---

# XP System

| Action | XP |
|--------|----|
| Complete lesson | +20 |
| Pass quiz | +50 |
| Fail quiz | +10 |
| Unlock badge | +50 |

Every 500 XP = Level Up

---

# Badges

- 🎬 First Step
- 🧠 Quiz Taker
- ⭐ Ace
- 🔥 Halfway There
- 🏆 Graduate
- ⚡ On a Roll
- 🌟 Committed
- 🚀 Speed Learner
- 🦉 Night Owl
- 💎 Perfectionist

---

# Notes

- Currently designed for local usage
- Users can fork the project and add their own API keys via `config.js`
- Public deployment and in-app API key support may come later
- All progress is stored in browser localStorage

---

# Why I Built This

I kept saving playlists, courses, and tutorials...

…but never actually finishing them.

So I wanted something that makes learning feel:
- structured
- trackable
- rewarding
- and actually finishable

CrashCourse⚡ is basically my attempt at fixing tutorial hoarding.


-----------------------------------------------------------------currently system updates in progress------------------------------------------------------------------------
