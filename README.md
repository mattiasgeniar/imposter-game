# Imposter

A single-device "find the imposter" party game. Pass the phone around: everyone holds to reveal their secret word, except one player who sees `IMPOSTER` and has to bluff. After the round timer, vote anonymously and unmask them.

Hey, this game is now available at **https://imposter.ma.ttias.be/** — installable as a PWA, fully offline once loaded. No tracking, no analytics, no accounts; everything runs client-side and nothing ever leaves the device (player names and settings live in `localStorage`).

<p align="center">
  <img src="docs/screenshot.png" alt="Imposter home screen" width="320">
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

## Contributing words

Word lists live as JSON in [`src/locales/<locale>/words/`](src/locales). To add or edit content, no code changes are needed — just edit the JSON.

To add a new language, drop a folder next to `nl-BE/` and `en/` mirroring its structure, then add the locale code to `AVAILABLE_LOCALES` in [`src/i18n/locales.ts`](src/i18n/locales.ts).

## Licence

MIT for the code in this repo. The face-with-monocle icon is derived from [Twemoji](https://github.com/jdecked/twemoji) (CC-BY 4.0) — see [`LICENSE-TWEMOJI.md`](LICENSE-TWEMOJI.md).
