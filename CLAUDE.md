# Imposter Game

Static Vite + React PWA. No backend, no database. Caddy serves the built `dist/` contents directly.

## Server layout

```
/var/www/html/imposter.ma.ttias.be/
├── repo/     # git checkout (build happens here)
├── public/   # built dist/ — what Caddy serves
└── logs/     # access.log
```

## First-time setup (fresh deploy)

1. `ssh www-data@srv01.ma.ttias.be -p 9999 -A`
2. `mkdir -p ~/html/imposter.ma.ttias.be/{public,logs}`
3. `cd ~/html/imposter.ma.ttias.be && git clone git@github.com:mattiasgeniar/imposter-game.git repo`
4. `cd repo && npm ci && npm run build`
5. `rsync -a --delete dist/ ../public/`
6. Drop `imposter.ma.ttias.be.conf` into `/etc/caddy/conf.d/` (sudo)
7. `sudo systemctl reload caddy`
8. Verify: `curl -I https://imposter.ma.ttias.be/` returns 200

## Deploy

1. `ssh www-data@srv01.ma.ttias.be -p 9999 -A`
2. `cd ~/html/imposter.ma.ttias.be/repo`
3. `git pull`
4. `npm ci && npm run build`
5. `rsync -a --delete dist/ ../public/`
6. Verify the site loads in a browser (cache-busted):
   - Generate a timestamp: `date +%s`
   - Navigate (ignoreCache) to `https://imposter.ma.ttias.be/?deploy-verification={timestamp}`
   - Confirm the page renders
   - Grep the access log for `deploy-verification={timestamp}` to prove it's the live build serving the request: `grep "deploy-verification={timestamp}" ~/html/imposter.ma.ttias.be/logs/access.log`

No service to restart — Caddy serves files straight off disk.

## PWA update behaviour

Build uses `registerType: 'autoUpdate'` with Workbox precaching (`vite.config.ts`). Words, categories, and UI strings are bundled JSON, so they ship inside the hashed JS bundle and update with every deploy.

After a deploy, installed PWAs pick up the new version on their **next** launch (the service worker fetches `sw.js`, sees the new hash, precaches the new bundle, and activates). The currently-open session keeps serving the old cached bundle until it's restarted.

The Caddy config sets `Cache-Control: public, max-age=86400` on `index.html`, `sw.js`, and `manifest.webmanifest` — browsers will also bypass the HTTP cache for the SW request once it's >24h old, so this is the right ceiling. `/assets/*` (Vite-hashed) is cached `immutable` for a year.

## Logs

- Access log: `~/html/imposter.ma.ttias.be/logs/access.log`
- Caddy errors: `journalctl -u caddy`

## Local development

- `npm run dev` — Vite dev server on `http://localhost:5173`. PWA disabled in dev (`devOptions.enabled: false`).
- `npm run build` — production build into `dist/`.
- `npm run test:run` — Vitest one-shot run.
- `npm run lint` — ESLint.
