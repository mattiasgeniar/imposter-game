# Imposter

A single-device "find the imposter" party game. Pass the phone around: everyone holds to reveal their secret word, except one player who sees `IMPOSTER` and has to bluff. After the round timer, vote anonymously and unmask them.

Hey, this game is now available at **https://imposter.ma.ttias.be/** — installable as a PWA, fully offline once loaded. No tracking, no analytics, no accounts; everything runs client-side and nothing ever leaves the device (player names and settings live in `localStorage`).

<p align="center">
  <img src="docs/screenshots.png" alt="Imposter — home, categories, settings, and a round in progress" width="900">
</p>

## Stack

React 19 · TypeScript · Vite · Tailwind · vite-plugin-pwa.

## Run it locally

```bash
npm install
npm run dev
```

Production build + offline preview:

```bash
npm run build
npm run preview
```

## Self-hosting

The build is a static `dist/` directory — any static host works. A reference [`Caddyfile.example`](Caddyfile.example) is included with the cache-control headers and security headers used in production. Replace the placeholders with your domain and paths, drop it into Caddy's site-config directory, and `rsync` the `dist/` after each build.

## Contributing words

Word lists live as JSON in [`src/locales/<locale>/words/`](src/locales). To add or edit content, no code changes are needed — just edit the JSON.

To add a new language, drop a folder next to `nl-BE/` and `en/` mirroring its structure, then add the locale code to `AVAILABLE_LOCALES` in [`src/i18n/locales.ts`](src/i18n/locales.ts).

## Licence

MIT. The theatre-masks app icon is a custom AI-generated illustration; the source PNG and regeneration steps live in [`design/`](design/).
