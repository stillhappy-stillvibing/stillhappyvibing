# ✨ Sparks Of Joy ✨

Smile, and the whole world smiles with you. A Progressive Web App (PWA) to find your spark of joy through daily practices, wisdom, and mindfulness.

![Sparks Of Joy](https://img.shields.io/badge/2026-Sparks%20Of%20Joy-yellow)
![PWA](https://img.shields.io/badge/PWA-Ready-green)
![React](https://img.shields.io/badge/React-18-blue)

## Features

- 🕐 **Dual Timers** - Track time in 2026 and your current happiness streak
- ✅ **Check-ins** - Log what's bringing you happiness
- 🙏 **Gratitude Journal** - Record what you're grateful for
- 📖 **Wisdom Quotes** - Inspiration from diverse traditions (Buddhist, Stoic, Sufi, and more)
- 🧘 **Breathing Exercises** - Guided meditations to reset
- 🏆 **Leaderboard** - Track your happiness streaks
- 🏅 **Badges** - Unlock achievements
- 📊 **Progress Tracking** - See patterns in what brings you joy
- 🔒 **Privacy First** - All data stored locally on your device
- 📱 **PWA** - Install on your phone like a native app
- 🔔 **Auto-Update Notifications** - Get notified when new versions are available

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deploy to Vercel (Recommended)

1. Push this project to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your GitHub repo
5. Click "Deploy"

That's it! Your app will be live at `your-project.vercel.app`

## Deploy to Netlify

1. Push to GitHub
2. Go to [netlify.com](https://netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Connect your GitHub repo
5. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Click "Deploy"

## Deploy to GitHub Pages

```bash
# Install gh-pages
npm install -D gh-pages

# Add to package.json scripts:
# "predeploy": "npm run build",
# "deploy": "gh-pages -d dist"

# Deploy
npm run deploy
```

## Install as PWA

Once deployed, users can install the app:

### On iPhone/iPad:
1. Open the site in Safari
2. Tap the Share button
3. Tap "Add to Home Screen"

### On Android:
1. Open the site in Chrome
2. Tap the menu (3 dots)
3. Tap "Add to Home Screen"

### On Desktop:
1. Open the site in Chrome/Edge
2. Click the install icon in the address bar

## PWA Icons

For production, you should generate proper PWA icons. You can use:
- [PWA Asset Generator](https://github.com/nicknisi/pwa-asset-generator)
- [Favicon.io](https://favicon.io/)
- [RealFaviconGenerator](https://realfavicongenerator.net/)

Place these files in `/public`:
- `pwa-192x192.png` (192x192)
- `pwa-512x512.png` (512x512)
- `apple-touch-icon.png` (180x180)

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **vite-plugin-pwa** - PWA support
- **localStorage** - Data persistence

## Version Update Notifications

The app automatically checks for new versions every 5 minutes. When a new version is deployed:

1. A colorful notification banner appears at the top of the screen
2. Users can click "Update Now" to refresh and get the latest version
3. The notification can be dismissed if users want to update later
4. All service workers and caches are cleared to ensure a clean update

### How it works:

- During build, `generate-version.js` creates a `version.json` file with the current version from `package.json`
- The app periodically fetches this file to check for version changes
- Cache-busting ensures the latest version info is always retrieved
- When versions don't match, the update notification is shown

### For developers:

To trigger the update notification in production:
1. Update the version in `package.json` (e.g., `2.3.0` → `2.4.0`)
2. Run `npm run build` (this auto-generates the new `version.json`)
3. Deploy the build
4. Users will see the update notification within 10 seconds to 5 minutes

## Privacy

All data is stored locally in your browser using localStorage. Nothing is sent to any server. Your gratitude journal and happiness data are completely private.

## License

MIT - Feel free to use, modify, and share!

---

Made with 💛 for a happier 2026
