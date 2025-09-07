# ⏱️ Pomox

https://pomox.vercel.app

A sleek, keyboard-friendly **Pomodoro timer** built with **React + Vite + Tailwind v4**.  
Features cycle tracking, auto-start, sound & desktop notifications, and daily stats — all persisted in `localStorage`.

---

## 🎨 Themes

**Midnight Edition (default):**  
Dark, modern, and focused — cyan + emerald accents on a deep slate background.

<img width="1082" height="844" alt="Midnight Edition screenshot" src="https://github.com/user-attachments/assets/8b4f4ea4-be60-450d-8a9c-ff9b6e4a885a" />

**Sunrise Edition:**  
Bright and warm — amber + rose tones for a light, uplifting feel.

<img width="1082" height="844" alt="Sunrise Edition screenshot" src="https://github.com/user-attachments/assets/b4dbabf5-a464-4d6d-9544-5a153e1491b8" />

Switch between themes anytime using the **Theme button** or press **T** on your keyboard.

---

## ✨ Features
- **Pomodoro / Short / Long breaks** with customizable lengths  
- **Cycle logic** (long break every N pomodoros)  
- **Start / Pause / Reset / Skip** controls  
- **Auto-start next session** (optional)  
- **Sound + desktop notifications** when sessions end  
- **Keyboard shortcuts** → Space (Start/Pause), **R** (Reset), **N** (Skip), **T** (Theme)  
- **Progress ring** with smooth animations  
- **Daily stats** (focus minutes & sessions)  
- **LocalStorage persistence**  
- Built entirely with **React + Tailwind v4 + Vite**

---

## 🚀 Getting Started

```bash
# 1. Clone the repo
git clone https://github.com/<your-username>/pomox.git
cd pomox

# 2. Install dependencies
npm install

# 3. Run locally
npm run dev
# open http://localhost:5173

# 4. Build for production
npm run build
npm run preview
