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

Stats for GitHub, OGS, LeetCode, Duolingo, published blog articles and gallery photos refresh
in the browser when their hover/focus/tap cards open. Successful responses are cached
locally (one hour, 24 hours for the archived gallery), with
an eight-second request timeout and a five-minute retry delay after failures.
The cards show when the data was checked and retain a labeled snapshot if a service
is unavailable. `app/data/stats.json` holds the verified fallback values. A newer
bundled snapshot supersedes older browser caches, including when a provider fails.
Other platforms remain labeled, dated profile snapshots. No API keys, self-hosted backend, scheduled workflow,
or new GitHub Action is used for stats; the existing Pages deployment is unchanged.

The October 23, 2026 refresh checked all seven existing public-data providers and
the following profile pages. These manual sources do not gain browser polling:

| Profile | Verified snapshot |
| --- | --- |
| [Kaggle](https://www.kaggle.com/sirteo) | 43 competitions, 4 code notebooks, 2 writeups, joined 2019 |
| [Devpost](https://devpost.com/zengwc-teo2016) | 1 project, 2 hackathons, 1 achievement, 1 like |
| [Scholar](https://scholar.google.com/citations?user=lLhU3igAAAAJ&hl=en) | 5 articles, 9 citations, h-index 1, i10-index 0 |
| [YouTube](https://www.youtube.com/@teozeng3999) | 44 videos, 30 subscribers |
| [Reddit](https://www.reddit.com/user/Puzzleheaded_Bid_178/) | 32 karma, 28 contributions, joined 2021 |
| [Bilibili](https://space.bilibili.com/299736746) | 70 videos, 200 followers, 1,387 likes, level 5 |
| [Instagram](https://www.instagram.com/sir_teo) | 533 followers, 577 following |
| [Steam](https://steamcommunity.com/profiles/76561198413328513/) | level 47, 57 games, 11 badges, 17 reviews |
| [LinkedIn](https://www.linkedin.com/in/teozeng/) | 500+ connections, Data Scientist, Greater Boston |

Bilibili's 73 submissions include other formats; the video count is 70. Instagram
does not expose a post count on the public private-profile view, so the card keeps
only its visible follower/following counts. Reddit now uses the displayed
contributions total instead of the previously ambiguous Post/Comment labels.
Clash of Stats blocked verification; its prior snapshot has no new check date.
Strava's official embed was verified to show the current October 19–25 week.

LeetCode uses the public [LeetCard](https://github.com/JacobLinCool/LeetCode-Stats-Card)
service with fonts and animation disabled (~7 KB). Only its named text counters are
parsed; its SVG is never inserted into the page. Identity and total checks reject
the service's HTTP-200 error cards, which can contain random example counts.
Duolingo uses [Duo Streak Tracker](https://github.com/marlonangeli/duolingo-streak-tracker)'s
small public JSON endpoint (~2 KB), verifying the account ID and username. These
community services cache upstream data, so “Checked” describes the last successful
request, not a guarantee of instant platform updates. Both keep dated fallback values.

Strava uses the official weekly-summary embed copied from the athlete profile's
“Share Your Activities” dialog. It mounts only while its card is open, with a fixed
160 px height and fluid width. Its server-rendered stats need no JavaScript, so the
iframe sandbox disables scripts while retaining user-initiated profile links.
This avoids loading Strava's application/analytics scripts or an in-card cookie banner.
The embed controls its own freshness and light appearance; an always-visible profile
link remains available if it is blocked. Update `stravaSummary` in `app/data/profile.ts`
if the public embed URL changes.

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
