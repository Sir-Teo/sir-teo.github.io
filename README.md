# Professional Personal Website

code for [teozeng.dev](https://teozeng.dev/)

Hosted on GitHub Pages from `Sir-Teo/sir-teo.github.io`. The former `aboutme`
repository was renamed here so its history stays with the current site.
The previous personal website is preserved in the read-only
[`sir-teo.github.io-archive`](https://github.com/Sir-Teo/sir-teo.github.io-archive)
repository; its gallery remains available through the homepage and `/gallery/`.

Pushes to `main` run lint, type checks, tests and a static build, then deploy
`publish/` through `.github/workflows/deploy.yml`. Pull requests run the same
checks without publishing. Pages must use GitHub Actions as its build source,
with `teozeng.dev` as the custom domain. No hosting credentials are needed by CI.
The Firebase configuration is retained only for rollback to the former host.

Stats for GitHub, Chess.com, OGS, published blog articles and gallery photos refresh
in the browser when their hover/focus/tap cards open. Successful responses are cached
locally (one hour, 12 hours for Chess.com, 24 hours for the archived gallery), with
an eight-second request timeout and a five-minute retry delay after failures.
The cards show when the data was checked and retain a labeled snapshot if a service
is unavailable. `app/data/stats.json` holds the verified fallback values; Genshin is
snapshot-only because Enka does not allow cross-origin browser requests. Other
platforms remain labeled profile snapshots. No API keys, proxy, scheduled workflow,
or new GitHub Action is used for stats; the existing Pages deployment is unchanged.

The Projects section uses the same pills as profile links. Edit the `projects` array
in `app/data/profile.ts` to change each introduction, feature tags and destination.
Previews open on hover or keyboard focus; on touch, tap once to preview and again
to visit. Escape or tapping outside dismisses the preview.

This project is a pure front-end website based on the Next.js framework, designed to showcase and introduce personal information.

## Getting Started

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

then visit, <b> http://localhost:3000 </b>
<br />

## Installation and Deployment

You can generate a pure static page by running npm run build, which can be deployed on various static servers.

```bash
npm run build
# or
yarn build
# or
pnpm build
```

## Configuration and Usage

Before using the project, edit [app/data/profile.ts](./app/data/profile.ts) to update the profile, links, and QR-code content shown on the page. You can also add new icons under [public/icons](./public/icons).
<br>
